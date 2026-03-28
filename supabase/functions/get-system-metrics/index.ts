import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PROJECT_REF = "cuyfrpuiokvqvhvoerga";

interface ParsedMetrics {
  diskIoBudget: number | null;
  restRequests: number | null;
  authRequests: number | null;
  realtimeRequests: number | null;
  storageRequests: number | null;
  cpuUsage: number | null;
  ramUsedMb: number | null;
  ramTotalMb: number | null;
  dbConnections: number | null;
  timestamp: string;
}

interface HistoryPoint {
  disk_io_budget: number;
  recorded_at: string;
}

type LabelFilters = Record<string, string>;

function parseLabels(rawLabels?: string): Record<string, string> {
  if (!rawLabels) return {};
  const labels: Record<string, string> = {};
  const body = rawLabels.slice(1, -1);
  if (!body.trim()) return labels;
  for (const entry of body.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)) {
    const [key, rawValue] = entry.split("=");
    if (!key || rawValue === undefined) continue;
    labels[key.trim()] = rawValue.trim().replace(/^"|"$/g, "");
  }
  return labels;
}

function collectMetricValues(text: string, metricName: string, labelFilters: LabelFilters = {}): number[] {
  const values: number[] = [];
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const match = line.match(
      /^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{[^}]*\})?\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)(?:\s+\d+)?\s*$/
    );
    if (!match) continue;
    const [, name, labelsRaw, valueRaw] = match;
    if (name !== metricName) continue;
    const labels = parseLabels(labelsRaw);
    const isMatch = Object.entries(labelFilters).every(([k, v]) => labels[k] === v);
    if (!isMatch) continue;
    const parsed = Number.parseFloat(valueRaw);
    if (Number.isFinite(parsed)) values.push(parsed);
  }
  return values;
}

function sumMetric(text: string, metricName: string, labelFilters: LabelFilters = {}): number | null {
  const values = collectMetricValues(text, metricName, labelFilters);
  if (values.length === 0) return null;
  return values.reduce((acc, value) => acc + value, 0);
}

