import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
    Building2, CheckCircle, XCircle, Clock, Mail,
    Phone, Ban, Trash2, Users, Loader2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Agency {
    id: string;
    name: string;
    contact_name?: string;
    contact_email: string;
    contact_phone: string;
    contact_person_phone?: string;
    status: "pending" | "approved" | "rejected" | "suspended";
    created_at: string;
}

interface Props {
    toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

const STATUS_CONFIG = {
    pending: { label: "Pendiente", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
    approved: { label: "Aprobada", icon: CheckCircle, color: "bg-green-100 text-green-800" },
    suspended: { label: "Suspendida", icon: Ban, color: "bg-orange-100 text-orange-800" },
    rejected: { label: "Eliminada", icon: Trash2, color: "bg-red-100 text-red-800" },
};

/**
 * Sección de administración de agencias/agentes.
 * Permite ver, aprobar, rechazar y suspender agencias.
 */
export function AdminAgencias({ toast }: Props) {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAgencies();
    }, []);

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

    const updateStatus = async (id: string, status: Agency["status"]) => {
        const { error } = await supabase.from("agencies").update({ status }).eq("id", id);
        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            const labels: Record<string, string> = { pending: "Pendiente", approved: "Aprobada", rejected: "Eliminada", suspended: "Suspendida" };
            toast({ title: "Estado actualizado", description: `Cambiado a "${labels[status]}".` });
            fetchAgencies();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (agencies.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No hay solicitudes de agentes registradas.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {agencies.map((agency) => {
                const sc = STATUS_CONFIG[agency.status];
                const StatusIcon = sc.icon;
                return (
                    <div key={agency.id} className="border border-border rounded-xl p-5 bg-background flex flex-col sm:flex-row items-start gap-5">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center border border-primary/20">
                            <Building2 className="w-5 h-5 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-foreground text-base">{agency.name}</h3>
                                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${sc.color}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {sc.label}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="w-3.5 h-3.5 text-primary/60" />
                                    <span>{agency.contact_name || "Sin nombre"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="w-3.5 h-3.5 text-primary/60" />
                                    <span className="truncate">{agency.contact_email}</span>
                                </div>
                                {agency.contact_phone && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="w-3.5 h-3.5 text-primary/60" />
                                        <span>{agency.contact_phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 pt-0.5">
                                    <Clock className="w-3 h-3" />
                                    <span>Registrada el {new Date(agency.created_at).toLocaleDateString("es-AR")}</span>
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0 w-[150px]">
                            <Select value={agency.status} onValueChange={(v) => updateStatus(agency.id, v as Agency["status"])}>
                                <SelectTrigger className="h-8 rounded-xl text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending"><span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Pendiente</span></SelectItem>
                                    <SelectItem value="approved"><span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Aprobada</span></SelectItem>
                                    <SelectItem value="suspended"><span className="flex items-center gap-1.5"><Ban className="w-3 h-3" /> Suspendida</span></SelectItem>
                                    <SelectItem value="rejected"><span className="flex items-center gap-1.5"><Trash2 className="w-3 h-3" /> Eliminada</span></SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
