import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, ImageIcon, X, Loader2 } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (url: string) => void;
}

export function QrScannerModal({ open, onClose, onScan }: QrScannerModalProps) {
  const [mode, setMode] = useState<"camera" | "image">("camera");
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // state 2 = scanning
        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch {
        // ignore
      }
      scannerRef.current.clear();
      scannerRef.current = null;
    }
  }, []);

  const handleResult = useCallback((decodedText: string) => {
    stopScanner();
    onScan(decodedText);
    onClose();
  }, [onScan, onClose, stopScanner]);

  // Start camera scanner
  useEffect(() => {
    if (!open || mode !== "camera") return;

    let cancelled = false;

    const startCamera = async () => {
      setError(null);
      setScanning(true);

      // Small delay to let DOM render
      await new Promise((r) => setTimeout(r, 300));
      if (cancelled) return;

      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (!cancelled) handleResult(decodedText);
          },
          () => {} // ignore errors during scanning
        );
      } catch (err: any) {
        if (!cancelled) {
          setError("No se pudo acceder a la cámara. Probá subiendo una imagen con QR.");
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
    }
  }, [open, stopScanner]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    setError(null);
    setScanning(true);

    try {
      const scanner = new Html5Qrcode("qr-reader-file");
      const result = await scanner.scanFile(file, true);
      scanner.clear();
      handleResult(result);
    } catch {
      setError("No se detectó un código QR en la imagen. Intentá con otra foto.");
      setScanning(false);
    }
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
              onClick={() => { stopScanner(); setMode("camera"); setError(null); }}
            >
              <Camera className="w-4 h-4" />
              Cámara
            </Button>
            <Button
              variant={mode === "image" ? "default" : "outline"}
              size="sm"
              className="flex-1 gap-2 rounded-xl"
              onClick={() => { stopScanner(); setMode("image"); setError(null); }}
            >
              <ImageIcon className="w-4 h-4" />
              Subir imagen
            </Button>
          </div>

          {mode === "camera" && (
            <div className="space-y-2">
              <div
                id="qr-reader"
                ref={containerRef}
                className="w-full min-h-[280px] rounded-xl overflow-hidden bg-muted"
              />
              <p className="text-xs text-muted-foreground text-center">
                Apuntá la cámara al código QR del aviso
              </p>
            </div>
          )}

          {mode === "image" && (
            <div className="space-y-3">
              {/* Hidden div needed by html5-qrcode */}
              <div id="qr-reader-file" className="hidden" />

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
              Analizando imagen...
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