function firstMetric(text: string, metricName: string, labelFilters: LabelFilters = {}): number | null {
  const values = collectMetricValues(text, metricName, labelFilters);
  return values.length > 0 ? values[0] : null;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function parseMetrics(raw: string): ParsedMetrics {
  const diskIoConsumption = firstMetric(raw, "disk_io_consumption");
  const diskIoFallback = firstMetric(raw, "node_disk_io_time_weighted_seconds_total");

  const restRequests =
    sumMetric(raw, "postgrest_requests_total") ??
    sumMetric(raw, "http_server_request_duration_seconds_count", { service_type: "postgrest" }) ??
    sumMetric(raw, "promhttp_metric_handler_requests_total", { service_type: "postgrest" }) ??
    sumMetric(raw, "pgrst_jwt_cache_requests_total") ?? 0;

  const authRequests =
    sumMetric(raw, "gotrue_requests_total") ??
    sumMetric(raw, "http_server_request_duration_seconds_count", { service_type: "gotrue" }) ??
    sumMetric(raw, "promhttp_metric_handler_requests_total", { service_type: "gotrue" }) ??
    sumMetric(raw, "gotrue_compare_hash_and_password_submitted_total") ?? 0;

  const realtimeRequests =
    sumMetric(raw, "realtime_requests_total") ??
    sumMetric(raw, "http_server_request_duration_seconds_count", { service_type: "realtime" }) ??
    sumMetric(raw, "realtime_postgres_changes_total_subscriptions") ?? 0;

  const storageRequests =
    sumMetric(raw, "storage_requests_total") ??
    sumMetric(raw, "http_server_request_duration_seconds_count", { service_type: "storage" }) ??
    sumMetric(raw, "promhttp_metric_handler_requests_total", { service_type: "storage" }) ?? 0;

  const cpuUsage =
    firstMetric(raw, "cpu_usage") ??
    (() => {
      const idle = sumMetric(raw, "node_cpu_seconds_total", { mode: "idle" });
      const total = sumMetric(raw, "node_cpu_seconds_total");
      if (idle !== null && total !== null && total > 0) {
        return clampPercent(Math.round((1 - idle / total) * 100));
      }
      return null;
    })();

  const ramTotalBytes = firstMetric(raw, "node_memory_MemTotal_bytes");
  const ramAvailableBytes = firstMetric(raw, "node_memory_MemAvailable_bytes");
  const processResidentBytes = firstMetric(raw, "process_resident_memory_bytes");

  const ramUsedMb =
    (ramTotalBytes !== null && ramAvailableBytes !== null)
      ? Math.round((ramTotalBytes - ramAvailableBytes) / 1024 / 1024)
      : processResidentBytes !== null
        ? Math.round(processResidentBytes / 1024 / 1024)
        : firstMetric(raw, "ram_usage");

  const ramTotalMb =
    ramTotalBytes !== null ? Math.round(ramTotalBytes / 1024 / 1024) : null;

  const dbConnections =
    sumMetric(raw, "pg_stat_activity_count") ??
    sumMetric(raw, "pg_stat_database_num_backends") ??
    sumMetric(raw, "db_sql_connection_open") ??
    sumMetric(raw, "connection_stats_connection_count");

  return {
    diskIoBudget: diskIoConsumption !== null
      ? clampPercent(100 - diskIoConsumption)
      : diskIoFallback !== null
        ? clampPercent(100 - diskIoFallback)
        : null,
    restRequests,
    authRequests,
    realtimeRequests,
    storageRequests,
    cpuUsage,
    ramUsedMb,
    ramTotalMb,
    dbConnections,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Nuclear logout: cierra TODAS las sesiones y refresh tokens excepto las del sysadmin.
 * Usa conexión directa a Postgres (SUPABASE_DB_URL) para borrar de auth.sessions
 * Y auth.refresh_tokens simultáneamente. Sin refresh tokens, los clientes no pueden reconectarse.
 */
async function handleNuclearLogout(callerUserId: string) {
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!dbUrl) {
    throw new Error("SUPABASE_DB_URL not configured");
  }

  const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.4/mod.js");
  const sql = postgres(dbUrl);

  try {
    // 1. Borrar refresh tokens de todos excepto el sysadmin
    const refreshResult = await sql`
      DELETE FROM auth.refresh_tokens
      WHERE session_id IN (
        SELECT id FROM auth.sessions WHERE user_id != ${callerUserId}
      )
    `;
    const refreshCount = refreshResult.count ?? 0;

    // 2. Borrar sesiones de todos excepto el sysadmin
    const sessionResult = await sql`
      DELETE FROM auth.sessions
      WHERE user_id != ${callerUserId}
    `;
    const sessionCount = sessionResult.count ?? 0;

    await sql.end();

    console.log(`☢️ NUCLEAR LOGOUT: ${sessionCount} sesiones + ${refreshCount} refresh tokens eliminados (excepto sysadmin ${callerUserId})`);
    return { success: true, sessions: sessionCount, refreshTokens: refreshCount, count: sessionCount };
  } catch (err) {
    await sql.end();
    console.error("Nuclear logout DB error:", err);
    throw err;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: { user: authUser }, error: authError } = await adminClient.auth.getUser(token);

    if (authError || !authUser?.id) {
      console.warn("JWT validation failed", authError?.message ?? "no-user");
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = authUser.id;

    // Check sysadmin role
    const { data: roles, error: roleError } = await adminClient
      .from("user_roles").select("role")
      .eq("user_id", userId).eq("role", "sysadmin");

    if (roleError) {
      console.error("Role lookup failed:", roleError.message);
      return new Response(JSON.stringify({ error: "Role lookup failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden: sysadmin role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for action parameter
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "nuclear_logout") {
      try {
        const result = await handleNuclearLogout(userId);
        console.log(`☢️ NUCLEAR LOGOUT ejecutado por sysadmin ${userId}: ${result.count} sesiones cerradas`);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("Nuclear logout failed:", err);
        return new Response(JSON.stringify({ error: "Nuclear logout failed", details: String(err) }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch metrics
    const metricsUrl = `https://${PROJECT_REF}.supabase.co/customer/v1/privileged/metrics`;
    const credentials = btoa(`service_role:${SERVICE_ROLE_KEY}`);

    const metricsResponse = await fetch(metricsUrl, {
      headers: { Authorization: `Basic ${credentials}` },
    });

    if (!metricsResponse.ok) {
      const errText = await metricsResponse.text();
      console.error("Metrics fetch failed:", metricsResponse.status, errText);
      return new Response(
        JSON.stringify({ error: `Metrics endpoint returned ${metricsResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawText = await metricsResponse.text();
    const metrics = parseMetrics(rawText);

    // [AUTO-PROTECTION + NUCLEAR LOGOUT ON SHIELD ACTIVATION]
    if (metrics.diskIoBudget !== null) {
      const { data: config } = await adminClient
        .from("system_config")
        .select("key, value")
        .in("key", ["auto_maintenance_protection", "maintenance_threshold", "maintenance_mode"]);
      
      const currentMode = config?.find(c => c.key === "maintenance_mode")?.value;
      const autoProtect = config?.find(c => c.key === "auto_maintenance_protection")?.value === "true";
      const threshold = Number(config?.find(c => c.key === "maintenance_threshold")?.value) || 20;

      if (autoProtect && metrics.diskIoBudget <= threshold && currentMode !== "true") {
        console.warn(`🛡️ AUTO-SHIELD: Burst Balance (${metrics.diskIoBudget}%) cayó al umbral (${threshold}%). Activando modo mantenimiento + Nuclear Logout.`);
        await adminClient
          .from("system_config")
          .update({ value: "true" })
          .eq("key", "maintenance_mode");

        // Nuclear logout automático al activar el escudo
        try {
          const logoutResult = await handleNuclearLogout(userId);
          console.warn(`☢️ AUTO NUCLEAR LOGOUT: ${logoutResult.count} sesiones cerradas junto con activación del escudo.`);
        } catch (logoutErr) {
          console.error("Auto nuclear logout failed (shield still activated):", logoutErr);
        }
      }
    }

    // Store snapshot (fire-and-forget)
    if (metrics.diskIoBudget !== null) {
      adminClient
        .from("system_metrics_history")
        .insert({ disk_io_budget: metrics.diskIoBudget })
        .then(() => {
          // Cleanup only 10% of the time to reduce I/O
          if (Math.random() < 0.1) {
            const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
            adminClient
              .from("system_metrics_history")
              .delete()
              .lt("recorded_at", cutoff)
              .then(() => {});
          }
        });
    }

    // Fetch 48h history
    const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: history } = await adminClient
      .from("system_metrics_history")
      .select("disk_io_budget, recorded_at")
      .gte("recorded_at", since48h)
      .order("recorded_at", { ascending: true });

    return new Response(JSON.stringify({
      ...metrics,
      diskIoHistory: history ?? [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("get-system-metrics error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});