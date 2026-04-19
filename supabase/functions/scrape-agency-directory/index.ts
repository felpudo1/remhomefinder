// Edge Function: scrape-agency-directory
// Scrapea índices web de inmobiliarias con Firecrawl y devuelve agencias parseadas
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

// Departamentos de Uruguay (lista cerrada para matching)
const UY_DEPARTMENTS = [
  "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno", "Flores",
  "Florida", "Lavalleja", "Maldonado", "Montevideo", "Paysandú", "Paysandu",
  "Río Negro", "Rio Negro", "Rivera", "Rocha", "Salto", "San José", "San Jose",
  "Soriano", "Tacuarembó", "Tacuarembo", "Treinta y Tres",
];

interface ParsedAgency {
  name: string;
  address: string;
  department_name: string | null;
  phone: string;
  website_url: string;
  email: string;
}

function detectDepartment(text: string): string | null {
  const lower = text.toLowerCase();
  for (const d of UY_DEPARTMENTS) {
    const re = new RegExp(`\\b${d.toLowerCase().replace(/[áéíóú]/g, (c) => {
      const map: Record<string, string> = { "á": "[aá]", "é": "[eé]", "í": "[ií]", "ó": "[oó]", "ú": "[uú]" };
      return map[c] || c;
    })}\\b`, "i");
    if (re.test(lower)) {
      // Normalizar tildes/variantes al nombre canónico
      if (/paysand[uú]/i.test(d)) return "Paysandú";
      if (/r[ií]o negro/i.test(d)) return "Río Negro";
      if (/san jos[eé]/i.test(d)) return "San José";
      if (/tacuaremb[oó]/i.test(d)) return "Tacuarembó";
      return d;
    }
  }
  return null;
}

function parseMarkdownToAgencies(markdown: string): ParsedAgency[] {
  const agencies: ParsedAgency[] = [];
  // Estrategia: dividir por encabezados markdown (### o ####)
  const blocks = markdown.split(/\n(?=#{2,4}\s)/);

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // Primera línea: nombre (quitar #)
    const headerLine = lines[0];
    const nameMatch = headerLine.match(/^#{2,4}\s+(.+)$/);
    if (!nameMatch) continue;

    const name = nameMatch[1].trim().replace(/\*\*/g, "").replace(/\[|\]/g, "");
    if (!name || name.length < 2 || name.length > 200) continue;

    const rest = lines.slice(1).join(" ");
    const blockText = lines.join(" ");

    // Extraer email
    const emailMatch = rest.match(/[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/);
    const email = emailMatch ? emailMatch[0] : "";

    // Extraer URL (web)
    const urlMatch = rest.match(/(https?:\/\/[^\s)]+|www\.[^\s)]+)/i);
    let website_url = urlMatch ? urlMatch[0] : "";
    // Limpiar markdown link syntax
    website_url = website_url.replace(/[)\]]+$/, "");

    // Extraer teléfono (UY: +598... o 09... o 2... 7+ dígitos)
    const phoneMatch = rest.match(/(\+?598[\s\-]?\d[\d\s\-]{6,}|\b0?9\d[\s\-]?\d{3}[\s\-]?\d{3}\b|\b2\d{3}[\s\-]?\d{4}\b|\b\d{4}[\s\-]?\d{4}\b)/);
    const phone = phoneMatch ? phoneMatch[0].trim() : "";

    // Departamento
    const department_name = detectDepartment(blockText);

    // Dirección: heurística - tomar primera línea sustancial que no sea el nombre, ni email, ni URL pura
    let address = "";
    for (const line of lines.slice(1)) {
      const clean = line.replace(/\*\*/g, "").trim();
      if (!clean) continue;
      if (clean === email) continue;
      if (clean === website_url) continue;
      if (/^https?:\/\//i.test(clean) || /^www\./i.test(clean)) continue;
      if (/^[\d\s\+\-()]+$/.test(clean)) continue;
      // Quitar el departamento del final si aparece
      let candidate = clean;
      if (department_name) {
        candidate = candidate.replace(new RegExp(`,?\\s*${department_name}\\s*$`, "i"), "").trim();
      }
      // Quitar email/url si estaban embebidos
      if (email) candidate = candidate.replace(email, "").trim();
      if (website_url) candidate = candidate.replace(website_url, "").trim();
      candidate = candidate.replace(/[,\s]+$/, "");
      if (candidate.length >= 5 && candidate.length <= 250) {
        address = candidate;
        break;
      }
    }

    agencies.push({
      name,
      address,
      department_name,
      phone,
      website_url,
      email,
    });
  }

  // Deduplicar por nombre normalizado dentro del mismo scrape
  const seen = new Set<string>();
  return agencies.filter((a) => {
    const key = a.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // Respuesta no-JSON (ej. HTML "Bad Gateway", "Internal Server Error")
    const snippet = text.slice(0, 200).replace(/\s+/g, " ").trim();
    throw new Error(`Respuesta no-JSON [${res.status}]: ${snippet || "(vacía)"}`);
  }
}

async function firecrawlScrape(url: string, apiKey: string): Promise<string> {
  const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    const snippet = text.slice(0, 300).replace(/\s+/g, " ").trim();
    throw new Error(`Firecrawl scrape falló [${res.status}]: ${snippet}`);
  }
  const data = await safeJson(res);
  // v2 puede devolver markdown en data.markdown o data.data.markdown
  return data?.data?.markdown ?? data?.markdown ?? "";
}

