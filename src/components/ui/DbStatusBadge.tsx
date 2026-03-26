import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database, WifiOff, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type DbStatus = "checking" | "connected" | "error";

interface DbCheckResult {
    status: DbStatus;
    latencyMs: number | null;
    checkedAt: Date | null;
    errorMessage: string | null;
}

export function DbStatusBadge() {
    const [result, setResult] = useState<DbCheckResult>({
        status: "checking",
        latencyMs: null,
        checkedAt: null,
        errorMessage: null,
    });

    const runCheck = async () => {
        setResult(prev => ({ ...prev, status: "checking", errorMessage: null }));
        const start = performance.now();
        try {
            const { error } = await supabase
                .from("properties")
                .select("id", { count: "exact", head: true })
                .limit(1);

            const latencyMs = Math.round(performance.now() - start);

            if (error && error.message.toLowerCase().includes("fetch")) {
                setResult({ status: "error", latencyMs: null, checkedAt: new Date(), errorMessage: error.message });
            } else {
                setResult({ status: "connected", latencyMs, checkedAt: new Date(), errorMessage: null });
            }
        } catch (err: any) {
            setResult({
                status: "error",
                latencyMs: null,
                checkedAt: new Date(),
                errorMessage: err?.message || "Error desconocido",
            });
        }
    };

    useEffect(() => {
        runCheck();
        const interval = setInterval(runCheck, 60_000);
        return () => clearInterval(interval);
    }, []);

    // Solo mostrar si hay error
    if (result.status !== "error") {
        return null;
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="fixed bottom-5 left-5 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium backdrop-blur-sm shadow-sm cursor-pointer transition-all hover:scale-105 bg-destructive/10 text-destructive border-destructive/30"
                    role="alert"
                >
                    <Database className="w-3 h-3 opacity-70" />
                    <WifiOff className="w-3 h-3" />
                    <span>Sin conexión a BD</span>
                </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-72 p-0">
                <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        <h4 className="text-sm font-semibold text-foreground">Estado de la Base de Datos</h4>
                    </div>

                    <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                            <span className="text-muted-foreground">Estado</span>
                            <span className="flex items-center gap-1 font-medium text-destructive">
                                <WifiOff className="w-3 h-3" />
                                Sin conexión
                            </span>
                        </div>

                        <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                            <span className="text-muted-foreground">Latencia</span>
                            <span className="font-medium text-muted-foreground">—</span>
                        </div>

                        {result.errorMessage && (
                            <div className="flex items-start justify-between py-1.5 border-b border-border/50">
                                <span className="text-muted-foreground">Error</span>
                                <span className="font-medium text-destructive text-right max-w-[140px] truncate" title={result.errorMessage}>
                                    {result.errorMessage}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center justify-between py-1.5">
                            <span className="text-muted-foreground">Última comprobación</span>
                            <span className="font-medium text-foreground">
                                {result.checkedAt
                                    ? result.checkedAt.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                                    : "—"}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={runCheck}
                        className="w-full text-xs font-medium py-1.5 px-3 rounded-md border border-border bg-muted/50 hover:bg-muted transition-colors text-foreground"
                    >
                        Reintentar conexión
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
