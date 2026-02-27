import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  LogOut,
  Plus,
  Home,
  Loader2,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Agency {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string;
  status: "pending" | "approved" | "rejected";
  description: string;
  created_at: string;
}

const statusConfig = {
  pending: {
    label: "Pendiente de aprobación",
    icon: Clock,
    variant: "outline" as const,
    className: "border-yellow-500/30 text-yellow-700 bg-yellow-500/10",
  },
  approved: {
    label: "Aprobada",
    icon: CheckCircle,
    variant: "outline" as const,
    className: "border-green-500/30 text-green-700 bg-green-500/10",
  },
  rejected: {
    label: "Rechazada",
    icon: XCircle,
    variant: "destructive" as const,
    className: "border-red-500/30 text-red-700 bg-red-500/10",
  },
};

const AdminInmobiliaria = () => {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserEmail(user.email ?? null);

      // Check agency role (flexible with naming)
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasAgencyRole = roles?.some(r => r.role === "agency" || (r.role as string) === "inmobiliaria");

      if (!hasAgencyRole) {
        navigate("/");
        return;
      }

      // Load agency
      const { data: agencies, error } = await supabase
        .from("agencies")
        .select("*")
        .eq("created_by", user.id)
        .limit(1);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else if (agencies && agencies.length > 0) {
        setAgency(agencies[0] as Agency);
      }

      setLoading(false);
    };

    init();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const sc = agency ? statusConfig[agency.status] : null;
  const StatusIcon = sc?.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Panel Inmobiliaria
              </h1>
              {userEmail && (
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Salir
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Agency Info Card */}
        {agency ? (
          <div className="border border-border rounded-2xl bg-card p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">
                  {agency.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {agency.contact_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {agency.contact_email}
                    </span>
                  )}
                  {agency.contact_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {agency.contact_phone}
                    </span>
                  )}
                </div>
              </div>
              {sc && StatusIcon && (
                <Badge variant={sc.variant} className={`gap-1 ${sc.className}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {sc.label}
                </Badge>
              )}
            </div>

            {agency.status === "pending" && (
              <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-4 text-sm text-yellow-800">
                Tu inmobiliaria está pendiente de aprobación por un administrador.
                Una vez aprobada, podrás publicar propiedades en la plataforma.
              </div>
            )}

            {agency.status === "rejected" && (
              <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 text-sm text-destructive">
                Tu solicitud fue rechazada. Si creés que es un error, contactá al
                soporte.
              </div>
            )}
          </div>
        ) : (
          <div className="border border-border rounded-2xl bg-card p-8 text-center space-y-3">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              No se encontró una inmobiliaria asociada a tu cuenta.
            </p>
          </div>
        )}

        {/* Properties section (only if approved) */}
        {agency?.status === "approved" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Home className="w-5 h-5" />
                Mis Propiedades
              </h3>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                Publicar propiedad
              </Button>
            </div>

            <div className="border border-border rounded-2xl bg-card p-8 text-center">
              <p className="text-muted-foreground text-sm">
                Todavía no publicaste ninguna propiedad. ¡Empezá ahora!
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminInmobiliaria;
