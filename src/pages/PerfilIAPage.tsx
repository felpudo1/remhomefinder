import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { ROUTES } from "@/lib/constants";
import { BuyerProfileModal } from "@/components/BuyerProfileModal";

/**
 * Pantalla dedicada a completar el perfil de búsqueda IA (tabla user_search_profiles).
 * Si ya existe fila, redirige al dashboard; si no, muestra el formulario obligatorio.
 */
export default function PerfilIAPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [dbChecked, setDbChecked] = useState(false);
  const [hasSearchProfile, setHasSearchProfile] = useState<boolean | null>(null);

  useEffect(() => {
    if (profileLoading) return;
    if (!profile) {
      navigate(ROUTES.AUTH, { replace: true });
      return;
    }
    if (profile.status !== "active") {
      navigate(ROUTES.DASHBOARD, { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_search_profiles")
        .select("id")
        .eq("user_id", profile.userId)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        navigate(ROUTES.DASHBOARD, { replace: true });
        return;
      }
      setHasSearchProfile(false);
      setDbChecked(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [profileLoading, profile, navigate]);

  if (profileLoading || !dbChecked || hasSearchProfile !== false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BuyerProfileModal
        isOpen
        onClose={() => navigate(ROUTES.DASHBOARD, { replace: true })}
        userId={profile?.userId}
      />
    </div>
  );
}
