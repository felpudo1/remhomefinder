import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROJECT_REF = "cuyfrpuiokvqvhvoerga";

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
  // Try multiple metric names for disk IO
  const diskIoConsumption =
    firstMetric(raw, "disk_io_consumption") ??
    firstMetric(raw, "disk_io_utilized_percentage") ??
    firstMetric(raw, "disk_io_used_percentage") ??
    firstMetric(raw, "node_disk_io_time_weighted_seconds_total");

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
    diskIoBudget: diskIoConsumption !== null ? clampPercent(diskIoConsumption) : null,
    restRequests,
    authRequests,
    realtimeRequests,
    storageRequests,
    cpuUsage,
    ramUsedMb,
    ramTotalMb,
    dbConnections,
    timestamp: new Date().toISOString(),
    version: "4.0.fallback",
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // EVERYTHING inside try/catch → always returns 200 + JSON
  try {
    // 1) Validate env vars
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing env vars", { hasUrl: !!supabaseUrl, hasKey: !!serviceRoleKey });
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY", timestamp: new Date().toISOString() }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 2) Check for special actions (nuclear logout, etc.)
    const url = new URL(req.url);
    const action = await getRequestedAction(req, url);

    if (action === "nuclear_logout") {
      const authHeader = req.headers.get("authorization") ?? "";
      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (!token) {
        return new Response(JSON.stringify({ error: "No token" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);
      if (authErr || !user) {
        return new Response(JSON.stringify({ error: "Auth failed" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: roleRow } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "sysadmin").maybeSingle();
      if (!roleRow) {
        return new Response(JSON.stringify({ error: "Unauthorized: sysadmin only" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const sessionId = getSessionIdFromJwt(token);
      const result = await handleNuclearLogout(user.id, sessionId);
      return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3) Fetch Prometheus metrics
    const metricsUrl = `https://${PROJECT_REF}.supabase.co/customer/v1/privileged/metrics`;
    const credentials = btoa(`service_role:${serviceRoleKey}`);

    const res = await fetch(metricsUrl, {
      headers: { Authorization: `Basic ${credentials}` },
    });
    const rawText = await res.text();

    const parsed = parseMetrics(rawText);

    // 4) If live disk IO is null, try history fallback
    let diskIoBudget = parsed.diskIoBudget;
    let diskIoSource: "live" | "history" | "unavailable" = diskIoBudget !== null ? "live" : "unavailable";
    let diskIoLastSampleAt: string | null = null;
    let diskIoHistory: Array<{ disk_io_budget: number; recorded_at: string }> = [];

    // Read fallback window from system_config (default 48h)
    let fallbackHours = 48;
    try {
      const { data: cfgRow } = await adminClient
        .from("system_config")
        .select("value")
        .eq("key", "history_fallback_max_hours")
        .maybeSingle();
      if (cfgRow?.value) {
        fallbackHours = Math.max(1, Number(cfgRow.value) || 48);
      }
    } catch (e) {
      console.warn("Could not read history_fallback_max_hours:", e);
    }

    // Fetch last 48h of history
    const histCutoff = new Date(Date.now() - fallbackHours * 60 * 60 * 1000).toISOString();
    try {
      const { data: histRows } = await adminClient
        .from("system_metrics_history")
        .select("disk_io_budget, recorded_at")
        .gte("recorded_at", histCutoff)
        .order("recorded_at", { ascending: true });

      if (histRows && histRows.length > 0) {
        diskIoHistory = histRows.filter((r: any) => r.disk_io_budget !== null) as any;
      }
    } catch (e) {
      console.warn("History query failed:", e);
    }

    // If live is null, use the latest non-null historical value
    if (diskIoBudget === null && diskIoHistory.length > 0) {
      const latest = diskIoHistory[diskIoHistory.length - 1];
      if (latest && typeof latest.disk_io_budget === "number") {
        diskIoBudget = clampPercent(latest.disk_io_budget);
        diskIoSource = "history";
        diskIoLastSampleAt = latest.recorded_at;
        const ageMin = Math.round((Date.now() - new Date(latest.recorded_at).getTime()) / 60_000);
        console.log(`Disk IO fallback: using historical value ${diskIoBudget}% from ${ageMin} min ago`);
      }
    }

    // 5) Save current live value to history (only if live and > 0)
    if (parsed.diskIoBudget !== null) {
      try {
        await adminClient.from("system_metrics_history").insert({
          disk_io_budget: parsed.diskIoBudget,
          recorded_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("Failed to save metric to history:", e);
      }
    }

    // 6) Return full response
    return new Response(JSON.stringify({
      ...parsed,
      diskIoBudget,
      diskIoSource,
      diskIoLastSampleAt,
      diskIoHistory,
      timestamp: new Date().toISOString(),
      version: "4.0.fallback",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("get-system-metrics unhandled error:", err);
    return new Response(JSON.stringify({
      error: err.message ?? "Unknown error",
      stack: String(err.stack ?? "").slice(0, 500),
      timestamp: new Date().toISOString(),
      version: "4.0.fallback",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
