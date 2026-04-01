import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, QrCode } from "lucide-react";
import { useCallback, useRef } from "react";

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
  propertyTitle: string;
  propertyId: string;
  publicationId: string;
}

/**
 * Modal que genera un QR on-the-fly para una publicación del marketplace.
 * Nivel de corrección 'H' (High) para lectura en vidrieras con reflejos.
 * NO sube nada a Storage — genera el QR en el cliente.
 */
export function QRCodeModal({
  open,
  onClose,
  propertyTitle,
  propertyId,
  publicationId,
}: QRCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const qrUrl = `${window.location.origin}/p/${propertyId}?source=qr&pub_id=${publicationId}`;

  const handleDownload = useCallback(() => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const size = 600; // High-res for print
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // White background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement("a");
      link.download = `qr-${propertyTitle.slice(0, 30).replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [propertyTitle]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <QrCode className="w-5 h-5" />
            Código QR
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center line-clamp-2">
            {propertyTitle}
          </p>

          <div
            ref={qrRef}
            className="flex justify-center p-6 bg-white rounded-xl"
          >
            <QRCodeSVG
              value={qrUrl}
              size={300}
              level="H"
              includeMargin
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Los usuarios pueden escanear este QR para ver la propiedad sin necesidad de cuenta.
          </p>

          <Button
            onClick={handleDownload}
            className="w-full gap-2"
            variant="outline"
          >
            <Download className="w-4 h-4" />
            Descargar PNG (para imprimir)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
