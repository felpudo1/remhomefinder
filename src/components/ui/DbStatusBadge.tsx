import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database, WifiOff } from "lucide-react";

/**
 * Tipos posibles del estado de la base de datos
 */
export type DbStatus = "checking" | "connected" | "error";

/**
 * Badge fijo solo cuando la BD falla (red / no responde).
 * Si está bien o comprobando, no se muestra nada.
 */
export function DbStatusBadge() {
    const [status, setStatus] = useState<DbStatus>("checking");

    useEffect(() => {
        const checkConnection = async () => {
            setStatus("checking");
            try {
                const { error } = await supabase
                    .from("properties")
                    .select("id", { count: "exact", head: true })
                    .limit(1);

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

    if (status !== "error") {
        return null;
    }

    return (
        <div
            className="fixed bottom-5 left-5 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium backdrop-blur-sm shadow-sm bg-red-500/10 text-red-600 border-red-500/30"
            role="alert"
        >
            <Database className="w-3 h-3 opacity-70" />
            <WifiOff className="w-3 h-3" />
            <span>Sin conexión a BD</span>
        </div>
    );
}
