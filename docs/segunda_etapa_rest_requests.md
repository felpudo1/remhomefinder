# 📋 Segunda Etapa: REST Requests

**Fecha:** 2026-03-26  
**Proyecto:** homefinder4  
**Estado:** Soluciones 1+2 ya implementadas (-50-60% REST). Este informe detalla Soluciones 3+4 pendientes.

---

## ✅ Lo que ya se hizo (Soluciones 1 + 2)

| Solución | Archivo | Cambio | Estado |
|----------|---------|--------|--------|
| 1. QueryClient defaults | `App.tsx` | `staleTime: 2min`, `refetchOnWindowFocus: false` | ✅ |
| 2a. staleTime | `useFeedbackAttributes.ts` | 30 min | ✅ |
| 2b. staleTime | `useReferrerDisplayName` | Infinity | ✅ |
| 2c. staleTime | `useReferralCountForUser` | 10 min | ✅ |
| 2d. staleTime | `useSubscription.ts` | 10 min | ✅ |
| 2e. staleTime | `useGroups.ts` | 5 min | ✅ |

---

## 🔮 Solución 3 — RPCs Consolidadas (plan detallado)

> Objetivo: Reducir queries REST encadenadas consolidándolas en funciones PostgreSQL (RPCs) que hacen todo en el servidor.

---

### 3A. `useGroups` — De 3 queries a 1 RPC

**Estado actual (3 queries REST secuenciales):**

```typescript
// useGroups.ts — queryFn actual
// Query 1: obtener membresías del usuario
const { data: memberships } = await supabase
  .from("organization_members")
  .select("org_id")
  .eq("user_id", user.id);

// Query 2: obtener organizaciones
const { data: orgs } = await supabase
  .from("organizations")
  .select("*")
  .in("id", orgIds)
  .eq("is_personal", false);

// Query 3 (implícita): filtrar agency vs groups
const agencyOrg = allOrgs.find((o) => o.type === "agency_team") || null;
const groups = allOrgs.filter((o) => o.type !== "agency_team");
```

**RPC propuesta — SQL a crear en Supabase:**

```sql
-- Migración: supabase/migrations/YYYYMMDDHHMMSS_rpc_get_user_groups.sql
CREATE OR REPLACE FUNCTION get_user_groups()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'groups', COALESCE((
      SELECT json_agg(json_build_object(
        'id', o.id,
        'name', o.name,
        'description', COALESCE(o.description, ''),
        'created_by', o.created_by,
        'invite_code', o.invite_code,
        'created_at', o.created_at,
        'type', o.type
      ))
      FROM organization_members om
      JOIN organizations o ON o.id = om.org_id
      WHERE om.user_id = auth.uid()
        AND o.is_personal = false
        AND o.type != 'agency_team'
    ), '[]'::json),
    'agencyOrg', (
      SELECT json_build_object(
        'id', o.id,
        'name', o.name,
        'description', COALESCE(o.description, ''),
        'created_by', o.created_by,
        'invite_code', o.invite_code,
        'created_at', o.created_at,
        'type', o.type
      )
      FROM organization_members om
      JOIN organizations o ON o.id = om.org_id
      WHERE om.user_id = auth.uid()
        AND o.is_personal = false
        AND o.type = 'agency_team'
      LIMIT 1
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
```

**Hook modificado:**

```typescript
// useGroups.ts — queryFn nuevo
queryFn: async () => {
  const { data, error } = await supabase.rpc("get_user_groups");
  if (error) throw error;
  return {
    groups: (data?.groups || []) as Group[],
    agencyOrg: data?.agencyOrg || null as Group | null,
  };
},
```

**Impacto:** 3 queries → 1 RPC. **-2 REST requests por mount.**

---

### 3B. `useAgentPropertyInsights` — De 4 queries a 1 RPC

**Estado actual (4 queries REST secuenciales):**

```typescript
// useAgentPropertyInsights.ts — queryFn actual (296 líneas)
// Query 1: agent_publications + properties
const { data: pubs } = await supabase
  .from("agent_publications")
  .select("id, property_id, properties(title, neighborhood, ref), status")
  .eq("org_id", agencyOrgId)
  .neq("status", "eliminado");

// Query 2: user_listings vinculados
const { data: listings } = await supabase
  .from("user_listings")
  .select("id, source_publication_id, added_by, current_status, updated_at")
  .in("source_publication_id", pubIds);

// Query 3: profiles de los usuarios
const { data: profiles } = await supabase
  .from("profiles")
  .select("user_id, display_name, email, phone")
  .in("user_id", userIds);

// Query 4: status_history_log con ratings
const { data: logs } = await supabase
  .from("status_history_log")
  .select("user_listing_id, new_status, event_metadata, created_at")
  .in("user_listing_id", listingIds)
  .order("created_at", { ascending: true });
```

