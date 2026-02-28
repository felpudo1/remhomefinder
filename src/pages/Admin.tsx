import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Building2, CheckCircle, XCircle, Clock, ArrowLeft, Loader2, Mail, Phone, Ban, Trash2, Users, LogOut } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Agency {
  id: string;
  name: string;
  contact_name?: string;
  contact_email: string;
  contact_phone: string;
  status: "pending" | "approved" | "rejected" | "suspended";
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

  const updateAgencyStatus = async (id: string, status: "pending" | "approved" | "rejected" | "suspended") => {
    const { error } = await supabase
      .from("agencies")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const labels: Record<string, string> = { pending: "Pendiente", approved: "Aprobada", rejected: "Eliminada", suspended: "Suspendida" };
      toast({
        title: "Estado actualizado",
        description: `El estado fue cambiado a "${labels[status]}".`,
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

  const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
    pending: { label: "Pendiente", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
    approved: { label: "Aprobada", icon: CheckCircle, color: "bg-green-100 text-green-800" },
    suspended: { label: "Suspendida", icon: Ban, color: "bg-orange-100 text-orange-800" },
    rejected: { label: "Eliminada", icon: Trash2, color: "bg-red-100 text-red-800" },
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Panel de Administración</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }} className="gap-2">
            <LogOut className="w-4 h-4" /> Salir
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Solicitudes de Agentes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Aprobá o rechazá los agentes que quieren publicar en la plataforma.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : agencies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay solicitudes de agentes.
          </div>
        ) : (
          <div className="space-y-3">
            {agencies.map((agency) => {
              const sc = statusConfig[agency.status];
              const StatusIcon = sc.icon;
              return (
                <div
                  key={agency.id}
                  className="border border-border rounded-xl p-5 bg-card flex flex-col sm:flex-row items-start gap-6"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center border border-primary/20">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-foreground text-xl">
                        {agency.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${sc.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="flex items-center gap-2 text-foreground/90">
                        <Users className="w-3.5 h-3.5 text-primary/60" />
                        <span className="font-medium shrink-0">Contacto:</span>
                        <span className="truncate">{agency.contact_name || "No especificado"}</span>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 text-primary/60" />
                        <span className="font-medium shrink-0">Email:</span>
                        <span className="truncate">{agency.contact_email}</span>
                      </div>

                      {agency.contact_phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-3.5 h-3.5 text-primary/60" />
                          <span className="font-medium shrink-0">Teléfono:</span>
                          <span>{agency.contact_phone}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60 pt-1">
                        <Clock className="w-3 h-3" />
                        <span>Registrada el {new Date(agency.created_at).toLocaleDateString("es-AR")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 w-[160px]">
                    <Select
                      value={agency.status}
                      onValueChange={(v) => updateAgencyStatus(agency.id, v as any)}
                    >
                      <SelectTrigger className="h-9 rounded-xl text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Pendiente</span>
                        </SelectItem>
                        <SelectItem value="approved">
                          <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Aprobada</span>
                        </SelectItem>
                        <SelectItem value="suspended">
                          <span className="flex items-center gap-1.5"><Ban className="w-3 h-3" /> Suspendida</span>
                        </SelectItem>
                        <SelectItem value="rejected">
                          <span className="flex items-center gap-1.5"><Trash2 className="w-3 h-3" /> Eliminada</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
