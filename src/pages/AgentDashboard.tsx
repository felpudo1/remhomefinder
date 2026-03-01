import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PublishPropertyModal } from "@/components/PublishPropertyModal";
import { currencySymbol } from "@/lib/currency";
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
  MapPin,
  Maximize2,
  BedDouble,
  Pause,
  Play,
  Trash2,
  Ban,
} from "lucide-react";

interface Agency {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  description: string;
  created_at: string;
}

const statusConfig = {
  pending: { label: "Pendiente de aprobación", icon: Clock, variant: "outline" as const, className: "border-yellow-500/30 text-yellow-700 bg-yellow-500/10" },
  approved: { label: "Aprobada", icon: CheckCircle, variant: "outline" as const, className: "border-green-500/30 text-green-700 bg-green-500/10" },
  rejected: { label: "Eliminada", icon: Trash2, variant: "destructive" as const, className: "border-red-500/30 text-red-700 bg-red-500/10" },
  suspended: { label: "Suspendida", icon: Ban, variant: "outline" as const, className: "border-orange-500/30 text-orange-700 bg-orange-500/10" },
};

const AgentDashboard = () => {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      setUserEmail(user.email ?? null);

      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (!roles?.some(r => r.role === "agency")) { navigate("/dashboard"); return; }

      const { data: agencies, error } = await supabase.from("agencies").select("*").eq("created_by", user.id).limit(1);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else if (agencies && agencies.length > 0) { setAgency(agencies[0] as Agency); }
      setLoading(false);
    };
    init();
  }, [navigate, toast]);

  // Fetch agency's marketplace properties
  const { data: agencyProperties = [], isLoading: propsLoading } = useQuery({
    queryKey: ["agency-marketplace-properties", agency?.id],
    enabled: !!agency && agency.status === "approved",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_properties")
        .select("*")
        .eq("agency_id", agency!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    const { error } = await supabase.from("marketplace_properties").update({ status: newStatus }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { queryClient.invalidateQueries({ queryKey: ["agency-marketplace-properties"] }); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("marketplace_properties").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { queryClient.invalidateQueries({ queryKey: ["agency-marketplace-properties"] }); toast({ title: "Eliminada" }); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/auth"); };

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
              <h1 className="text-lg font-semibold text-foreground">Panel Agente</h1>
              {userEmail && <p className="text-xs text-muted-foreground">{userEmail}</p>}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" /> Salir
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Agency Info */}
        {agency ? (
          <div className="border border-border rounded-2xl bg-card p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">{agency.name}</h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {agency.contact_email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{agency.contact_email}</span>}
                  {agency.contact_phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{agency.contact_phone}</span>}
                </div>
              </div>
              {sc && StatusIcon && (
                <Badge variant={sc.variant} className={`gap-1 ${sc.className}`}>
                  <StatusIcon className="w-3.5 h-3.5" /> {sc.label}
                </Badge>
              )}
            </div>
            {agency.status === "pending" && (
              <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-4 text-sm text-yellow-800 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Tu cuenta de agente está pendiente de aprobación por un administrador.
              </div>
            )}
            {agency.status === "rejected" && (
              <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 text-sm text-destructive flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Tu cuenta ha sido eliminada por un administrador. No podrás realizar nuevas publicaciones.
              </div>
            )}
            {agency.status === "suspended" && (
              <div className="rounded-xl bg-orange-500/5 border border-orange-500/20 p-4 text-sm text-orange-800 flex items-center gap-2">
                <Ban className="w-4 h-4" />
                Tu cuenta está suspendida temporalmente. Contactá al soporte para más información.
              </div>
            )}
          </div>
        ) : (
          <div className="border border-border rounded-2xl bg-card p-8 text-center space-y-3">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No se encontró una agencia asociada a tu cuenta.</p>
          </div>
        )}

        {/* Properties section */}
        {agency?.status === "approved" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Home className="w-5 h-5" /> Mis Propiedades ({agencyProperties.length})
              </h3>
              <Button size="sm" className="gap-1.5" onClick={() => setPublishOpen(true)}>
                <Plus className="w-4 h-4" /> Publicar propiedad
              </Button>
            </div>

            {propsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : agencyProperties.length === 0 ? (
              <div className="border border-border rounded-2xl bg-card p-8 text-center">
                <p className="text-muted-foreground text-sm">Todavía no publicaste ninguna propiedad. ¡Empezá ahora!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agencyProperties.map((p: any) => (
                  <div key={p.id} className="border border-border rounded-2xl bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-foreground text-sm line-clamp-2">{p.title}</h4>
                      <Badge variant="outline" className={`text-xs shrink-0 ${p.status === "active" ? "border-green-500/30 text-green-700 bg-green-500/10" : p.status === "paused" ? "border-yellow-500/30 text-yellow-700 bg-yellow-500/10" : "border-muted text-muted-foreground"}`}>
                        {p.status === "active" ? "Activa" : p.status === "paused" ? "Pausada" : "Vendida"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {p.neighborhood && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.neighborhood}</span>}
                      <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{p.sq_meters} m²</span>
                      <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{p.rooms} amb</span>
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      {currencySymbol(p.currency)} {Number(p.total_cost).toLocaleString()}
                      {(!p.listing_type || p.listing_type === "rent") ? "/mes" : ""}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(!p.listing_type || p.listing_type === "rent") ? "Alquiler" : "Venta"}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-1 rounded-lg text-xs" onClick={() => handleToggleStatus(p.id, p.status)}>
                        {p.status === "active" ? <><Pause className="w-3 h-3" />Pausar</> : <><Play className="w-3 h-3" />Activar</>}
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1 rounded-lg text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-3 h-3" /> Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <PublishPropertyModal
              open={publishOpen}
              onClose={() => setPublishOpen(false)}
              agencyId={agency.id}
              onPublished={() => queryClient.invalidateQueries({ queryKey: ["agency-marketplace-properties"] })}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default AgentDashboard;
