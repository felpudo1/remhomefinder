import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Building2, Clock, Mail, Phone, Users, Loader2,
    MapPin, FileText, ExternalLink
} from "lucide-react";

/**
 * Interface de agencia — sin campo status (fue movido a profiles.status,
 * gestionado desde el panel de Usuarios).
 */
interface Agency {
    id: string;
    name: string;
    description: string;
    contact_name?: string;
    contact_email: string;
    contact_phone: string;
    contact_person_phone?: string;
    logo_url?: string;
    created_at: string;
    created_by: string;
    /** Cantidad de propiedades publicadas en el marketplace */
    property_count?: number;
}

interface Props {
    toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

/**
 * Panel de administración de agentes/agencias.
 * Muestra información detallada de cada agente.
 * La gestión de estados (activo/suspendido/etc.) se realiza desde el panel de Usuarios.
 */
export function AdminAgencias({ toast }: Props) {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchAgencies(); }, []);

    const fetchAgencies = async () => {
        setLoading(true);

        // Traer agencias con sus datos completos
        const { data: agencyData, error } = await supabase
            .from("agencies")
            .select("id, name, description, contact_name, contact_email, contact_phone, contact_person_phone, logo_url, created_at, created_by")
            .order("created_at", { ascending: false });

        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
            setLoading(false);
            return;
        }

        if (!agencyData || agencyData.length === 0) {
            setAgencies([]);
            setLoading(false);
            return;
        }

        // Traer conteo de propiedades por agencia en paralelo
        const agencyIds = agencyData.map(a => a.id);
        const { data: propCounts } = await supabase
            .from("marketplace_properties")
            .select("agency_id")
            .in("agency_id", agencyIds);

        // Construir mapa de agency_id → cantidad de propiedades
        const countMap: Record<string, number> = {};
        for (const p of propCounts || []) {
            countMap[p.agency_id] = (countMap[p.agency_id] || 0) + 1;
        }

        setAgencies(agencyData.map(a => ({
            ...a,
            property_count: countMap[a.id] || 0,
        })));
        setLoading(false);
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
                No hay agencias registradas aún.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Nota informativa sobre gestión de estados */}
            <p className="text-xs text-muted-foreground pb-1">
                💡 Para cambiar el estado de un agente (activo, suspendido, etc.) usá el panel de <strong>Usuarios</strong>.
            </p>

            {agencies.map((agency) => (
                <div key={agency.id} className="border border-border rounded-xl p-5 bg-background flex flex-col sm:flex-row items-start gap-5">

                    {/* Logo o ícono */}
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center border border-primary/20 overflow-hidden">
                        {agency.logo_url
                            ? <img src={agency.logo_url} alt={agency.name} className="w-full h-full object-cover" />
                            : <Building2 className="w-6 h-6 text-primary" />
                        }
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                        {/* Nombre y propiedades */}
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-foreground text-base">{agency.name}</h3>
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                <Building2 className="w-3 h-3" />
                                {agency.property_count} propiedad{agency.property_count !== 1 ? "es" : ""}
                            </span>
                        </div>

                        {/* Descripción */}
                        {agency.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                <FileText className="w-3 h-3 inline mr-1 opacity-60" />
                                {agency.description}
                            </p>
                        )}

                        {/* Grid de datos de contacto */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                            {agency.contact_name && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="w-3.5 h-3.5 text-primary/60" />
                                    <span>{agency.contact_name}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="w-3.5 h-3.5 text-primary/60" />
                                <span className="truncate">{agency.contact_email}</span>
                            </div>
                            {agency.contact_phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="w-3.5 h-3.5 text-primary/60" />
                                    <span>Empresa: {agency.contact_phone}</span>
                                </div>
                            )}
                            {agency.contact_person_phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="w-3.5 h-3.5 text-primary/60" />
                                    <span>Personal: {agency.contact_person_phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 pt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>Registrada el {new Date(agency.created_at).toLocaleDateString("es-AR")}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