**RPC propuesta — SQL a crear en Supabase:**

```sql
-- Migración: supabase/migrations/YYYYMMDDHHMMSS_rpc_get_agent_insights.sql
CREATE OR REPLACE FUNCTION get_agent_insights(_org_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(pub_data), '[]'::json)
  INTO result
  FROM (
    SELECT json_build_object(
      'publicationId', ap.id,
      'propertyId', ap.property_id,
      'title', COALESCE(p.title, ''),
      'neighborhood', COALESCE(p.neighborhood, ''),
      'ref', p.ref,
      'users', COALESCE((
        SELECT json_agg(json_build_object(
          'userId', ul.added_by,
          'displayName', COALESCE(pr.display_name, 'Usuario'),
          'email', pr.email,
          'phone', COALESCE(pr.phone, ''),
          'currentStatus', COALESCE(ul.current_status, 'ingresado'),
          'updatedAt', ul.updated_at,
          'userListingId', ul.id,
          'statusLogs', COALESCE((
            SELECT json_agg(json_build_object(
              'new_status', shl.new_status,
              'event_metadata', shl.event_metadata,
              'created_at', shl.created_at
            ) ORDER BY shl.created_at ASC)
            FROM status_history_log shl
            WHERE shl.user_listing_id = ul.id
          ), '[]'::json)
        ))
        FROM user_listings ul
        LEFT JOIN profiles pr ON pr.user_id = ul.added_by
        WHERE ul.source_publication_id = ap.id
      ), '[]'::json)
    ) AS pub_data
    FROM agent_publications ap
    LEFT JOIN properties p ON p.id = ap.property_id
    WHERE ap.org_id = _org_id
      AND ap.status != 'eliminado'
  ) sub;
  
  RETURN result;
END;
$$;
```

**Hook modificado:**

```typescript
// useAgentPropertyInsights.ts — queryFn nuevo (simplificado)
queryFn: async (): Promise<AgentPropertyInsight[]> => {
  if (!agencyOrgId) return [];
  
  const { data, error } = await supabase.rpc("get_agent_insights", {
    _org_id: agencyOrgId,
  });
  if (error) throw error;
  
  // Mapear el resultado de la RPC al tipo AgentPropertyInsight
  return (data || []).map((pub: any) => ({
    publicationId: pub.publicationId,
    propertyId: pub.propertyId,
    title: pub.title,
    neighborhood: pub.neighborhood,
    ref: pub.ref || undefined,
    usersSaved: pub.users.length,
    // ... calcular promedios y status breakdown del JSON
    users: pub.users.map((u: any) => buildUserInsight(u)),
  }));
},
```

**Impacto:** 4 queries → 1 RPC. **-3 REST requests por mount del dashboard de agente.**

---

### 3C. `useMarketplaceProperties` — De 3 queries a 1-2

**Estado actual (3 queries por página):**

```typescript
// useMarketplaceProperties.ts — queryFn actual
// Query 1: SELECT principal con JOINs
const { data } = await supabase
  .from("agent_publications")
  .select(`id, property_id, ..., properties(...), organizations(name, created_by)`)
  ...

// Query 2 (condicional): nombres de org faltantes
const { data: orgNames } = await supabase.rpc("get_marketplace_org_names", { _org_ids: missingOrgIds });

// Query 3: perfiles de publishers
const { data: publishers } = await supabase
  .from("profiles")
  .select("user_id, display_name, phone, email")
  .in("user_id", publisherIds);
```

**Solución propuesta:** Crear RPC que haga todo en 1 query con JOINs:

