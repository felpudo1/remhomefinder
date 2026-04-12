import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GoogleSignInButtonProps {
  /** Referral ID opcional para persistir a través del redirect de OAuth */
  referralId?: string | null;
}

/**
 * Botón "Continuar con Google" que inicia OAuth con Supabase.
 * Muestra spinner mientras redirige al proveedor.
 * Si se pasa un referralId, lo incluye en la URL de redirect para recuperarlo en AuthCallback.
 */
export function GoogleSignInButton({ referralId }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      // Construir URL de redirect con referral_id como query param
      // para que AuthCallback pueda recuperarlo después del OAuth
      const redirectUrl = new URL(`${window.location.origin}/auth/callback`);
      if (referralId) {
        redirectUrl.searchParams.set("ref", referralId);
        console.log("💎 GoogleSignInButton: ref agregado al redirect URL:", referralId);
      } else {
        console.log("💎 GoogleSignInButton: SIN referralId, redirect URL sin ref");
      }
      console.log("💎 GoogleSignInButton: redirectUrl completa =", redirectUrl.toString());
      console.log("💎 GoogleSignInButton: localStorage hf_referral_id ANTES de OAuth =", localStorage.getItem("hf_referral_id"));

      // Guardar referral en localStorage ANTES del redirect (por si Supabase lo borra)
      if (referralId) {
        localStorage.setItem("hf_referral_id", referralId);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl.toString(),
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setLoading(false);
      toast({
        title: "Error al iniciar sesión con Google",
        description: err?.message || "Ocurrió un error inesperado.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full h-11 rounded-xl gap-3 font-medium"
      disabled={loading}
      onClick={signInWithGoogle}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      )}
      {loading ? "Redirigiendo..." : "Continuar con Google"}
    </Button>
  );
}
