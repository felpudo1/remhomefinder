import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, QrCode } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
  propertyTitle: string;
  propertyId: string;
  publicationId: string;
  /** Agent user ID who published this property — included in QR URL as referral */
  publishedBy?: string;
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
  publishedBy,
}: QRCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Incluir ref en el URL del QR para que ReferralTracker pueda capturarlo
  // sin necesidad de consultar agent_publications (evita RLS de anónimos)
  const qrUrl = `${window.location.origin}/p/${propertyId}?source=qr&pub_id=${publicationId}${publishedBy ? `&ref=${publishedBy}` : ''}`;

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

  /**
   * Copia la URL del QR al portapapeles para pegarla en otra ventana.
   * Usa navigator.clipboard (HTTPS) con fallback a execCommand (HTTP).
   */
  const handleCopyUrl = useCallback(async () => {
    try {
      // Intento 1: API moderna (requiere HTTPS o localhost)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(qrUrl);
      } else {
        // Intento 2: Fallback para HTTP (crea un textarea temporal)
        const textArea = document.createElement("textarea");
        textArea.value = qrUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopied(true);
      toast({
        title: "URL copiada al portapapeles",
        description: "Podés pegarla en otra pestaña o ventana.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Intento 3: Último recurso - mostrar URL en un prompt para copiar manualmente
      try {
        const textArea = document.createElement("textarea");
        textArea.value = qrUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand("copy");
        textArea.remove();
        if (success) {
          setCopied(true);
          toast({
            title: "URL copiada al portapapeles",
            description: "Podés pegarla en otra pestaña o ventana.",
          });
          setTimeout(() => setCopied(false), 2000);
          return;
        }
      } catch (_) {
        // Si todo falla, mostrar la URL en un prompt
        prompt("Copiá la URL manualmente:", qrUrl);
      }
    }
  }, [qrUrl, toast]);

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

          <div className="flex gap-2">
            <Button
              onClick={handleCopyUrl}
              className="flex-1 gap-2"
              variant="secondary"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar URL
                </>
              )}
            </Button>

            <Button
              onClick={handleDownload}
              className="flex-1 gap-2"
              variant="outline"
            >
              <Download className="w-4 h-4" />
              Descargar PNG
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
