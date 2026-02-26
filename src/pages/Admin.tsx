import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Building2, CheckCircle, XCircle, Clock, ArrowLeft, Loader2 } from "lucide-react";

interface Agency {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

const Admin = () => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");

      if (!roles || roles.length === 0) {
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setChecking(false);
      fetchAgencies();
    };

    checkAdmin();
  }, [navigate]);

  const fetchAgencies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("agencies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setAgencies((data as Agency[]) || []);
    }
    setLoading(false);
  };

  const updateAgencyStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("agencies")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: status === "approved" ? "Inmobiliaria aprobada" : "Inmobiliaria rechazada",
        description: `El estado fue actualizado correctamente.`,
      });
      fetchAgencies();
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const statusConfig = {
    pending: { label: "Pendiente", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
    approved: { label: "Aprobada", icon: CheckCircle, color: "bg-green-100 text-green-800" },
    rejected: { label: "Rechazada", icon: XCircle, color: "bg-red-100 text-red-800" },
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Panel de Administración</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Solicitudes de Inmobiliarias
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Aprobá o rechazá las inmobiliarias que quieren publicar en la plataforma.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : agencies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay solicitudes de inmobiliarias.
          </div>
        ) : (
          <div className="space-y-3">
            {agencies.map((agency) => {
              const sc = statusConfig[agency.status];
              const StatusIcon = sc.icon;
              return (
                <div
                  key={agency.id}
                  className="border border-border rounded-xl p-4 bg-card flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {agency.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{agency.contact_email}</p>
                    {agency.contact_phone && (
                      <p className="text-sm text-muted-foreground">{agency.contact_phone}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Registrada: {new Date(agency.created_at).toLocaleDateString("es-AR")}
                    </p>
                  </div>

                  {agency.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => updateAgencyStatus(agency.id, "approved")}
                        className="gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAgencyStatus(agency.id, "rejected")}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <XCircle className="w-4 h-4" />
                        Rechazar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
