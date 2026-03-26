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

      // Check if camera API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Tu navegador no soporta acceso a la cámara. Usá la opción \"Subir imagen\".");
        setScanning(false);
        return;
      }

      // Request camera permission explicitly first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        // Stop the test stream immediately
        stream.getTracks().forEach((t) => t.stop());
      } catch (permErr: any) {
        if (!cancelled && mountedRef.current) {
          const isDenied = permErr?.name === "NotAllowedError" || permErr?.name === "PermissionDeniedError";
          setError(
            isDenied
              ? "Permiso de cámara denegado. Habilitá el acceso a la cámara en la configuración del navegador y recargá la página, o usá \"Subir imagen\"."
              : "No se pudo acceder a la cámara. Probá con la opción \"Subir imagen\"."
          );
          setScanning(false);
        }
        return;
      }

      // Wait for DOM to render the container
      await new Promise((r) => setTimeout(r, 400));
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

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (!cancelled) handleResult(decodedText);
          },
          () => {}
        );
      } catch (err: any) {
        if (!cancelled && mountedRef.current) {
          console.warn("QR camera error:", err);
          setError("No se pudo iniciar el escáner. Probá con \"Subir imagen\".");
          setScanning(false);
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

      // Ensure the hidden container exists
      let container = document.getElementById("qr-reader-file");
      if (!container) {
        container = document.createElement("div");
        container.id = "qr-reader-file";
        container.style.display = "none";
        document.body.appendChild(container);
      }

      const scanner = new Html5Qrcode("qr-reader-file");
      const result = await scanner.scanFile(file, true);
      try { scanner.clear(); } catch { /* ignore */ }
      handleResult(result);
    } catch {
      setError("No se detectó un código QR en la imagen. Intentá con otra foto.");
      setScanning(false);
    }

    // Reset file input so re-selecting the same file triggers onChange
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
