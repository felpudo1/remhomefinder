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
    // JP prefiere enfocarlo en usuarios de Google
    const isGoogleUser = user?.app_metadata?.provider === "google";
    
    if (!isProfileLoading && user && profile && !profile.phone && isGoogleUser) {
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
      setError("Por favor ingrese un numero de celular");
      return;
    }

    // Validación básica: que no tenga letras y tenga el largo esperado para formato inter
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("El formato debe ser internacional (ej: 59894123456)");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (!user) return;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ phone: cleanPhone }) // Guardamos el limpio para consistencia
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast.success("Teléfono guardado");
      
      // Refrescar perfil para que el modal se cierre automáticamente
      await refetchProfile();
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
        className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-[0_0_80px_rgba(var(--primary-rgb),0.2)] animate-in zoom-in-95 duration-500"
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

          {/* Texto Simplificado sugerido por JP */}
          <div className="space-y-4 mb-8">
            <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
              Por favor ingrese un numero de celular
            </h2>
          </div>

          {/* Formulario */}
          <div className="w-full space-y-4">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary group-focus-within:text-blue-400 transition-colors">
                <Phone className="w-4 h-4" />
              </div>
              <Input
                type="tel"
                placeholder="59894123456"
                value={phone}
                onChange={(e) => {
                  setError(null);
                  setPhone(e.target.value);
                }}
                className="pl-12 h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 focus:ring-primary/20 transition-all placeholder:text-gray-500 font-medium"
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
