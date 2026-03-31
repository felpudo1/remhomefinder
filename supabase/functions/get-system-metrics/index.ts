import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Identificador del proyecto (ahora dinámico vía env vars para Vercel/Prod)
const PROJECT_REF = Deno.env.get("SUPABASE_URL") 
  ? new URL(Deno.env.get("SUPABASE_URL")!).hostname.split('.')[0] 
  : "cuyfrpuiokvqvhvoerga"; // Fallback local

// ── Helpers ──────────────────────────────────────────────

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

// ── Parse Prometheus text ────────────────────────────────

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

function parseMetrics(raw: string): ParsedMetrics {
  // Try multiple metric names for disk IO consumption (percentage 0-100)
  // NOTE: node_disk_io_time_weighted_seconds_total is a cumulative counter, NOT a percentage — excluded
  const diskIoConsumption =
    firstMetric(raw, "disk_io_consumption") ??
    firstMetric(raw, "disk_io_utilized_percentage") ??
    firstMetric(raw, "disk_io_used_percentage");

  // Also try direct budget metric (already 0-100 percentage of remaining budget)
  const diskIoBudgetDirect =
    firstMetric(raw, "disk_io_budget_remaining") ??
    firstMetric(raw, "disk_io_budget_percent");

  // Log diagnostic info for disk IO metric resolution
  console.log("[disk-io-debug]", JSON.stringify({
    disk_io_consumption: firstMetric(raw, "disk_io_consumption"),
    disk_io_utilized_percentage: firstMetric(raw, "disk_io_utilized_percentage"),
    disk_io_used_percentage: firstMetric(raw, "disk_io_used_percentage"),
    disk_io_budget_remaining: firstMetric(raw, "disk_io_budget_remaining"),
    disk_io_budget_percent: firstMetric(raw, "disk_io_budget_percent"),
    node_disk_io_weighted: firstMetric(raw, "node_disk_io_time_weighted_seconds_total"),
  }));

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

  // Resolve disk IO budget: prefer consumption-based calc, fallback to direct budget metric
  const resolvedDiskIoBudget =
    diskIoConsumption !== null
      ? clampPercent(100 - diskIoConsumption)
      : diskIoBudgetDirect !== null
        ? clampPercent(diskIoBudgetDirect)
        : null;

  console.log("[disk-io-resolved]", JSON.stringify({
    consumption: diskIoConsumption,
    directBudget: diskIoBudgetDirect,
    resolved: resolvedDiskIoBudget,
  }));

  return {
    diskIoBudget: resolvedDiskIoBudget,
    restRequests,
    authRequests,
    realtimeRequests,
    storageRequests,
    cpuUsage,
    ramUsedMb,
    ramTotalMb,
    dbConnections,
    timestamp: new Date().toISOString(),
    version: "7.0.fix-disk-io",
  };
}

// ── Nuclear logout (unchanged) ───────────────────────────

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

async function handleNuclearLogout(callerUserId: string, callerSessionId: string | null) {
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!dbUrl) throw new Error("SUPABASE_DB_URL not configured");

  const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.4/mod.js");
  const sql = postgres(dbUrl);

  try {
    const beforeRows = await sql`SELECT count(*)::int AS total FROM auth.sessions`;
    const totalBefore = Number(beforeRows[0]?.total ?? 0);

    const keepBySession = callerSessionId
      ? await sql`SELECT id FROM auth.sessions WHERE id = ${callerSessionId} LIMIT 1`
      : [];

    const keepByLatestSysadminSession = await sql`
      SELECT id FROM auth.sessions WHERE user_id = ${callerUserId} ORDER BY created_at DESC LIMIT 1
    `;

    const keepSessionId = keepBySession.length > 0
      ? callerSessionId
      : keepByLatestSysadminSession.length > 0
        ? String(keepByLatestSysadminSession[0].id)
        : null;

    let refreshResult, sessionResult;

    if (keepSessionId) {
      refreshResult = await sql`DELETE FROM auth.refresh_tokens WHERE session_id IN (SELECT id FROM auth.sessions WHERE id != ${keepSessionId})`;
      sessionResult = await sql`DELETE FROM auth.sessions WHERE id != ${keepSessionId}`;
    } else {
      refreshResult = await sql`DELETE FROM auth.refresh_tokens WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id != ${callerUserId})`;
      sessionResult = await sql`DELETE FROM auth.sessions WHERE user_id != ${callerUserId}`;
    }

    const refreshCount = refreshResult.count ?? 0;
    const sessionCount = sessionResult.count ?? 0;
    const afterRows = await sql`SELECT count(*)::int AS total FROM auth.sessions`;
    const totalAfter = Number(afterRows[0]?.total ?? 0);
    await sql.end();

    return { success: true, sessions: sessionCount, refreshTokens: refreshCount, count: sessionCount, totalBefore, totalAfter, keepSessionId };
  } catch (err) {
    await sql.end();
    throw err;
  }
}

