import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, ImageIcon, Loader2 } from "lucide-react";

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (url: string) => void;
}

export function QrScannerModal({ open, onClose, onScan }: QrScannerModalProps) {
  const [mode, setMode] = useState<"camera" | "image">("camera");
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      const state = scanner.getState();
      if (state === 2) await scanner.stop();
    } catch { /* ignore */ }
    try { scanner.clear(); } catch { /* ignore */ }
    scannerRef.current = null;
  }, []);

  const handleResult = useCallback((decodedText: string) => {
    if (hasScannedRef.current) return;
    hasScannedRef.current = true;
    stopScanner();
    onScan(decodedText);
    onClose();
  }, [onScan, onClose, stopScanner]);

  // Start camera scanner
  useEffect(() => {
    if (!open || mode !== "camera") return;

    let cancelled = false;
    hasScannedRef.current = false;

    const startCamera = async () => {
      setError(null);
      setScanning(true);

      if (!window.isSecureContext) {
        setError("Para usar la cámara necesitás abrir la app en HTTPS. Mientras tanto podés usar \"Subir imagen\".");
        setScanning(false);
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Tu navegador no soporta acceso a cámara. Usá \"Subir imagen\".");
        setScanning(false);
        return;
      }

      await new Promise((r) => setTimeout(r, 450));
      if (cancelled || !mountedRef.current) return;

      const container = document.getElementById("qr-reader");
      if (!container) {
        setError("No se pudo inicializar el escáner. Probá subiendo una imagen.");
        setScanning(false);
        return;
      }

      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        const onSuccess = (decodedText: string) => {
          if (!cancelled) handleResult(decodedText);
        };

        const candidates: Array<string | { facingMode: "environment" | "user" }> = [];

        // Try by constraints first (more reliable prompt on mobile browsers)
        candidates.push({ facingMode: "environment" });

        const cameras = await Html5Qrcode.getCameras().catch(() => []);
        if (cameras.length > 0) {
          const rear = cameras.find((c) => /back|rear|environment|trasera|traseira/i.test(c.label));
          if (rear?.id) candidates.push(rear.id);
          if (cameras[0]?.id && cameras[0].id !== rear?.id) candidates.push(cameras[0].id);
        }

        // Last fallback
        candidates.push({ facingMode: "user" });

        let lastError: unknown = null;
        for (const candidate of candidates) {
          try {
            await scanner.start(candidate as any, config, onSuccess, () => {});
            return;
          } catch (e) {
            lastError = e;
          }
        }

        throw lastError;
      } catch (err: any) {
        if (!cancelled && mountedRef.current) {
          const name = err?.name || "";
          const msg = err?.message || "";
          console.warn("QR camera error:", name, msg, err);
          
          const denied = name === "NotAllowedError" || name === "PermissionDeniedError"
            || msg.includes("Permission") || msg.includes("denied") || msg.includes("dismiss");
          const inUse = name === "NotReadableError" || name === "TrackStartError"
            || msg.includes("Could not start video") || msg.includes("in use");
          const notFound = name === "NotFoundError" || name === "DevicesNotFoundError"
            || msg.includes("Requested device not found");

          if (denied) {
            setError(
              "La cámara está bloqueada para este sitio. Tocá el ícono 🔒 en la barra de direcciones, habilitá \"Cámara\", recargá la página y reintentá. O usá \"Subir imagen\"."
            );
            setScanning(false);
          } else if (inUse) {
            setError("No se pudo abrir la cámara (puede estar en uso por otra app/pestaña). Cerrá otras apps de cámara y reintentá.");
            setScanning(false);
          } else if (notFound) {
            setError("No se encontró una cámara en este dispositivo. Usá \"Subir imagen\".");
            setScanning(false);
          } else {
            // Auto-switch to image mode on unknown errors
            setError(`No se pudo iniciar la cámara (${name || "error desconocido"}). Cambiando a modo imagen.`);
            setScanning(false);
            setTimeout(() => {
              if (mountedRef.current) switchMode("image");
            }, 2000);
          }
        }
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopScanner();
      setScanning(false);
    };
  }, [open, mode, handleResult, stopScanner]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      stopScanner();
      setError(null);
      setScanning(false);
      setMode("camera");
      hasScannedRef.current = false;
    }
  }, [open, stopScanner]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    setError(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      // Create a visible but off-screen container (display:none breaks scanning)
      let container = document.getElementById("qr-reader-file");
      if (container) container.remove();
      container = document.createElement("div");
      container.id = "qr-reader-file";
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "-9999px";
      container.style.width = "300px";
      container.style.height = "300px";
      document.body.appendChild(container);

      const scanner = new Html5Qrcode("qr-reader-file");

      // Try scanning with different verbosity settings
      let result: string | null = null;
      try {
        result = await scanner.scanFile(file, /* showImage */ true);
      } catch {
        // Retry without showing image
        try {
          result = await scanner.scanFile(file, false);
        } catch { /* will handle below */ }
      }

      try { scanner.clear(); } catch { /* ignore */ }
      try { container.remove(); } catch { /* ignore */ }

      if (result) {
        handleResult(result);
      } else {
        setError("No se detectó un código QR en la imagen. Asegurate de que el QR se vea nítido y completo, e intentá con otra foto.");
        setScanning(false);
      }
    } catch {
      setError("No se detectó un código QR en la imagen. Asegurate de que el QR se vea nítido y completo, e intentá con otra foto.");
      setScanning(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const switchMode = (newMode: "camera" | "image") => {
    stopScanner();
    setMode(newMode);
    setError(null);
    setScanning(false);
    hasScannedRef.current = false;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear código QR</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode tabs */}
          <div className="flex gap-2">
            <Button
              variant={mode === "camera" ? "default" : "outline"}
              size="sm"
              className="flex-1 gap-2 rounded-xl"
              onClick={() => switchMode("camera")}
            >
              <Camera className="w-4 h-4" />
              Cámara
            </Button>
            <Button
              variant={mode === "image" ? "default" : "outline"}
              size="sm"
              className="flex-1 gap-2 rounded-xl"
              onClick={() => switchMode("image")}
            >
              <ImageIcon className="w-4 h-4" />
              Subir imagen
            </Button>
          </div>

          {mode === "camera" && (
            <div className="space-y-2">
              <div
                id="qr-reader"
                className="w-full min-h-[280px] rounded-xl overflow-hidden bg-muted"
              />
              <p className="text-xs text-muted-foreground text-center">
                Apuntá la cámara al código QR del aviso
              </p>
            </div>
          )}

          {mode === "image" && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Tocá para seleccionar una imagen con QR
                </span>
              </button>
            </div>
          )}

          {scanning && mode === "image" && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analizando imagen…
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl text-center">
              {error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
