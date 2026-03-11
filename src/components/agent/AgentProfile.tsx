import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Clock, CheckCircle, Trash2, Ban } from "lucide-react";
import { UserStatus } from "@/types/property";

export interface Agency {
    id: string;
    name: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    contact_person_phone: string;
    description: string;
    created_at: string;
    created_by: string;
}

const statusConfig = {
    pending: { label: "Pendiente de aprobación", icon: Clock, variant: "outline" as const, className: "border-yellow-500/30 text-yellow-700 bg-yellow-500/10" },
    active: { label: "Aprobada", icon: CheckCircle, variant: "outline" as const, className: "border-green-500/30 text-green-700 bg-green-500/10" },
    rejected: { label: "Eliminada", icon: Trash2, variant: "destructive" as const, className: "border-red-500/30 text-red-700 bg-red-500/10" },
    suspended: { label: "Suspendida", icon: Ban, variant: "outline" as const, className: "border-orange-500/30 text-orange-700 bg-orange-500/10" },
};

interface AgentProfileProps {
    agency: Agency;
    profileStatus?: UserStatus;
}

export const AgentProfile = ({ agency, profileStatus }: AgentProfileProps) => {
    // Status viene siempre de profiles via useProfile — ya no hay agency.status
    const status = profileStatus ?? "active";
    const sc = statusConfig[status];
    const StatusIcon = sc?.icon;

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-foreground">{agency.name}</h2>
                    {agency.contact_name && <p className="text-sm text-foreground/80">Contacto: {agency.contact_name}</p>}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {agency.contact_email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{agency.contact_email}</span>}
                        {agency.contact_phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />Empresa: {agency.contact_phone}</span>}
                        {agency.contact_person_phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />Personal: {agency.contact_person_phone}</span>}
                    </div>
                </div>
                {sc && StatusIcon && (
                    <Badge variant={sc.variant} className={`gap-1 ${sc.className}`}>
                        <StatusIcon className="w-3.5 h-3.5" /> {sc.label}
                    </Badge>
                )}
            </div>

            {status === "pending" && (
                <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-4 text-sm text-yellow-800 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Tu cuenta de agente está pendiente de aprobación por un administrador.
                </div>
            )}
            {status === "rejected" && (
                <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 text-sm text-destructive flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Tu cuenta ha sido eliminada por un administrador. No podrás realizar nuevas publicaciones.
                </div>
            )}
            {status === "suspended" && (
                <div className="rounded-xl bg-orange-500/5 border border-orange-500/20 p-4 text-sm text-orange-800 flex items-center gap-2">
                    <Ban className="w-4 h-4" />
                    Tu cuenta está suspendida temporalmente. Contactá al soporte para más información.
                </div>
            )}
        </div>
    );
};