```sql
-- Migración: supabase/migrations/YYYYMMDDHHMMSS_rpc_get_marketplace_page.sql
CREATE OR REPLACE FUNCTION get_marketplace_page(
  _cursor TIMESTAMPTZ DEFAULT NULL,
  _page_size INT DEFAULT 50
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(row_data)
    FROM (
      SELECT json_build_object(
        'id', ap.id,
        'property_id', ap.property_id,
        'org_id', ap.org_id,
        'published_by', ap.published_by,
        'status', ap.status,
        'listing_type', ap.listing_type,
        'description', ap.description,
        'created_at', ap.created_at,
        'updated_at', ap.updated_at,
        'orgName', COALESCE(o.name, 'Organización'),
        'orgCreatedBy', o.created_by,
        'title', COALESCE(p.title, ''),
        'source_url', COALESCE(p.source_url, ''),
        'price_amount', COALESCE(p.price_amount, 0),
        'price_expenses', COALESCE(p.price_expenses, 0),
        'total_cost', COALESCE(p.total_cost, 0),
        'currency', COALESCE(p.currency, 'USD'),
        'neighborhood', COALESCE(p.neighborhood, ''),
        'city', COALESCE(p.city, ''),
        'm2_total', COALESCE(p.m2_total, 0),
        'rooms', COALESCE(p.rooms, 0),
        'images', COALESCE(p.images, '[]'::jsonb),
        'ref', p.ref,
        'publisherName', COALESCE(pr.display_name, pr.email, 'Agente'),
        'publisherPhone', pr.phone
      ) AS row_data
      FROM agent_publications ap
      LEFT JOIN properties p ON p.id = ap.property_id
      LEFT JOIN organizations o ON o.id = ap.org_id
      LEFT JOIN profiles pr ON pr.user_id = ap.published_by
      WHERE ap.status != 'eliminado'
        AND (_cursor IS NULL OR ap.created_at < _cursor)
      ORDER BY ap.created_at DESC
      LIMIT _page_size
    ) sub
  ), '[]'::json);
END;
$$;
```

**Impacto:** 3 queries → 1 RPC. **-2 REST requests por página cargada.**

---

## 🔮 Solución 4 — Filtro Realtime por Usuario

**Estado actual** en `usePropertyQueries.ts` (L210-226):

```typescript
// AHORA: escucha cambios de TODOS los usuarios en TODAS las tablas
const channelListings = supabase
  .channel("properties_realtime_listings")
  .on("postgres_changes", { event: "*", schema: "public", table: "user_listings" }, handleRealtimeEvent)
  .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, handleRealtimeEvent)
  .on("postgres_changes", { event: "*", schema: "public", table: "user_listing_attachments" }, handleRealtimeEvent)
  .subscribe();
```

**Código propuesto:**

```typescript
// DESPUÉS: escucha solo cambios del usuario actual
const channelListings = supabase
  .channel("properties_realtime_listings")
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "user_listings",
    filter: `added_by=eq.${currentUserId}`,  // ← Solo mis cambios
  }, handleRealtimeEvent)
  .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, handleRealtimeEvent)
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "user_listing_attachments",
    // No se puede filtrar fácilmente aquí — dejar sin filtro
  }, handleRealtimeEvent)
  .subscribe();
```

> ⚠️ **Nota:** La tabla `properties` no tiene columna `added_by` directa, así que no se puede filtrar. Solo `user_listings` tiene el filtro directo. `user_listing_attachments` podría filtrarse si tiene `user_listing_id` pero requiere sub-query (no soportado por Realtime).

**Impacto:** Con 10 usuarios, cada usuario recibiría ~90% menos eventos Realtime → **-10% REST requests** (por menos invalidaciones de caché).

---

## 📊 Impacto combinado esperado

| Solución | REST eliminadas/hora/usuario | Reducción |
|----------|------------------------------|-----------|
| 3A. RPC useGroups | -2/mount × ~5 mounts/hora = -10 | ~5% |
| 3B. RPC useAgentInsights | -3/mount × ~2 mounts/hora = -6 | ~3% |
| 3C. RPC marketplace | -2/página × ~3 cargas/hora = -6 | ~3% |
| 4. Filtro Realtime | -~35 invalidaciones/hora | ~10% |
| **TOTAL** | | **~20-25%** |

**Acumulado con Soluciones 1+2:** -50-60% + 20-25% = **~70-80% reducción total**

---

## 🤖 Prompt para Lovable