// ── Main handler ─────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing env vars" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const url = new URL(req.url);
    const action = await getRequestedAction(req, url);

    // ── Auth helper for actions ────────────────────────
    async function authenticateSysadmin(reqObj: Request) {
      const authHeader = reqObj.headers.get("authorization") ?? "";
      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (!token) return { user: null, token: "", error: "No token" };
      const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);
      if (authErr || !user) return { user: null, token, error: "Auth failed" };
      const { data: roleRow } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "sysadmin").maybeSingle();
      if (!roleRow) return { user: null, token, error: "Unauthorized" };
      return { user, token, error: null };
    }

    // ── List Sessions ───────────────────────────────────
    if (action === "list_sessions") {
      const { user, error: authError } = await authenticateSysadmin(req);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: authError || "Auth failed" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const dbUrl = Deno.env.get("SUPABASE_DB_URL");
      if (!dbUrl) {
        return new Response(JSON.stringify({ error: "SUPABASE_DB_URL not configured" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.4/mod.js");
      const sql = postgres(dbUrl);
      try {
        const rows = await sql`
          SELECT s.id AS session_id, s.user_id, s.created_at, s.updated_at,
                 COALESCE(p.display_name, '') AS display_name,
                 COALESCE(p.email, '') AS email,
                 COALESCE(ur.role::text, 'user') AS role
          FROM auth.sessions s
          LEFT JOIN public.profiles p ON p.user_id = s.user_id
          LEFT JOIN public.user_roles ur ON ur.user_id = s.user_id
          ORDER BY s.updated_at DESC
          LIMIT 200
        `;
        await sql.end();
        return new Response(JSON.stringify({ sessions: rows }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (err: any) {
        await sql.end();
        return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ── Close single session ────────────────────────────
    if (action === "close_session") {
      const { user, token, error: authError } = await authenticateSysadmin(req);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: authError || "Auth failed" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      let targetSessionId: string | null = null;
      try {
        const body = await req.clone().json() as { session_id?: string };
        targetSessionId = body.session_id || url.searchParams.get("session_id");
      } catch {
        targetSessionId = url.searchParams.get("session_id");
      }
      if (!targetSessionId) {
        return new Response(JSON.stringify({ error: "session_id required" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const dbUrl = Deno.env.get("SUPABASE_DB_URL");
      if (!dbUrl) {
        return new Response(JSON.stringify({ error: "SUPABASE_DB_URL not configured" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.4/mod.js");
      const sql = postgres(dbUrl);
      try {
        await sql`DELETE FROM auth.refresh_tokens WHERE session_id = ${targetSessionId}`;
        const result = await sql`DELETE FROM auth.sessions WHERE id = ${targetSessionId}`;
        await sql.end();
        return new Response(JSON.stringify({ success: true, deleted: result.count ?? 0 }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (err: any) {
        await sql.end();
        return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ── Close all sessions (except caller) ──────────────
    if (action === "close_all_sessions") {
      const { user, token, error: authError } = await authenticateSysadmin(req);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: authError || "Auth failed" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const callerSessionId = getSessionIdFromJwt(token);
      const result = await handleNuclearLogout(user.id, callerSessionId);
      return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Nuclear Logout (legacy alias) ───────────────────
    if (action === "nuclear_logout") {
      const { user, token, error: authError } = await authenticateSysadmin(req);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: authError || "Auth failed" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const result = await handleNuclearLogout(user.id, getSessionIdFromJwt(token));
      return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Metrics Fetch (Prometheus) ─────────────────────
    const metricsUrl = `https://${PROJECT_REF}.supabase.co/customer/v1/privileged/metrics`;
    const credentials = btoa(`service_role:${serviceRoleKey}`);

    const res = await fetch(metricsUrl, {
      headers: { Authorization: `Basic ${credentials}` },
    });
    const rawText = await res.text();
    const parsed = parseMetrics(rawText);

    // Guardar histórico de Disk IO Budget
    const diskIoBudget = parsed.diskIoBudget;
    const diskIoSource: "live" | "unavailable" = diskIoBudget !== null ? "live" : "unavailable";
    const diskIoLastSampleAt: string | null = diskIoBudget !== null ? new Date().toISOString() : null;

    // Crear cliente Supabase para guardar histórico
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Insertar snapshot en histórico con contadores de requests
    let diskIoHistory: Array<{ disk_io_budget: number; recorded_at: string; rest_requests: number; auth_requests: number; realtime_requests: number; storage_requests: number }> = [];
    {
      const row: Record<string, unknown> = {
        recorded_at: new Date().toISOString(),
        disk_io_budget: diskIoBudget,
        rest_requests: parsed.restRequests ?? 0,
        auth_requests: parsed.authRequests ?? 0,
        realtime_requests: parsed.realtimeRequests ?? 0,
        storage_requests: parsed.storageRequests ?? 0,
      };
      const { error: historyError } = await supabase
        .from("system_metrics_history")
        .insert(row);

      if (historyError) {
        console.error("Failed to save history:", historyError);
      }

      // Leer últimos 200 registros (aprox 3h de datos a 1/min) para filtros de período
      const { data: historyData } = await supabase
        .from("system_metrics_history")
        .select("disk_io_budget, recorded_at, rest_requests, auth_requests, realtime_requests, storage_requests")
        .order("recorded_at", { ascending: false })
        .limit(200);

      diskIoHistory = (historyData as any[]) || [];
    }

    return new Response(JSON.stringify({
      ...parsed,
      diskIoBudget,
      diskIoSource,
      diskIoLastSampleAt,
      diskIoHistory,
      version: "6.0.zero-db-dynamic"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Critical error:", err);
    return new Response(JSON.stringify({ error: err.message, version: "5.0.clean" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
