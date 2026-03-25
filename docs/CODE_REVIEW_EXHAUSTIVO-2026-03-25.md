# Code review exhaustivo — Repositorio inmobiliario (Supabase + React)

**Contexto:** El prompt de referencia menciona Next.js; en este repositorio el front es **Vite + React 18 + React Router + TanStack Query + Tailwind**. El análisis aplica igualmente a capa de datos, RLS y Edge Functions.

**Alcance revisado (muestra representativa):** `src/integrations/supabase/client.ts`, `src/hooks/useAuth.ts`, `src/hooks/usePropertyQueries.ts`, `src/hooks/usePropertyMutations.ts`, `src/hooks/useMarketplaceProperties.ts`, `src/components/ProtectedRoute.tsx`, `supabase/functions/scrape-property/index.ts`, `supabase/functions/extract-from-image/index.ts`, migraciones RLS (ej. `20260321010000_fix_agent_visibility_rls.sql`).

---

## Problemas detectados (priorizados)

### P0 — Seguridad / abuso de recursos

1. **CORS `Access-Control-Allow-Origin: *` en Edge Functions** (`scrape-property`, `extract-from-image`). Cualquier origen puede invocar si conoce la URL del proyecto y pasa `apikey` anónimo (según configuración de Supabase). Riesgo: abuso de cuotas (Firecrawl, ZenRows, Lovable AI), costos y DoS lógico. *Mitigación:* origen explícito, validación de JWT con `supabase.auth.getUser()` usando el cliente con el token del request, rate limiting, o invocación solo con service role interna.

2. **`extract-from-image` acepta URLs de imagen arbitrarias** sin autenticación explícita en el handler. Un atacante podría forzar fetch de imágenes grandes o SSRF si la gateway de IA resuelve URLs. *Mitigación:* exigir `Authorization`, whitelist de dominios (p. ej. solo Storage firmado de Supabase), tamaño máximo, timeout.

3. **Parseo de JWT con `atob(parts[1])` en `scrape-property`** (`getUserIdFromAuthHeader`). JWTs pueden ser base64url; `atob` falla o parsea mal en algunos tokens. Además no verifica firma: el `user_id` en logs podría ser spoofeado si el insert no valida el token en servidor. *Mitigación:* `supabase.auth.getUser(jwt)` o verificación con clave JWT del proyecto.

### P1 — Rendimiento (CPU, red, disco / Postgres)

4. **`usePropertyQueries`: query masiva + N efectos en cliente.** Un solo `user_listings` con `properties(*)` y joins anidados, luego `Promise.all` con muchas consultas (`status_history_log` con `.order` por tipo de estado, `family_comments`, adjuntos, RPCs). Con muchos listados esto escala mal en **número de round-trips** y **tamaño de payload** (JSON anidado, imágenes en `properties` si vienen en fila).

5. **Realtime: dos canales que escuchan `*` en varias tablas** y en cada evento hacen `refetchQueries` del listado completo. Alto costo en **CPU (cliente)** y **lecturas repetidas a Postgres** ante actividad frecuente (comentarios, adjuntos). Riesgo de **tormenta de refetch** si varios usuarios u org comparten actividad.

6. **`usePropertyMutations` — `updateStatus`:** `onSuccess` y `onSettled` ambos llaman `invalidateQueries(["properties"])`, duplicando invalidaciones innecesarias.

7. **`usePropertyQueries` — `refetch`:** invalida `queryKey: ["properties"]` sin `userId`, mientras la query usa `["properties", currentUserId]`. TanStack Query v5 suele invalidar por prefijo, pero es **inconsistente** con `onMutate` que usa `["properties", user?.id]`; conviene unificar para evitar refetches globales o misses.

8. **Mapeo de listados:** `allComments.filter` por cada `listing` en el `.map` → **O(listings × comments)** en CPU. Para cientos de comentarios y decenas de listados ya se nota.

9. **PostgREST `select` con `as any`:** pierde garantías de tipos; errores de forma de datos solo en runtime.

### P2 — Lógica / condiciones de carrera

10. **`useAuth.signUp`:** `updateUser` inmediatamente tras `signUp` puede competir con sesión aún no establecida o email no confirmado; el `upsert` de `profiles` con reintentos mitiga parcialmente pero los errores se **tragan** (`console.error` sin feedback al usuario) → usuario cree que el perfil está OK cuando puede faltar `referred_by_id` u otros campos.

11. **`usePropertyMutations.updateStatus` — `onMutate`:** optimista usa `status` del **mapa UI antiguo** (`contacted` vs `contactado`). Si el usuario envía el enum en inglés, el cache queda desalineado con lo que persiste el servidor (`statusMap`).

12. **`ProtectedRoute`:** `previousUserId` se reinicia en cada ejecución del `useEffect` (siempre `null` al montar). La rama “usuario cambió, limpiar caché” **casi nunca corre** en el mismo montaje; la limpieza depende de `onAuthStateChange`. Comportamiento confuso y posible **flash de datos** entre usuarios en escenarios raros (misma pestaña, cambio de cuenta).

### P3 — Seguridad de datos / RLS (revisión estática)

13. **Políticas con `EXISTS` + joins** (ej. agentes viendo `user_listings` por `source_publication_id`) son correctas en intención pero en Postgres cada `SELECT` puede evaluar subconsultas por fila. Sin índices adecuados en `FK` usados en `USING`, **costo de plan** crece. Recomendación: revisar `EXPLAIN` en producción y asegurar índices en `user_listings(source_publication_id)`, `agent_publications(id, org_id)`, etc.

