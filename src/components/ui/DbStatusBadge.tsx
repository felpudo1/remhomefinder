import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database, Wifi, WifiOff, Loader2 } from "lucide-react";

/**
 * Tipos posibles del estado de la base de datos
 */
export type DbStatus = "checking" | "connected" | "error";

/**
 * Componente que muestra el estado de conexión con la base de datos Supabase.
 * Extraído de Auth.tsx según la Regla 2 (Arquitectura Profesional).
 */
export function DbStatusBadge() {
    const [status, setStatus] = useState<DbStatus>("checking");
    const [latency, setLatency] = useState<number | null>(null);

    useEffect(() => {
        /**
         * Verifica la conexión con Supabase enviando una consulta ligera
         */
        const checkConnection = async () => {
            setStatus("checking");
            const start = performance.now();
            try {
                // Head request liviano — solo verifica si existe respuesta
                const { error } = await supabase
                    .from("properties")
                    .select("id", { count: "exact", head: true })
                    .limit(1);

                const ms = Math.round(performance.now() - start);
                setLatency(ms);

                if (error && error.message.toLowerCase().includes("fetch")) {
                    setStatus("error");
                } else {
                    setStatus("connected");
                }
            } catch (err) {
                console.error("Error checking connection:", err);
                setStatus("error");
            }
        };

        checkConnection();
    }, []);

    // Configuración de estilos e íconos según el estado
    const config = {
        checking: {
            label: "Verificando BD...",
            icon: <Loader2 className="w-3 h-3 animate-spin" />,
            classes: "bg-muted/80 text-muted-foreground border-border"
        },
        connected: {
            label: "Base de datos conectada",
            icon: <Wifi className="w-3 h-3" />,
            classes: "bg-green-500/10 text-green-600 border-green-500/30"
        },
        error: {
            label: "Sin conexión a BD",
            icon: <WifiOff className="w-3 h-3" />,
            classes: "bg-red-500/10 text-red-600 border-red-500/30"
        }
    }[status];

    return (
        <div
            className={`fixed bottom-5 left-5 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium backdrop-blur-sm shadow-sm transition-all duration-500 ${config.classes}`}
        >
            <Database className="w-3 h-3 opacity-70" />
            {config.icon}
            <span>{config.label}</span>
            {status === "connected" && latency !== null && (
                <span className="opacity-60">{latency}ms</span>
            )}
        </div>
    );
}
