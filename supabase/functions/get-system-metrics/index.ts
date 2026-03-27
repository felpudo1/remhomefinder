import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
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

function parsePrometheusValue(text: string, metricName: string): number | null {
  // Match lines like: metric_name{labels} value timestamp
  // or: metric_name value timestamp
  const regex = new RegExp(`^${metricName}(?:\\{[^}]*\\})?\\s+([\\d.eE+-]+)`, "m");
  const match = text.match(regex);
  if (match) return parseFloat(match[1]);
  return null;
}

function sumPrometheusMetric(text: string, metricName: string): number | null {
  const regex = new RegExp(`^${metricName}(?:\\{[^}]*\\})?\\s+([\\d.eE+-]+)`, "gm");
  let sum = 0;
  let found = false;
  let match;
  while ((match = regex.exec(text)) !== null) {
    sum += parseFloat(match[1]);
    found = true;
  }
  return found ? sum : null;
}

function parseMetrics(raw: string): ParsedMetrics {
  return {
    diskIoBudget: parsePrometheusValue(raw, "node_disk_io_time_weighted_seconds_total") !== null
      ? Math.max(0, 100 - (parsePrometheusValue(raw, "node_disk_io_time_weighted_seconds_total") ?? 0))
      : parsePrometheusValue(raw, "disk_io_consumption"),
    restRequests: sumPrometheusMetric(raw, "postgrest_requests_total"),
    authRequests: sumPrometheusMetric(raw, "gotrue_requests_total"),
    realtimeRequests: sumPrometheusMetric(raw, "realtime_requests_total"),
    storageRequests: sumPrometheusMetric(raw, "storage_requests_total"),
    cpuUsage: parsePrometheusValue(raw, "cpu_usage") ??
      (() => {
        const idle = parsePrometheusValue(raw, 'node_cpu_seconds_total{mode="idle"}');
        const total = sumPrometheusMetric(raw, "node_cpu_seconds_total");
        if (idle !== null && total !== null && total > 0) return Math.round((1 - idle / total) * 100);
        return null;
      })(),
    ramUsedMb: (() => {
      const total = parsePrometheusValue(raw, "node_memory_MemTotal_bytes");
      const avail = parsePrometheusValue(raw, "node_memory_MemAvailable_bytes");
      if (total !== null && avail !== null) return Math.round((total - avail) / 1024 / 1024);
      const used = parsePrometheusValue(raw, "ram_usage");
      return used;
    })(),
    ramTotalMb: (() => {
      const total = parsePrometheusValue(raw, "node_memory_MemTotal_bytes");
      if (total !== null) return Math.round(total / 1024 / 1024);
      return null;
    })(),
    dbConnections: parsePrometheusValue(raw, "pg_stat_activity_count") ??
      sumPrometheusMetric(raw, "pg_stat_activity_count"),
    timestamp: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT and check sysadmin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check sysadmin role using service_role client
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "sysadmin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden: sysadmin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch metrics from Supabase privileged endpoint
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

    return new Response(JSON.stringify(metrics), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("get-system-metrics error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
