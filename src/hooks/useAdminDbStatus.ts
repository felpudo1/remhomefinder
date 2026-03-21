import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdminDbStatus = "checking" | "ok" | "error";

/**
 * Comprueba si Supabase responde (misma lógica liviana que DbStatusBadge).
 * "error" solo ante fallos de red tipo fetch; otros errores de Supabase cuentan como ok.
 */
export function useAdminDbStatus(): AdminDbStatus {
  const [status, setStatus] = useState<AdminDbStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const { error } = await supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .limit(1);

        if (cancelled) return;
        if (error && error.message.toLowerCase().includes("fetch")) {
          setStatus("error");
        } else {
          setStatus("ok");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
