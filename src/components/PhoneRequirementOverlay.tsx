import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Overlay de Requerimiento de Teléfono.
 * 
 * Se activa si el usuario está logueado pero no tiene un número de teléfono en su perfil.
 * Es crítico para que los agentes puedan contactar a los usuarios.
 * 
 * Basado en la REGLA 2 y las preferencias de estética premium de JP.
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
    // Solo mostrar si el perfil ya cargó, hay usuario y NO tiene teléfono
    if (!isProfileLoading && user && profile && !profile.phone) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [isProfileLoading, user, profile]);

  /**
   * Valida y guarda el teléfono en el perfil de Supabase.
   */
  const handleSavePhone = async () => {
    if (!phone.trim()) {
      setError("Por favor ingresá un número de contacto");
      return;
    }

    // Validación básica de formato (mínimo 8 dígitos para Uruguay)
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 8) {
      setError("El número parece incompleto. Ingresá al menos 8 dígitos.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (!user) return;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ phone: phone.trim() })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast.success("Teléfono guardado. ¡Ya podés continuar!", {
        icon: <CheckCircle2 className="w-4 h-4 text-green-500" />
      });
      
      // Refrescar perfil para que el modal se cierre automáticamente
      await refetchProfile();
      setIsOpen(false);
    } catch (err: any) {
      console.error("Error saving phone:", err);
      toast.error("No se pudo guardar el teléfono. Reintentá.");
      setError("Hubo un problema técnica. Intentalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Formatea el input mientras el usuario escribe (opcional)
   */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setPhone(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-[0_0_80px_rgba(var(--primary-rgb),0.2)] animate-in zoom-in-95 duration-500"
        onPointerDownOutside={(e) => e.preventDefault()} // Evitar cierre accidental
        onEscapeKeyDown={(e) => e.preventDefault()}      // Evitar cierre con Esc
      >
        <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-10 flex flex-col items-center text-center ring-1 ring-white/10">
          
          {/* Decoración Background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full translate-y-1/2 -translate-x-1/2" />

          {/* Icono Premium */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full scale-150 animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-tr from-primary to-blue-400 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <Phone className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
          </div>

          {/* Texto */}
          <div className="space-y-3 mb-8">
            <h2 className="text-3xl font-black tracking-tight text-white">
              ¡Hola, {profile?.displayName?.split(" ")[0]}!
            </h2>
            <p className="text-blue-100/70 text-sm leading-relaxed px-2">
              Para que los agentes puedan coordinar visitas con vos y tu familia, 
              necesitamos un número de contacto actualizado.
            </p>
          </div>

          {/* Formulario */}
          <div className="w-full space-y-4">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary group-focus-within:text-blue-400 transition-colors">
                <Phone className="w-4 h-4" />
              </div>
              <Input
                type="tel"
                placeholder="Ej: 099 123 456"
                value={phone}
                onChange={handlePhoneChange}
                className="pl-12 h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 focus:ring-primary/20 transition-all placeholder:text-gray-500 font-medium tracking-wide"
                onKeyDown={(e) => e.key === "Enter" && handleSavePhone()}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-300 px-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </div>
            )}

            <Button
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 text-base gap-2"
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

            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">
              🔒 Tus datos están seguros con nosotros
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
