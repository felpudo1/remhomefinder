import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Building2, Clock, Mail, Phone, Users, Loader2,
    CheckCircle, Ban, Trash2, ChevronUp, ChevronDown, Search, User, Star, Medal
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Interface de registro maestro de usuario enriquecida.
 */
interface UserMasterRecord {
    id: string;
    display_name: string;
    email: string | null;
    phone: string;
    status: "active" | "pending" | "suspended" | "rejected";
    plan_type: "free" | "premium";
    created_at: string;
    referred_by_id?: string | null;
    referred_by_name?: string;
    // Datos de agencia (opcionales)
    agency_name?: string;
    agency_logo?: string;
    property_count: number;
}

interface Props {
    toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

const STATUS_CONFIG = {
    active: { label: "Activo", icon: CheckCircle, color: "bg-green-100 text-green-800" },
    pending: { label: "Pendiente", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
    suspended: { label: "Suspendido", icon: Ban, color: "bg-orange-100 text-orange-800" },
    rejected: { label: "Eliminado", icon: Trash2, color: "bg-red-100 text-red-800" },
};

/**
 * Tablón Maestro de Datos de Usuarios y Agentes.
 * Centraliza toda la información de contacto y negocio.
 */
export function AdminAgencias({ toast }: Props) {
    const [records, setRecords] = useState<UserMasterRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: keyof UserMasterRecord; direction: 'asc' | 'desc' }>({
        key: 'display_name',
        direction: 'asc'
    });

    useEffect(() => { fetchRecords(); }, []);

    const fetchRecords = async () => {
        try {
            setLoading(true);

            // 1. Traer todos los perfiles (base del tablón maestro)
            const { data: profiles, error: profileError } = await supabase
                .from("profiles")
                .select("user_id, display_name, email, phone, status, plan_type, created_at, referred_by_id")
                .order("created_at", { ascending: false });

            if (profileError) throw profileError;
            if (!profiles || profiles.length === 0) {
                setRecords([]);
                setLoading(false);
                return;
            }

            const userIds = profiles.map(p => p.user_id);

            // 2. Traer agencias y referidores en paralelo
            const [agenciesRes, propCountsRes, referrersRes] = await Promise.all([
                supabase.from("agencies").select("name, logo_url, created_by, id").in("created_by", userIds),
                supabase.from("marketplace_properties").select("agency_id"), // Para conteo rápido
                supabase.from("profiles").select("user_id, display_name").in("user_id", [...new Set(profiles.map(p => p.referred_by_id).filter(Boolean))]),
            ]);

            // Mapeo de agencias
            const agencyMap: Record<string, any> = {};
            const agencyIds: string[] = [];
            for (const a of agenciesRes.data || []) {
                agencyMap[a.created_by] = a;
                agencyIds.push(a.id);
            }

            // Conteo de propiedades por agencia
            const countMap: Record<string, number> = {};
            for (const p of propCountsRes.data || []) {
                if (agencyIds.includes(p.agency_id)) {
                    countMap[p.agency_id] = (countMap[p.agency_id] || 0) + 1;
                }
            }

            // Mapeo de referidores
            const referrerMap: Record<string, string> = {};
            for (const r of referrersRes.data || []) referrerMap[r.user_id] = r.display_name;

            // 3. Unificar todo
            setRecords(profiles.map(p => {
                const agency = agencyMap[p.user_id];
                return {
                    id: p.user_id,
                    display_name: p.display_name,
                    email: p.email,
                    phone: p.phone,
                    status: p.status as UserMasterRecord["status"],
                    plan_type: p.plan_type as "free" | "premium",
                    created_at: p.created_at,
                    referred_by_id: p.referred_by_id,
                    referred_by_name: p.referred_by_id ? referrerMap[p.referred_by_id] : undefined,
                    agency_name: agency?.name,
                    agency_logo: agency?.logo_url,
                    property_count: agency ? (countMap[agency.id] || 0) : 0,
                };
            }));
        } catch (err: any) {
            console.error("Error fetchRecords:", err);
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: keyof UserMasterRecord) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const filteredRecords = useMemo(() => {
        let result = [...records];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(r =>
                r.display_name.toLowerCase().includes(q) ||
                (r.email?.toLowerCase().includes(q)) ||
                r.agency_name?.toLowerCase().includes(q)
            );
        }

        return result.sort((a, b) => {
            const valA = (a[sortConfig.key] || "").toString().toLowerCase();
            const valB = (b[sortConfig.key] || "").toString().toLowerCase();
            const multiplier = sortConfig.direction === 'asc' ? 1 : -1;
            return valA < valB ? -1 * multiplier : 1 * multiplier;
        });
    }, [records, searchQuery, sortConfig]);

    const SortIcon = ({ field }: { field: keyof UserMasterRecord }) =>
        sortConfig.key === field
            ? sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
            : null;

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Buscador */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre, email o agencia..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 rounded-xl text-sm"
                />
            </div>

            {filteredRecords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No se encontraron registros.
                </div>
            ) : (
                <div className="overflow-x-auto -mx-2">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[180px]">
                                    <button onClick={() => handleSort('display_name')} className="flex items-center gap-1 hover:text-foreground text-[10px] font-bold uppercase tracking-wider">
                                        Usuario <SortIcon field="display_name" />
                                    </button>
                                </TableHead>
                                <TableHead className="w-[180px]">
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Contacto</span>
                                </TableHead>
                                <TableHead className="w-[80px]">
                                    <button onClick={() => handleSort('created_at')} className="flex items-center gap-1 hover:text-foreground text-[10px] font-bold uppercase tracking-wider">
                                        Registro <SortIcon field="created_at" />
                                    </button>
                                </TableHead>
                                <TableHead className="w-[130px]">
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Agencia/Origen</span>
                                </TableHead>
                                <TableHead className="w-[60px] text-center">
                                    <button onClick={() => handleSort('property_count')} className="flex items-center gap-1 hover:text-foreground text-[10px] font-bold uppercase tracking-wider mx-auto">
                                        Props <SortIcon field="property_count" />
                                    </button>
                                </TableHead>
                                <TableHead className="w-[100px]">
                                    <button onClick={() => handleSort('status')} className="flex items-center gap-1 hover:text-foreground text-[10px] font-bold uppercase tracking-wider">
                                        Estado <SortIcon field="status" />
                                    </button>
                                </TableHead>
                                <TableHead className="w-[90px]">
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Plan</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRecords.map((record) => {
                                // Guarda de estado para evitar crash por datos corruptos
                                const statusKey = record.status as keyof typeof STATUS_CONFIG;
                                const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.active;
                                const StatusIcon = statusCfg.icon || User;

                                // Formateo seguro de fecha
                                let formattedDate = "-";
                                try {
                                    if (record.created_at) {
                                        const d = new Date(record.created_at);
                                        if (!isNaN(d.getTime())) {
                                            formattedDate = d.toLocaleDateString("es-AR", { day: '2-digit', month: '2-digit', year: '2-digit' });
                                        }
                                    }
                                } catch (e) { console.error("Error formatting date:", e); }

                                return (
                                    <TableRow key={record.id} className="group">
                                        <TableCell className="py-2 px-3">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 overflow-hidden">
                                                    {record.agency_logo
                                                        ? <img src={record.agency_logo} alt={record.agency_name} className="w-full h-full object-cover" />
                                                        : record.agency_name ? <Building2 className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-muted-foreground" />
                                                    }
                                                </div>
                                                <span className="truncate text-sm font-bold tracking-tight">{record.display_name}</span>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {record.plan_type === "premium" ? (
                                                        <span title="PREMIUM">
                                                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                        </span>
                                                    ) : (
                                                        <span title="FREE">
                                                            <Star className="w-3 h-3 text-slate-300" />
                                                        </span>
                                                    )}
                                                    {record.referred_by_id && (
                                                        <span title="REFERENCIADO">
                                                            <Medal className="w-3 h-3 text-blue-500" />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="py-2 px-3">
                                            <div className="flex flex-col min-w-0">
                                                <span className="truncate text-[11px] font-semibold text-muted-foreground">{record.email || "-"}</span>
                                                <span className="text-[10px] text-primary/70 flex items-center gap-1 font-bold">
                                                    <Phone className="w-2.5 h-2.5" /> {record.phone || "-"}
                                                </span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="py-2 px-3">
                                            <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                                                {formattedDate}
                                            </span>
                                        </TableCell>

                                        <TableCell className="py-2 px-3">
                                            <div className="flex flex-col min-w-0">
                                                {record.agency_name && (
                                                    <span className="truncate text-[10px] font-bold text-foreground" title={`Agencia: ${record.agency_name}`}>
                                                        {record.agency_name}
                                                    </span>
                                                )}
                                                {record.referred_by_name && record.referred_by_id !== record.id && (
                                                    <span className="truncate text-[9px] font-medium text-primary/70 italic" title={`Referido por: ${record.referred_by_name}`}>
                                                        Ref: {record.referred_by_name}
                                                    </span>
                                                )}
                                                {!record.agency_name && !record.referred_by_name && <span className="text-[10px] text-muted-foreground">-</span>}
                                            </div>
                                        </TableCell>

                                        <TableCell className="py-2 px-3 text-center">
                                            <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 w-5 h-5 rounded-full text-[10px] font-bold">
                                                {record.property_count}
                                            </span>
                                        </TableCell>

                                        <TableCell className="py-2 px-3">
                                            <span className={cn("inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase", statusCfg.color)}>
                                                <StatusIcon className="w-3 h-3" />
                                                {statusCfg.label}
                                            </span>
                                        </TableCell>

                                        <TableCell className="py-2 px-3">
                                            <span className={cn(
                                                "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                record.plan_type === "premium" ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground border border-transparent"
                                            )}>
                                                {record.plan_type}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
