# 🔵 Informe: REST Requests Excesivas en Supabase

**Proyecto:** homefinder4  
**Fecha:** 2026-03-26  
**Métrica observada:** ~3,689 REST Requests en 24h con 10 usuarios  
**Contexto:** Supabase Free Tier (0.5 GB RAM, límite API requests)

---

## Resumen Ejecutivo

Se encontraron **18 hooks** que generan queries REST a Supabase. El problema principal no es la cantidad de hooks, sino que:

1. **14 de 18 hooks NO definen `staleTime`** → el default de TanStack Query es 0 → refetch en cada mount y window focus
2. **Solo 1 hook desactiva `refetchOnWindowFocus`** → cada vez que el usuario vuelve a la pestaña, se disparan ~10 queries REST
3. **Realtime invalida queries sin granularidad** → cualquier cambio en `user_listings` refetchea TODAS las propiedades del usuario
4. **Queries encadenadas** → hooks como `useAgentPropertyInsights` ejecutan 4 queries REST en secuencia por cada mount

---

## 🔍 Mapa de Hooks REST

### A. Hooks SIN `staleTime` (default 0 — refetch en cada mount)

| Hook | Queries/mount | Tablas/RPCs consultadas | Consume en |
|------|--------------|------------------------|------------|
| [useGroups](file:///e:/github/remhomefinder/src/hooks/useGroups.ts) | **3** encadenadas | `organization_members` → `organizations` → filter | Index, GroupsModal, AgentDashboard |
| [usePropertyMatches](file:///e:/github/remhomefinder/src/hooks/usePropertyMatches.ts) | **2** | `user_search_profiles` → `rpc(get_search_profile_contacts)` | PublishPropertyModal |
| [useAdminPropertyMatches](file:///e:/github/remhomefinder/src/hooks/usePropertyMatches.ts) | **2** | `user_search_profiles` → `rpc(get_search_profile_contacts)` | Admin |
| [useMarketplaceProperties](file:///e:/github/remhomefinder/src/hooks/useMarketplaceProperties.ts) | **3** por página | `agent_publications+properties+organizations` → `rpc(get_marketplace_org_names)` → `profiles` | Index, MarketplaceView |
| [useOrgSharedProperties](file:///e:/github/remhomefinder/src/hooks/useOrgSharedProperties.ts) | **2** | `agent_publications+properties+organizations` → `profiles` | AgentDashboard |
| [usePropertyQueries](file:///e:/github/remhomefinder/src/hooks/usePropertyQueries.ts) | **1** (RPC) | `rpc(get_user_listings_page)` | Index |
| [usePropertyRating](file:///e:/github/remhomefinder/src/hooks/usePropertyRating.ts) | **1** | `user_listing_votes` | PropertyDetailModal |
| [useSubscription](file:///e:/github/remhomefinder/src/hooks/useSubscription.ts) | **1** | `profiles` (solo plan_type) | Index, PublishModal |
| [useReferralCountForUser](file:///e:/github/remhomefinder/src/hooks/useReferralQueries.ts) | **1** (RPC) | `rpc(count_profiles_referred_by)` | Index |
| [useReferrerDisplayName](file:///e:/github/remhomefinder/src/hooks/useReferralQueries.ts) | **1** (RPC) | `rpc(get_my_referrer_display_name)` | Index |
| [useFeedbackAttributes](file:///e:/github/remhomefinder/src/hooks/useFeedbackAttributes.ts) | **1** | `feedback_attributes` | PropertyCard (modal estado) |
| [usePropertyMatches (admin)](file:///e:/github/remhomefinder/src/hooks/usePropertyMatches.ts) | **2** | `user_search_profiles` → `rpc(get_search_profile_contacts)` | AdminPublicaciones |

### B. Hooks CON `staleTime` configurado ✅

| Hook | staleTime | Queries/mount | Tablas |
|------|-----------|---------------|--------|
| [useProfile](file:///e:/github/remhomefinder/src/hooks/useProfile.ts) | **5 min** ✅ | 1 | `profiles` |
| [useSystemConfig](file:///e:/github/remhomefinder/src/hooks/useSystemConfig.ts) | **5 min** ✅ + `refetchOnWindowFocus: false` | 1 | `system_config` |
| [useAgentPropertyInsights](file:///e:/github/remhomefinder/src/hooks/useAgentPropertyInsights.ts) | **1 min** ✅ | **4** secuenciales | `agent_publications` → `user_listings` → `profiles` → `status_history_log` |
| [AdminUsuarios](file:///e:/github/remhomefinder/src/components/admin/AdminUsuarios.tsx) | Personalizado | ~2 | `profiles` + `user_roles` |

---

## 📊 Estimación de REST Requests por Sesión

### Escenario: 1 usuario, 1 hora de navegación activa

#### Carga inicial del dashboard (1 mount):

| Hook | REST requests | Subtotal |
|------|--------------|----------|
| usePropertyQueries (RPC) | 1 | 1 |
| useProfile | 1 | 1 |
| useSubscription | 1 | 1 |
| useGroups (3 encadenadas) | 3 | 3 |
| useMarketplaceProperties (3) | 3 | 3 |
| useReferralCountForUser | 1 | 1 |
| useReferrerDisplayName | 1 | 1 |
| useSystemConfig (×3 keys) | 3 | 3 |
| **TOTAL carga inicial** | | **14** |

#### Window focus (cada vez que el usuario vuelve a la pestaña):
- **13 de los 14** hooks refetchean (solo `useSystemConfig` tiene `refetchOnWindowFocus: false`)
- Estimado: **5-10 focus events/hora** → **65-130 REST requests/hora**

> [!CAUTION]
> **Window focus** es el multiplicador principal. Si un usuario alterna entre la app y WhatsApp/email, cada cambio de pestaña dispara ~13 REST requests.

#### Navegación interna (cambio de tab, abrir modales):
- Abrir PropertyDetailModal: +2 REST (rating + feedback_attributes)
- Abrir GroupsModal: +4 REST (getUser + groups queries)  
- Abrir PublishPropertyModal: +2 REST (matches)
- Cambiar estado de propiedad: +3 REST (mutation + refetch properties + refetch ratings)
- Estimado: **~5-10 interacciones/hora** → **15-40 REST requests/hora**

#### Realtime invalidation:
- 3 canales Realtime escuchan: `user_listings`, `properties`, `user_listing_attachments`, `family_comments`
- Cada evento invalida `["properties", userId]` → refetch completo
- Con 10 usuarios haciendo cambios: **~20-50 events/hora** → **20-50 REST requests/hora/usuario**

#### Total estimado por usuario/hora:

| Fuente | REST/hora |
|--------|-----------|
| Carga inicial | 14 |
| Window focus (×7) | 91 |
| Navegación interna | 25 |
| Realtime invalidation | 35 |
| **TOTAL** | **~165** |

**10 usuarios × 4 horas = ~6,600 REST requests** (consistente con las ~3,689 observadas si algunos usuarios son menos activos)

---

## 🎯 Los 3 Problemas Principales

### Problema 1: `staleTime: 0` Generalizado

**14 de 18 hooks** usan el default `staleTime: 0`, lo que significa:
- Cada mount = fetch al servidor, aunque los datos no hayan cambiado
- Cada window focus = refetch automático de TODOS los datos

**Hooks más afectados** (datos que cambian muy rara vez):

| Hook | Frecuencia real de cambio | staleTime recomendado |
|------|--------------------------|----------------------|
| `useFeedbackAttributes` | Casi nunca (config admin) | **30 min** |
| `useGroups` | Rara vez | **5 min** |
| `useReferralCountForUser` | Rara vez | **10 min** |
| `useReferrerDisplayName` | Nunca cambia | **∞ (Infinity)** |
| `usePropertyMatches` | Cuando el admin cambia perfiles | **5 min** |
| `useMarketplaceProperties` | Cuando un agente publica | **2 min** |
| `useSubscription` | Cuando el admin cambia plan | **10 min** |
| `useOrgSharedProperties` | Cuando agente publica | **2 min** |
| `usePropertyRating` | Cuando alguien vota | **1 min** |

### Problema 2: Queries Encadenadas sin necesidad

Varios hooks hacen múltiples queries REST dentro de un solo `queryFn`:

| Hook | Queries encadenadas | Problema |
|------|-------------------|----------|
| `useAgentPropertyInsights` | 4 secuenciales | Podrían consolidarse en 1 RPC |
| `useGroups` | 3 secuenciales | Podrían consolidarse en 1 RPC |
| `useMarketplaceProperties` | 3 (main + org_names + profiles) | Las sub-queries podrían ser JOINs |
| `useOrgSharedProperties` | 2 (publications + profiles) | Similar a marketplace |
| `usePropertyMatches` | 2 (profiles + contacts) | Podrían consolidarse |

> [!WARNING]
> `useAgentPropertyInsights` es el peor caso: **4 queries secuenciales** (agent_publications → user_listings → profiles → status_history_log). Esto podría ser **1 sola RPC** del servidor.

### Problema 3: Realtime Invalida Todo

Los 3 canales Realtime escuchan **ALL events** (`event: "*"`) en tablas completas sin filtro:

```typescript
// usePropertyQueries.ts L213
.on("postgres_changes", { event: "*", schema: "public", table: "user_listings" }, handleRealtimeEvent)
.on("postgres_changes", { event: "*", schema: "public", table: "properties" }, handleRealtimeEvent)
```

Esto significa:
- Si el **usuario A** cambia un estado → el canal de **TODOS los usuarios** recibe el evento
- El handler invalida `["properties", currentUserId]` → refetch completo
- Con 10 usuarios, cada cambio genera hasta **10 refetches innecesarios**

El debounce de 800ms ayuda pero no filtra por usuario.

---

## 💡 Soluciones Recomendadas (sin hacer cambios)

### Quick Win 1: Agregar `staleTime` a todos los hooks (30 min, 0 riesgo)

Un cambio mecánico en 14 archivos. Ejemplo:

```diff
 const { data } = useQuery({
   queryKey: ["groups"],
+  staleTime: 5 * 60 * 1000, // 5 min
   queryFn: async () => { ... }
 });
```

**Impacto estimado:** -50-60% REST requests (elimina refetches por mount/focus)

### Quick Win 2: `refetchOnWindowFocus: false` global

Configurar en el QueryClient:

```diff
 const queryClient = new QueryClient({
+  defaultOptions: {
+    queries: {
+      staleTime: 2 * 60 * 1000,     // 2 min global
+      refetchOnWindowFocus: false,    // No refetch automático en window focus
+    },
+  },
 });
```

**Impacto estimado:** -30% REST requests (elimina los ~91 requests/hora por window focus)

> [!TIP]
> **Quick Win 2 es el cambio más impactante** porque es 1 sola línea que afecta TODOS los hooks de golpe.

### Medio plazo: Consolidar queries encadenadas en RPCs

| Hook | Acción | De → A |
|------|--------|--------|
| `useGroups` | Crear RPC `get_user_groups()` | 3 queries → 1 |
| `useAgentPropertyInsights` | Crear RPC `get_agent_insights()` | 4 queries → 1 |
| `useMarketplaceProperties` | JOINs en la query principal | 3 queries → 1-2 |

**Impacto estimado:** -20% REST requests

### Largo plazo: Filtrar Realtime por usuario

```diff
 .on("postgres_changes", {
   event: "*",
   schema: "public",
   table: "user_listings",
+  filter: `added_by=eq.${currentUserId}`,
 }, handleRealtimeEvent)
```

**Impacto estimado:** -10% REST requests (evita refetches por cambios de otros usuarios)

---

## 📋 Resumen de impacto acumulado

| Solución | Esfuerzo | Reducción | Acumulado |
|----------|----------|-----------|-----------|
| Quick Win 2 (QueryClient defaults) | 5 min, 1 archivo | 30% | 30% |
| Quick Win 1 (staleTime por hook) | 30 min, 14 archivos | 30% | 50% |
| RPCs consolidadas | 3-4 horas, server + hooks | 20% | 60% |
| Filtro Realtime | 30 min, 1 archivo | 10% | 65% |
| **TOTAL** | | | **~65%** |

> [!IMPORTANT]
> Combinado con la optimización de Auth Requests (Nivel 1+2 ya implementado + Nivel 3 pendiente), la reducción total sería de **~80% de TODAS las requests a Supabase**.
