import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, QrCode, Printer } from "lucide-react";
import { useCallback, useRef } from "react";

interface ReferralQRModalProps {
  open: boolean;
  onClose: () => void;
  referralLink: string;
  displayName?: string;
}

/**
 * Modal que genera un QR del link de referido del usuario.
 * Nivel de corrección 'H' (High) para lectura confiable.
 * Permite descargar como PNG para imprimir.
 */
export function ReferralQRModal({
  open,
  onClose,
  referralLink,
  displayName,
}: ReferralQRModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const size = 800; // High-res para impresión profesional
    canvas.width = size;
    canvas.height = size + 100; // Espacio extra para texto
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fondo blanco
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Renderizar QR
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      // Dibujar QR centrado arriba
      const qrSize = 600;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 20;
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // Texto inferior
      ctx.fillStyle = "#000000";
      ctx.font = "bold 24px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Escaneá para registrarte", canvas.width / 2, canvas.height - 30);

      const name = `qr-referido-${displayName || "homefinder"}`.replace(/\s+/g, "-").toLowerCase();
      const link = document.createElement("a");
      link.download = `${name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [displayName]);

  const handlePrint = useCallback(() => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const size = 800;
    canvas.width = size;
    canvas.height = size + 120;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const qrSize = 600;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 20;
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      ctx.fillStyle = "#000000";
      ctx.font = "bold 28px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Escaneá para registrarte", canvas.width / 2, canvas.height - 50);
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillStyle = "#666666";
      ctx.fillText(`Referido: ${displayName || "HomeFinder"}`, canvas.width / 2, canvas.height - 25);

      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.write(`
        <html>
          <head><title>QR Referido - ${displayName}</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
            <img src="${canvas.toDataURL("image/png")}" style="max-width:100%;height:auto;" />
            <script>window.onload=()=>{window.print();window.close();}</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [displayName]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <QrCode className="w-5 h-5" />
            Tu Código QR de Referido
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Mostrá este QR para que se registren con tu referido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            ref={qrRef}
            className="flex justify-center p-6 bg-white rounded-xl"
          >
            <QRCodeSVG
              value={referralLink}
              size={300}
              level="H"
              includeMargin
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Al escanear, se abre la app con tu referido pre-cargado.
          </p>

          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              className="flex-1 gap-2"
              variant="outline"
            >
              <Download className="w-4 h-4" />
              Descargar PNG
            </Button>
            <Button
              onClick={handlePrint}
              className="flex-1 gap-2"
              variant="outline"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
