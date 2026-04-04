

# Plan: Optimización de useAgentPropertyInsights con RPC + Paginación

## Resumen

Migrar las 4 consultas secuenciales del hook a una sola RPC en Postgres con paginación por propiedad, índices compuestos, y suscripción Realtime para invalidación de caché.

## Paso 1 — Migración: Índices compuestos

Archivo: `supabase/migrations/20260404000000_add_agent_insights_indexes.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_status_history_listing_lookup 
  ON status_history_log(user_listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_pubs_org_filter 
  ON agent_publications(org_id, status);

CREATE INDEX IF NOT EXISTS idx_user_listings_source_lookup 
  ON user_listings(source_publication_id);
```

## Paso 2 — Migración: RPC `get_agent_property_insights`

Archivo: `supabase/migrations/20260404000001_create_get_agent_property_insights.sql`

Correcciones aplicadas vs. el documento original:
- **JOIN corregido**: `ul.source_publication_id = ap.id` (no `ap.property_id`)
- **Paginación por propiedad**: Se pagina sobre `agent_publications` con LIMIT/OFFSET, luego se traen TODOS los users de esas propiedades paginadas
- **Sin JOIN redundante** a `agent_publications` en el SELECT final
- `SECURITY INVOKER` para respetar RLS
- `DISTINCT ON (user_listing_id, new_status)` para último feedback por etapa

Estructura de CTEs:
1. `paginated_pubs` — publicaciones del org paginadas
2. `listings` — user_listings de esas publicaciones
3. `latest_logs` — último log por listing+status con DISTINCT ON
4. `ratings_agg` — `jsonb_object_agg` de ratings por listing
5. `status_counts_agg` — conteo de estados por publicación
6. Query final con JOINs a `properties`, `profiles`

Columnas retornadas: `publication_id, property_id, property_title, property_ref, property_neighborhood, property_price, property_currency, property_rooms, listing_type, pub_status, pub_created_at, user_listing_id, user_id, user_display_name, user_email, user_phone, current_status, user_updated_at, org_id, status_counts (jsonb), ratings_by_status (jsonb)`

## Paso 3 — Migración: RPC `get_user_status_history`

Archivo: mismo migration o separado.

RPC simple para carga on-demand del historial completo de un user_listing:
```sql
CREATE FUNCTION get_user_status_history(p_user_listing_id uuid)
RETURNS TABLE(new_status text, event_metadata jsonb, changed_by uuid, created_at timestamptz)
```
`SECURITY INVOKER`, `STABLE`. Sin paginación (es un solo listing).

## Paso 4 — Frontend: Refactorizar `useAgentPropertyInsights.ts`

- Reemplazar las 4 queries por `supabase.rpc('get_agent_property_insights', { p_org_id, p_limit: 30, p_offset: 0 })`
- Usar `useInfiniteQuery` con `getNextPageParam` basado en offset
- Mantener la misma interfaz `AgentPropertyInsight[]` y `AgentUserInsight[]`
- **match_score** se calcula en `useMemo` solo para los items de la página actual, usando `useGeography` (extendido con `staleTime: Infinity`) para el mapa de neighborhoods
- **property_reviews** y **search_profiles** se fetchean en paralelo con `Promise.all` solo para los IDs de la página
- `staleTime: 5 * 60 * 1000` como fallback

## Paso 5 — Frontend: Extender `useGeography.ts`

- Cambiar `staleTime` de 1 hora a `Infinity` (datos casi estáticos)
- Exportar un mapa `Record<string, string>` de neighborhoods para evitar crear un hook nuevo (Regla 5)

## Paso 6 — Frontend: Paginación en `AgentPropertyListing.tsx`

- Botón "Cargar más" al final de `AgentPropertyCards` que llama `fetchNextPage()`
- Mostrar indicador de carga mientras se obtienen más propiedades

## Paso 7 — Frontend: Historial on-demand en `AgentPropertyUsersPanel.tsx`

- Al hacer click en un usuario, fetchear `get_user_status_history(user_listing_id)` para obtener el historial COMPLETO
- Mostrar los logs cronológicamente en el panel lateral (actualmente solo muestra ratings del último log por status — eso se mantiene igual del RPC principal)

## Paso 8 — Realtime: Suscripción e invalidación

- En `AgentPropertyListing.tsx`, suscribirse al canal `status_history_log` con filtro `postgres_changes` INSERT
- Al recibir evento, `queryClient.invalidateQueries(['agent-property-insights'])`
- Eliminar el polling de 5 min (se mantiene `staleTime` como fallback pero sin refetch automático)

## Archivos a modificar/crear

| Archivo | Acción |
|---------|--------|
| `supabase/migrations/20260404000000_*.sql` | Crear (índices) |
| `supabase/migrations/20260404000001_*.sql` | Crear (RPC insights + history) |
| `src/hooks/useAgentPropertyInsights.ts` | Refactorizar (RPC + useInfiniteQuery) |
| `src/hooks/useGeography.ts` | Modificar (staleTime: Infinity) |
| `src/components/agent/AgentPropertyListing.tsx` | Modificar (paginación + realtime) |
| `src/components/agent/property-listing/AgentPropertyUsersPanel.tsx` | Modificar (historial on-demand) |
| `src/components/agent/property-listing/agentPropertyListingTypes.ts` | Modificar (tipos para RPC) |
| `src/components/agent/property-listing/useAgentPropertyListingController.ts` | Ajustar (soporte paginación) |

## Resultado esperado

| Métrica | Antes | Después |
|---------|-------|---------|
| Consultas por mount | 4 secuenciales + 2 paralelas | 1 RPC + 2 paralelas (reviews/search profiles paginados) |
| Filas transferidas | ~50.000 potenciales | ~30 propiedades + sus users |
| Latencia | 3-8s | <400ms |
| Refetch | Cada 5 min | Solo por Realtime |

## Restricciones respetadas

- Interfaz pública del hook se mantiene (Regla 1 y 3)
- `SECURITY INVOKER` respeta RLS
- No se crea `useNeighborhoods.ts` — se extiende `useGeography.ts` (Regla 5)
- match_score en cliente con `useMemo` (evita cross-join en BD)

