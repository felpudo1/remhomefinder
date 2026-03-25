import { useRef, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Clock, CheckCircle, Trash2, Ban, Star, Building2, Loader2, Upload } from "lucide-react";
import { UserStatus } from "@/types/property";
import { useSubscription } from "@/hooks/useSubscription";
import { useProfile } from "@/hooks/useProfile";
import { uploadAgencyLogoAndSave } from "@/lib/agencyLogoUpload";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
    /** URL pública del logo (Supabase Storage); vacío si no hay logo */
    logo_url: string;
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
    /** Cuando se sube un logo nuevo, actualiza el padre (header, estado de agencia) */
    onAgencyLogoUpdated?: (url: string) => void;
}

/**
 * Bloque para ver y subir el logo de la agencia (mismo bucket/RPC que el header).
 */
function AgencyLogoEditor({
    agencyId,
    initialUrl,
    onUploaded,
}: {
    agencyId: string;
    initialUrl: string;
    onUploaded?: (url: string) => void;
}) {
    const { toast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const [logoUrl, setLogoUrl] = useState(initialUrl);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        setLogoUrl(initialUrl);
    }, [initialUrl]);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast({ title: "Archivo no válido", description: "Elegí una imagen (JPG, PNG, etc.).", variant: "destructive" });
            return;
        }
        setUploading(true);
        try {
            const url = await uploadAgencyLogoAndSave(agencyId, file);
            setLogoUrl(url);
            onUploaded?.(url);
            toast({ title: "Logo actualizado", description: "El logo de tu agencia se guardó correctamente." });
        } catch (err) {
            console.error(err);
            toast({
                title: "Error al subir",
                description: err instanceof Error ? err.message : "Intentá de nuevo.",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-border bg-card/50 p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Logo de la agencia</p>
            <p className="text-xs text-muted-foreground">
                Imagen que identifica a tu agencia. Se muestra en el panel del agente.
            </p>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div
                    className={cn(
                        "mx-auto sm:mx-0 w-32 h-32 rounded-xl border-2 border-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0"
                    )}
                >
                    {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : logoUrl ? (
                        <img src={logoUrl} alt="Logo de la agencia" className="h-full w-full object-contain" />
                    ) : (
                        <Building2 className="h-12 w-12 text-muted-foreground" />
                    )}
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 w-full sm:w-auto"
                        disabled={uploading}
                        onClick={() => inputRef.current?.click()}
                    >
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="h-4 w-4" />
                        )}
                        {logoUrl ? "Cambiar logo" : "Subir logo"}
                    </Button>
                    <p className="text-xs text-muted-foreground">JPG, PNG o WEBP. Máx. 2 MB recomendado.</p>
                </div>
            </div>
        </div>
    );
}

export const AgentProfile = ({ agency, profileStatus, onAgencyLogoUpdated }: AgentProfileProps) => {
    const { isPremium } = useSubscription();
    const { data: profile } = useProfile();
    // Status viene siempre de profiles via useProfile — ya no hay agency.status
    const status = profileStatus ?? "active";
    const sc = statusConfig[status];
    const StatusIcon = sc?.icon;

    return (
        <div className="space-y-4">
            <AgencyLogoEditor agencyId={agency.id} initialUrl={agency.logo_url} onUploaded={onAgencyLogoUpdated} />

            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        {isPremium ? (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)] shrink-0" />
                        ) : (
                            <Star className="w-4 h-4 text-slate-400/50 shrink-0" />
                        )}
                        <h2 className="text-xl font-semibold text-foreground">{agency.name}</h2>
                    </div>
                    {agency.contact_name && <p className="text-sm text-foreground/80">Contacto: {agency.contact_name}</p>}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {agency.contact_email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{agency.contact_email}</span>}
                        {agency.contact_phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />Empresa: {agency.contact_phone}</span>}
                        {agency.contact_person_phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />Personal: {agency.contact_person_phone}</span>}
                    </div>
                </div>
                {sc && StatusIcon && (
                    <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
                        <Badge variant={sc.variant} className={`gap-1 ${sc.className}`}>
                            <StatusIcon className="w-3.5 h-3.5" /> {sc.label}
                        </Badge>
                        {status === "active" && profile?.approvedAt && (
                            <p className="text-xs text-muted-foreground leading-tight max-w-[220px]">
                                Aprobado el{" "}
                                {new Date(profile.approvedAt).toLocaleDateString("es-UY", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </p>
                        )}
                    </div>
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
