import { useEffect } from "react";
import { Mail, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Solo dígitos y formato que wa.me entiende: internacional sin "+" ni 0 de marcación nacional.
 * Si en config quedó "0" + 598… (típico Uruguay), WhatsApp no abre bien el chat con texto; hay que quitar ese 0.
 */
function normalizePhoneDigitsForWaMe(supportPhone: string): string {
  let digits = (supportPhone || "").replace(/\D/g, "");
  if (digits.startsWith("0598")) {
    digits = digits.slice(1);
  }
  return digits;
}

/**
 * Arma el texto y la URL de WhatsApp para el link de soporte (un solo lugar para href y debug).
 */
function buildSupportWhatsAppLink(
  supportPhone: string,
  profileEmail: string | null | undefined,
  userEmail: string | null,
  profileUserId: string | null | undefined
) {
  const phoneDigits = normalizePhoneDigitsForWaMe(supportPhone);
  const waMessage =
    "Hola Soporte de HomeFinder \nMe registré recién pero *no encuentro el mail de validación*.\nNecesito que me activen la cuenta por favor.\n\n*Datos para el sistema:*\nEmail: " +
    (profileEmail || userEmail || "No encontrado") +
    "\nID de Usuario: " +
    (profileUserId || "Desconocido") +
    "\nFecha: " +
    new Date().toLocaleString("es-UY");
  const waHref = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(waMessage)}`;
  return { phoneDigits, waMessage, waHref };
}

/**
 * Overlay de bienvenida tras el registro: recuerda validar el email y ofrece contacto por WhatsApp.
 * Se muestra en el dashboard cuando la URL trae ?registered=true (controlado por el padre).
 */
export interface RegistrationEmailWelcomeOverlayProps {
  /** Si true, se renderiza el overlay a pantalla completa */
  open: boolean;
  /** Nombre de marca desde configuración (ej. HomeFinder) */
  appBrandName: string;
  /** Teléfono de soporte para armar el link de WhatsApp */
  supportPhone: string;
  /** Email de sesión (fallback si el perfil aún no tiene email) */
  userEmail: string | null;
  /** Email del perfil, si ya está cargado */
  profileEmail?: string | null;
  /** ID de usuario para el mensaje a soporte y la clave de buyer profile */
  profileUserId?: string | null;
  /** Se ejecuta al pulsar "Entendido" (el padre cierra y puede abrir otros modales) */
  onDismiss: () => void;
}

export function RegistrationEmailWelcomeOverlay({
  open,
  appBrandName,
  supportPhone,
  userEmail,
  profileEmail,
  profileUserId,
  onDismiss,
}: RegistrationEmailWelcomeOverlayProps) {
  const { waHref } = buildSupportWhatsAppLink(
    supportPhone,
    profileEmail,
    userEmail,
    profileUserId
  );

  /**
   * Log de prueba del link wa.me (número, URL). Activado mientras probás; después podés volver a limitar a import.meta.env.DEV.
   */
  useEffect(() => {
    if (!open) return;
    const { phoneDigits, waHref: hrefLogged } = buildSupportWhatsAppLink(
      supportPhone,
      profileEmail,
      userEmail,
      profileUserId
    );
    console.log("[HF WhatsApp] RegistrationEmailWelcomeOverlay", {
      supportPhoneRaw: supportPhone,
      phoneDigits,
      phoneIsEmpty: phoneDigits.length === 0,
      profileEmail,
      userEmail,
      profileUserId,
      waHrefLength: hrefLogged.length,
      waHref: hrefLogged,
    });
  }, [open, supportPhone, profileEmail, userEmail, profileUserId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0 bg-background/60 backdrop-blur-xl" aria-hidden />
      {/* z-10 para que el link y botones queden siempre encima del fondo y reciban el clic */}
      <div className="relative z-10 max-w-md w-full rounded-[2.5rem] border border-border bg-card p-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in duration-300 space-y-8">
        <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-2 relative">
          <Mail className="w-12 h-12 text-primary animate-pulse" />
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-black text-foreground tracking-tight">¡Casi listo! 🚀</h2>
          <p className="text-muted-foreground leading-relaxed font-medium">
            Bienvenido a <strong className="text-foreground">{appBrandName}</strong>. Donde la tecnología te ayuda a descubrir tu lugar en el mundo.
          </p>
        </div>

        <div className="bg-muted/30 rounded-3xl p-6 flex items-start gap-4 text-left border border-border/50">
          <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Te enviamos un enlace mágico a tu correo electrónico. Si no lo ves, revisá en la carpeta de <strong>Spam</strong>.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          <Button
            className="w-full h-14 rounded-2xl text-md font-bold shadow-xl shadow-primary/20 gap-2 group"
            onClick={onDismiss}
          >
            ¡Entendido, vamos! <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <div className="pt-2">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-[2] inline-block cursor-pointer text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
            >
              ¿Problemas con el correo? Contactá a soporte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
