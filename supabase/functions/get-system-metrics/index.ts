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
  version?: string;
}

interface HistoryPoint {
  disk_io_budget: number;
  recorded_at: string;
}

type DiskIoSource = "live" | "history" | "unavailable";

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

function getHistoryTail(history: HistoryPoint[]): { latestValue: number | null; latestAt: string | null } {
  if (history.length === 0) {
    return { latestValue: null, latestAt: null };
  }

  const latest = history[history.length - 1];
  const latestValue = latest?.disk_io_budget;
  return {
    latestValue: typeof latestValue === "number" && Number.isFinite(latestValue)
      ? clampPercent(latestValue)
      : null,
    latestAt: latest?.recorded_at ?? null,
  };
}

function getSessionIdFromJwt(token: string): string | null {
  try {
    const [, rawPayload] = token.split(".");
    if (!rawPayload) return null;

    const normalized = rawPayload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { session_id?: unknown };

    return typeof payload.session_id === "string" && payload.session_id.length > 0
      ? payload.session_id
      : null;
  } catch {
    return null;
  }
}

async function getRequestedAction(req: Request, url: URL): Promise<string | null> {
  const fromQuery = url.searchParams.get("action");
  if (fromQuery) return fromQuery;

  if (req.method === "GET" || req.method === "HEAD") return null;

  try {
    const body = await req.clone().json() as { action?: unknown };
    return typeof body.action === "string" ? body.action : null;
  } catch {
    return null;
  }
}

function parseMetrics(raw: string): ParsedMetrics {
  const diskIoConsumption = firstMetric(raw, "disk_io_consumption");

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
      ? clampPercent(diskIoConsumption)
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
    version: "1.0.debug.7",
  };
}

/**
 * Nuclear logout: cierra TODAS las sesiones y refresh tokens excepto las del sysadmin.
 * Usa conexión directa a Postgres (SUPABASE_DB_URL) para borrar de auth.sessions
 * Y auth.refresh_tokens simultáneamente. Sin refresh tokens, los clientes no pueden reconectarse.
 */
async function handleNuclearLogout(callerUserId: string, callerSessionId: string | null) {
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!dbUrl) {
    throw new Error("SUPABASE_DB_URL not configured");
  }

  const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.4/mod.js");
  const sql = postgres(dbUrl);

  try {
    const beforeRows = await sql`SELECT count(*)::int AS total FROM auth.sessions`;
    const totalBefore = Number(beforeRows[0]?.total ?? 0);

    const keepBySession = callerSessionId
      ? await sql`SELECT id FROM auth.sessions WHERE id = ${callerSessionId} LIMIT 1`
      : [];

    const keepByLatestSysadminSession = await sql`
      SELECT id
      FROM auth.sessions
      WHERE user_id = ${callerUserId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const keepSessionId = keepBySession.length > 0
      ? callerSessionId
      : keepByLatestSysadminSession.length > 0
        ? String(keepByLatestSysadminSession[0].id)
        : null;

    let refreshResult;
    let sessionResult;

    if (keepSessionId) {
      // Mantener una sola sesión del sysadmin y cerrar todo lo demás.
      refreshResult = await sql`
        DELETE FROM auth.refresh_tokens
        WHERE session_id IN (
          SELECT id FROM auth.sessions WHERE id != ${keepSessionId}
        )
      `;

      sessionResult = await sql`
        DELETE FROM auth.sessions
        WHERE id != ${keepSessionId}
      `;
    } else {
      // Fallback extremo: si no hay sesión del caller detectable, no tocar sesiones del caller por user_id.
      refreshResult = await sql`
        DELETE FROM auth.refresh_tokens
        WHERE session_id IN (
          SELECT id FROM auth.sessions WHERE user_id != ${callerUserId}
        )
      `;

      sessionResult = await sql`
        DELETE FROM auth.sessions
        WHERE user_id != ${callerUserId}
      `;
    }

    const refreshCount = refreshResult.count ?? 0;
    const sessionCount = sessionResult.count ?? 0;

    const afterRows = await sql`SELECT count(*)::int AS total FROM auth.sessions`;
    const totalAfter = Number(afterRows[0]?.total ?? 0);

    await sql.end();

    console.log(
      `☢️ NUCLEAR LOGOUT: ${sessionCount} sesiones + ${refreshCount} refresh tokens eliminados (antes=${totalBefore}, después=${totalAfter}, except caller=${callerUserId}, keepSession=${keepSessionId ?? "none"})`
    );
    return {
      success: true,
      sessions: sessionCount,
      refreshTokens: refreshCount,
      count: sessionCount,
      totalBefore,
      totalAfter,
      keepSessionId,
    };
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
    const metricsUrl = `https://${PROJECT_REF}.supabase.co/customer/v1/privileged/metrics`;
    const credentials = btoa(`service_role:${SERVICE_ROLE_KEY}`);

    const res = await fetch(metricsUrl, {
      headers: { Authorization: `Basic ${credentials}` },
    });
    const text = await res.text();
    
    let parsed = {};
    try {
      parsed = parseMetrics(text);
    } catch (e) {
      console.error("Parse error:", e);
    }

    const diskLines = text.split('\n').filter(l => l.toLowerCase().includes('disk')).join('\n');
    const allNames = Array.from(new Set(text.split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>l.split('{')[0].split(' ')[0]))).slice(0, 100);

    return new Response(JSON.stringify({
      ...parsed,
      debug_raw_disk: diskLines,
      debug_all_names: allNames,
      status: res.status,
      version: "3.0.emergency"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Emergency catch", details: err.message }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});