```
## Contexto
Estoy optimizando las requests REST a Supabase en mi app React (homefinder4). 
Actualmente tengo hooks que hacen múltiples queries REST secuenciales dentro de 
un solo queryFn de TanStack Query. Quiero consolidarlas en funciones PostgreSQL (RPCs).

La app usa: React, TypeScript, TanStack Query, Supabase (auth, REST, Realtime, Storage).

## Tarea 1: Crear RPC `get_user_groups` y migrar `useGroups.ts`

### SQL a crear:
Crear una función PostgreSQL `get_user_groups()` que:
1. Use `auth.uid()` para obtener el userId (SECURITY DEFINER)
2. Haga JOIN entre `organization_members` y `organizations`
3. Filtre `is_personal = false`
4. Retorne JSON con 2 campos:
   - `groups`: array de orgs donde `type != 'agency_team'`
   - `agencyOrg`: primera org donde `type = 'agency_team'` (o null)
5. Cada org debe tener: id, name, description, created_by, invite_code, created_at, type

### Hook a modificar: `src/hooks/useGroups.ts`
- En el `queryFn` de la query principal (actualmente hace 3 queries encadenadas a `organization_members` → `organizations`)
- Reemplazar las 3 queries por `supabase.rpc("get_user_groups")`
- Mapear el resultado JSON a los tipos `Group[]` y `Group | null`
- Mantener las mutations (createGroup, joinGroup, etc.) sin cambios
- Mantener el invalidateQueries en el onSuccess de cada mutation

## Tarea 2: Crear RPC `get_agent_insights` y simplificar `useAgentPropertyInsights.ts`

### SQL a crear:
Crear una función PostgreSQL `get_agent_insights(_org_id UUID)` que:
1. Reciba el org_id como parámetro
2. Haga JOINs entre: `agent_publications` + `properties` + `user_listings` + `profiles` + `status_history_log`
3. Filtre `agent_publications.status != 'eliminado'` y `agent_publications.org_id = _org_id`
4. Para cada publicación, retorne:
   - publicationId, propertyId, title, neighborhood, ref
   - Array de users con: userId, displayName, email (para masking en frontend), phone, currentStatus, updatedAt, userListingId
   - Para cada user: array de statusLogs con new_status, event_metadata (JSON), created_at
5. Retorne JSON array

### Hook a modificar: `src/hooks/useAgentPropertyInsights.ts`
- Reemplazar las 4 queries secuenciales por 1 llamada a `supabase.rpc("get_agent_insights", { _org_id: agencyOrgId })`
- Mantener toda la lógica de cálculo de ratings (contactado, visita_coordinada, etc.) en el frontend
- Mantener el email masking en el frontend
- Mantener `staleTime: 60_000` existente

## Tarea 3: Crear RPC `get_marketplace_page` y simplificar `useMarketplaceProperties.ts`

### SQL a crear:
Crear una función PostgreSQL `get_marketplace_page(_cursor TIMESTAMPTZ DEFAULT NULL, _page_size INT DEFAULT 50)` que:
1. Haga JOINs entre: `agent_publications` + `properties` + `organizations` + `profiles`
2. Filtre `status != 'eliminado'`
3. Soporte paginación cursor-based: `WHERE (_cursor IS NULL OR created_at < _cursor)`
4. Para cada publicación retorne: id, property_id, org_id, orgName, publisherName, publisherPhone, 
   y todos los campos de properties necesarios (title, source_url, prices, neighborhood, city, rooms, images, etc.)
5. ORDER BY created_at DESC, LIMIT _page_size

### Hook a modificar: `src/hooks/useMarketplaceProperties.ts`
- Reemplazar las 3 queries (main + org_names + profiles) por 1 llamada a `supabase.rpc("get_marketplace_page", { _cursor: pageParam, _page_size: PAGE_SIZE })`
- Mantener paginación infinita (useInfiniteQuery)
- Mantener el mapping a `MarketplaceProperty` type
- Mantener `resolveImages()` para las imágenes

## Tarea 4: Filtrar Realtime por usuario en `usePropertyQueries.ts`

En el archivo `src/hooks/usePropertyQueries.ts`, en el useEffect que configura los canales Realtime:
- Agregar `filter: \`added_by=eq.${currentUserId}\`` al canal de `user_listings`
- Dejar `properties` y `user_listing_attachments` sin filtro (no tienen columna directa de usuario)

## Reglas importantes:
1. NO modificar otros archivos además de los mencionados
2. Mantener todos los tipos TypeScript existentes
3. Las RPCs deben usar SECURITY DEFINER
4. Agregar comentarios explicando qué hace cada función
5. Si encontrás algún error en otro lugar, NO lo corrijas — avisame primero
```