async function firecrawlCrawl(url: string, apiKey: string, maxPages: number): Promise<string[]> {
  const startRes = await fetch(`${FIRECRAWL_V2}/crawl`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      limit: maxPages,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    }),
  });
  if (!startRes.ok) {
    const text = await startRes.text();
    const snippet = text.slice(0, 300).replace(/\s+/g, " ").trim();
    throw new Error(`Firecrawl crawl start falló [${startRes.status}]: ${snippet}`);
  }
  const startData = await safeJson(startRes);
  const jobId = startData?.id ?? startData?.data?.id;
  if (!jobId) throw new Error("Firecrawl crawl: no job id");

  // Polling
  const maxWaitMs = 120_000;
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 3000));
    const statusRes = await fetch(`${FIRECRAWL_V2}/crawl/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!statusRes.ok) {
      const text = await statusRes.text();
      const snippet = text.slice(0, 300).replace(/\s+/g, " ").trim();
      throw new Error(`Crawl status error [${statusRes.status}]: ${snippet}`);
    }
    const statusData = await safeJson(statusRes);
    const status = statusData?.status ?? statusData?.data?.status;
    if (status === "completed") {
      const items = statusData?.data ?? statusData?.data?.data ?? [];
      const arr = Array.isArray(items) ? items : (statusData?.data?.data ?? []);
      return (Array.isArray(arr) ? arr : []).map((it: any) => it?.markdown ?? "").filter(Boolean);
    }
    if (status === "failed") throw new Error("Crawl failed");
  }
  throw new Error("Crawl timeout");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: validar admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Acceso denegado: solo admins" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Input
    const { url, crawl = false, maxPages = 5 } = await req.json();
    if (!url || typeof url !== "string" || !/^https?:\/\//.test(url)) {
      return new Response(JSON.stringify({ error: "URL inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY") || Deno.env.get("FIRECRAWL_API_KEY_1");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY no configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Scrape
    let markdowns: string[] = [];
    if (crawl) {
      markdowns = await firecrawlCrawl(url, apiKey, Math.min(maxPages, 20));
    } else {
      const md = await firecrawlScrape(url, apiKey);
      markdowns = [md];
    }

    // Parsear cada markdown
    const allAgencies: ParsedAgency[] = [];
    for (const md of markdowns) {
      allAgencies.push(...parseMarkdownToAgencies(md));
    }

    // Deduplicar global
    const seen = new Set<string>();
    const unique = allAgencies.filter((a) => {
      const k = a.name.toLowerCase().trim();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    // Resolver department_id por nombre
    const deptNames = [...new Set(unique.map((a) => a.department_name).filter(Boolean))] as string[];
    let deptMap: Record<string, string> = {};
    if (deptNames.length > 0) {
      const { data: depts } = await supabase
        .from("departments")
        .select("id,name")
        .in("name", deptNames);
      if (depts) {
        deptMap = Object.fromEntries(depts.map((d: any) => [d.name.toLowerCase(), d.id]));
      }
    }

    const enriched = unique.map((a) => ({
      ...a,
      department_id: a.department_name ? (deptMap[a.department_name.toLowerCase()] ?? null) : null,
    }));

    return new Response(
      JSON.stringify({ success: true, agencies: enriched, total: enriched.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("scrape-agency-directory error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message ?? "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
