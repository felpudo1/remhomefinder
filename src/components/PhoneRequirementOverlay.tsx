import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputPhone } from "@/components/ui/InputPhone"; // Usamos el componente oficial
import { Phone, AlertCircle, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Overlay de Requerimiento de Teléfono.
 * 
 * Basado en la REGLA 2 y las preferencias de estética premium de JP.
 * Ahora usa InputPhone para coincidir con el diseño de Sign In.
 */
export function PhoneRequirementOverlay() {
  const { user } = useCurrentUser();
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useProfile();
  
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determinar si debemos mostrar el modal
  useEffect(() => {
    const isGoogleUser = user?.app_metadata?.provider === "google";
    // No mostrar si estamos en el flujo QR (pending_property_save) — se omite teléfono en ese flujo
    // Check both sessionStorage (primary) and localStorage (backup, survives OAuth redirect)
    const hasPendingQrSave = Boolean(
      sessionStorage.getItem("pending_property_save") ||
      localStorage.getItem("pending_property_save_backup")
    );
    // Flag que indica que el QR save acaba de completarse (seteado por Index.tsx)
    const qrSaveJustCompleted = sessionStorage.getItem("qr_save_just_completed") === "1";

    if (!isProfileLoading && user && profile && !profile.phone && isGoogleUser && !hasPendingQrSave) {
      setIsOpen(true);
      // Limpiar el flag después de abrir
      if (qrSaveJustCompleted) {
        sessionStorage.removeItem("qr_save_just_completed");
      }
    } else {
      setIsOpen(false);
    }
  }, [isProfileLoading, user, profile]);

  // Re-evaluar cuando se completa un save QR (para mostrar el modal de teléfono post-save)
  useEffect(() => {
    const handleSaveCompleted = () => {
      // Force re-check: refetch profile to get fresh data
      refetchProfile();
      // Limpiar el pending save backup por si acaso
      localStorage.removeItem("pending_property_save_backup");
      localStorage.removeItem("pending_save_url_fallback");
    };
    window.addEventListener("qr_save_completed", handleSaveCompleted);
    return () => window.removeEventListener("qr_save_completed", handleSaveCompleted);
  }, [refetchProfile]);

  /**
   * Lógica especial solicitada por JP:
   * 1. No dejar escribir el 0 al inicio tras el prefijo.
   * 2. Evitar que el usuario repita "598" tiéandolo adentro de la caja.
   */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    let val = e.target.value;
    
    // El InputPhone devuelve algo como "+598 xxxxx"
    // Queremos validar la parte de después del +598
    const prefix1 = "+598 ";
    const prefix2 = "+598";
    
    let numberPart = val;
    let actualPrefix = "";

    if (val.startsWith(prefix1)) {
      numberPart = val.slice(prefix1.length).trim();
      actualPrefix = prefix1;
    } else if (val.startsWith(prefix2)) {
      numberPart = val.slice(prefix2.length).trim();
      actualPrefix = prefix2;
    }

    if (actualPrefix) {
      // Si el usuario intentó escribir "598" manual al inicio de SU CÓDIGO 
      if (numberPart.startsWith("598") && numberPart.length > 3) {
        numberPart = numberPart.slice(3).trim();
      }

      // Si el usuario intenta escribir un 0 al inicio del número móvil, lo removemos
      if (numberPart.startsWith("0")) {
        numberPart = numberPart.slice(1).trim();
      }
      
      val = actualPrefix + (numberPart ? " " + numberPart : "");
    }

    setPhone(val);
  };

  /**
   * Valida y guarda el teléfono en el perfil.
   * El componente InputPhone ya incluye el prefijo en el valor de salida (+598)
   */
  const handleSavePhone = async () => {
    if (!phone.trim()) {
      setError("Por favor ingrese un numero de celular");
      return;
    }

    // El valor que viene es "+598 94XXXXXX". A DB se va sin espacios pero conservando el +
    const finalPhone = phone.replace(/\s+/g, "");

    setIsSaving(true);
    setError(null);

    try {
      if (!user) return;

      console.log("[PhoneRequirementOverlay] Guardando teléfono", {
        userId: user.id,
        phone: finalPhone,
        referralId: localStorage.getItem("hf_referral_id"),
        hasPendingSave: Boolean(sessionStorage.getItem("pending_property_save")),
      });

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ phone: finalPhone })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast.success("Teléfono guardado");
      await refetchProfile();
      console.log("[PhoneRequirementOverlay] Teléfono guardado correctamente", {
        userId: user.id,
        referralId: localStorage.getItem("hf_referral_id"),
        hasPendingSave: Boolean(sessionStorage.getItem("pending_property_save")),
      });
      setIsOpen(false);
    } catch (err: any) {
      console.error("Error saving phone:", err);
      toast.error("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-[0_0_80px_rgba(var(--primary-rgb),0.2)] animate-in zoom-in-95 duration-500 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-10 flex flex-col items-center text-center ring-1 ring-white/10">
          
          {/* Decoración Background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />

          {/* Icono Premium */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full scale-150 animate-pulse" />
            <div className="relative w-16 h-16 bg-gradient-to-tr from-primary to-blue-400 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 transition-transform">
              <Phone className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </div>

          {/* Texto con Bienvenida sugerido por JP */}
          <div className="space-y-4 mb-8">
            <h2 className="text-3xl font-black tracking-tight text-white leading-tight">
              ¡Hola, {profile?.displayName?.split(" ")[0] || "bienvenido"}!
            </h2>
            <p className="text-blue-100/70 text-sm font-medium">
              Por favor ingrese un numero de celular
            </p>
          </div>

          {/* Formulario usando InputPhone */}
          <div className="w-full space-y-4">
            <div className="text-left">
              <InputPhone
                countryCode="+598"
                placeholder="94 123 456"
                value={phone}
                onChange={handlePhoneChange}
                showIcon={true}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                onKeyDown={(e) => e.key === "Enter" && handleSavePhone()}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-300 px-2 mt-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </div>
            )}

            <Button
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 text-base mt-2"
              onClick={handleSavePhone}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar y continuar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