14. **RPC `SECURITY DEFINER`** (`get_marketplace_org_names`, `get_marketplace_publication_contacts`): deben validar en SQL que no filtren datos ajenos; no se auditaron todas las migraciones en este documento — **riesgo típico** si el cuerpo de la función no restringe por rol/org.

15. **Variables de entorno:** cliente valida `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` al cargar (bien). Claves de terceros solo en Edge (bien). **Publicación de `anon` key** es asumida; el riesgo está en RLS + límites de uso de funciones.

### P4 — Otros

16. **`scrape-property`:** en catch, `JSON.parse` del body de IA sin try/catch específico puede lanzar; hay manejo genérico. **`tokenCharged: true` en logs de error** puede distorsionar métricas de facturación vs éxito real.

17. **Defaults de moneda inconsistentes** entre ramas visión / URL en respuestas (`UYU` vs `ARS` vs `USD`) → errores de negocio en UI si la IA no devuelve moneda.

---

## Refactorización sugerida (código de referencia — no aplicado)

### 1) `usePropertyQueries`: habilitar query solo con usuario; índice en memoria para comentarios; unificar invalidación

```typescript
// Patrón sugerido (ilustrativo): reducir O(n*m) y evitar fetch sin usuario
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const PROPERTIES_KEY = (userId: string | null) => ["properties", userId] as const;

// Dentro de queryFn, tras obtener allComments:
function buildCommentsByListingId(comments: { user_listing_id: string }[]) {
  const map = new Map<string, typeof comments>();
  for (const c of comments) {
    const arr = map.get(c.user_listing_id) ?? [];
    arr.push(c);
    map.set(c.user_listing_id, arr);
  }
  return map;
}

// useQuery({
//   queryKey: PROPERTIES_KEY(currentUserId),
//   enabled: !!currentUserId,
//   queryFn: async () => { ... },
// });

// refetch:
//   queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY(currentUserId) });
```

### 2) Realtime: debounce o invalidación selectiva

```typescript
// En lugar de refetch completo en cada evento postgres_changes:
import { useRef, useCallback } from "react";

function useDebouncedInvalidate(queryClient: QueryClient, delayMs: number) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (key: readonly unknown[]) => {
      if (t.current) clearTimeout(t.current);
      t.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: key });
      }, delayMs);
    },
    [queryClient, delayMs],
  );
}
// debouncedInvalidate(PROPERTIES_KEY(currentUserId));
```

### 3) Edge Function: validar JWT y acotar CORS

```typescript
// Esqueleto Deno: verificar usuario antes de gastar créditos
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://tu-dominio.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return new Response(JSON.stringify({ success: false, error: "Invalid body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  // ... resto con rate limit por user.id
});
```

### 4) `usePropertyMutations`: una sola invalidación en settle

```typescript
// Quitar duplicado: conservar solo onSettled o solo onSuccess
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ["properties"] });
},
```

---

## Explicación técnica

- **Estabilidad:** Unificar claves de React Query y el estado optimista con los mismos enums que el backend evita UI “mentirosa” y rollbacks confusos. Manejar errores de `profiles` tras signup en lugar de silenciarlos evita datos incompletos y tickets difíciles de reproducir.

- **Performance:** Reducir refetches completos ante realtime (debounce o actualización incremental) baja **presión en disco y CPU de Postgres** y **tiempo main-thread** en el navegador. Pasar de filtros anidados por listing a un `Map` baja complejidad de CPU en el cliente. Índices y RPCs agregados en servidor reducen round-trips frente a 8–10 queries por carga de página.

- **Seguridad:** CORS restrictivo + `getUser()` en Edge alinea el costo de APIs externas con identidades válidas; reduce abuso anónimo. Revisión continua de funciones `SECURITY DEFINER` es obligatoria en Postgres para evitar escalada horizontal de lectura de datos.

- **Memoria:** Suscripciones realtime se limpian en `usePropertyQueries` (bien). Vigilar número de canales duplicados si el hook se monta en varios árboles sin memoización de provider.

---

## Arquitectura (REGLA 2 — modularidad y escalado)

1. **Capa de datos:** Extraer `fetchUserListingsBundle(userId)` a un módulo `src/lib/api/userListings.ts` (sin hooks) para testear y, más adelante, sustituir por una **vista materializada** o **RPC única** que devuelva el DTO ya hidratado (menos acoplamiento PostgREST ↔ UI).

2. **Contratos:** Definir tipos Zod para respuestas de RPC y filas anidadas en lugar de `as any`, al menos en el borde del mapper.

3. **Feature flags / quotas:** Límites de scraping por `user_id` en tabla o Edge middleware antes de llamar a Firecrawl/ZenRows.

4. **Separación BFF:** Para una futura migración a Next.js, las llamadas sensibles podrían vivir en Route Handlers con sesión server-side; el patrón actual (todo cliente + anon key) es común pero exige RLS impecable.

---

## Nota sobre JSONB

Si `event_metadata` o `properties.details` usan JSONB, conviene:

- Documentar esquema esperado en migraciones o comentarios SQL.
- Evitar índices GIN genéricos hasta tener consultas reales que los justifiquen (costo de escritura).
- Preferir columnas normalizadas para filtros frecuentes (estado, fechas) ya parcialmente hecho con `current_status` y logs.

---

*Documento generado como revisión estática; no modifica el código fuente de la aplicación.*
