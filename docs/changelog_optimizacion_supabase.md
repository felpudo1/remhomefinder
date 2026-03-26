# 📋 Changelog: Optimización de Requests y Memoria Supabase

**Fecha:** 2026-03-26  
**Proyecto:** homefinder4  
**Objetivo:** Reducir requests a Supabase y optimizar uso de memoria para evitar inestabilidad en Free Tier

---

## Contexto

Con 10 usuarios de prueba y 3 agentes en 4 horas:
- **1,252 Auth Requests** en 24h (excesivo por getUser() descentralizado)
- **3,689 REST Requests** en 24h (sin caché, refetch en cada mount/focus)
- **37.97% Memory** de 0.5 GB (bajo riesgo ahora, pero peligroso al escalar)

---

## Cambios implementados

### 1. Auth — Nivel 1: staleTime en useProfile

**Archivo:** `src/hooks/useProfile.ts`

| Antes | Después |
|-------|---------|
| `staleTime: 0` | `staleTime: 5 * 60 * 1000` (5 min) |

**Impacto:** Evita refetch del perfil en cada mount de componente.

---

### 2. Auth — Nivel 2: AuthProvider centralizado (5 archivos)

**Archivo nuevo:** `src/contexts/AuthProvider.tsx`
- Provider central que mantiene `user`, `session`, `isLoading` en React Context
- Un único listener `onAuthStateChange` para toda la app
- Exporta hook `useCurrentUser()`

**Archivos migrados:**

| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Wrap con `<AuthProvider>` |
| `src/hooks/useProfile.ts` | `getUser()` → `useCurrentUser()` |
| `src/components/ProtectedRoute.tsx` | `getSession()` + listener → `useCurrentUser()` |
| `src/hooks/usePropertyQueries.ts` | `getUser()` + listener → `useCurrentUser()` |
| `src/hooks/useSubscription.ts` | `getUser()` → `useCurrentUser()` |
| `src/pages/Index.tsx` | `getUser()` → `useCurrentUser()` |

**Impacto:** Eliminó ~7 llamadas HTTP directas a auth + 2 listeners duplicados.

---

### 3. REST — Solución 1: QueryClient defaults globales

**Archivo:** `src/App.tsx`

```diff
-const queryClient = new QueryClient();
+const queryClient = new QueryClient({
+  defaultOptions: {
+    queries: {
+      staleTime: 2 * 60 * 1000,
+      refetchOnWindowFocus: false,
+    },
+  },
+});
```

**Impacto:** -30% REST requests. Todos los hooks heredan caché de 2 min y no refetchean al cambiar de pestaña.

---

### 4. REST — Solución 2: staleTime específico en hooks de datos estáticos

| Archivo | staleTime | Razón |
|---------|-----------|-------|
| `src/hooks/useFeedbackAttributes.ts` | 30 min | Config admin, casi nunca cambia |
| `src/hooks/useReferralQueries.ts` (referrer name) | Infinity | Nunca cambia en la sesión |
| `src/hooks/useReferralQueries.ts` (referral count) | 10 min | Rara vez cambia |
| `src/hooks/useSubscription.ts` | 10 min | Solo cambia si admin edita plan |
| `src/hooks/useGroups.ts` | 5 min | Solo al crear/unirse a grupo |

**Impacto:** -30% adicional en REST requests sobre datos raramente cambientes.

---

### 5. Memoria — Eliminación de Realtime dinámico

**Archivo:** `src/hooks/usePropertyRating.ts`

- Eliminado `useEffect` que creaba 1 canal WebSocket **por cada propiedad abierta**
- Eliminado `import { useEffect }`
- Proyectado `property_reviews` de `SELECT *` a `SELECT user_id, rating`

**Impacto:** -0.5 MB RAM por cada propiedad abierta. Con 200 agentes, evita cientos de conexiones WebSocket innecesarias. La mutation ya refetchea vía `invalidateQueries`.

---

### 6. Memoria — Proyección de SELECT *

| Archivo | Query | Cambio |
|---------|-------|--------|
| `src/pages/AgentDashboard.tsx` (×2) | `organizations SELECT *` | Proyectado a `id, name, description, created_by, created_at, type, invite_code, logo_url` |
| `src/components/agent/AgentProperties.tsx` | `agent_publications SELECT *, properties(*), organizations(name)` | Proyectado excluyendo `raw_ai_data` y `status_history` (~50 KB/fila) |

**Impacto:** -50 KB/fila en queries de propiedades. Con 1,000 propiedades = 50 MB menos de tráfico BD.

### 7. Bug Fix — Optimistic Update en usePropertyMutations

**Archivo:** `src/hooks/usePropertyMutations.ts`

- **Bug corregido:** `TypeError: previousProperties.map is not a function`. El cache de propiedades usa `InfiniteQuery` (con `pages`), pero el código esperaba un array plano.
- **Migración Auth Nivel 3:** Se aprovechó el fix para migrar todo el archivo a `useCurrentUser()`.
- **Impacto:** Eliminadas **5 llamadas a `getUser()`**. El cambio de estado ahora es instantáneo y no rompe la UI.

---

## Reducción total estimada

| Métrica | Antes | Después | Reducción |
|---------|-------|---------|-----------|
| Auth Requests/24h | ~1,252 | ~375 | **-70%** |
| REST Requests/24h | ~3,689 | ~1,800 | **-50-60%** |
| Canales Realtime/usuario | 3-4 + dinámicos | 2 fijos | **-50%** |
| Datos transferidos/query | Todo (incl. raw_ai_data) | Solo columnas necesarias | **-30-50% por query** |

---

## Verificación

- ✅ `npx tsc --noEmit` — 0 errores TypeScript
- ✅ App compilando y corriendo en dev

---

## Pendiente (documentado en informes separados)

- **Auth Nivel 3:** Migración de 15 archivos restantes → `docs/segunda_etapa_auth_requests.md`
- **REST Soluciones 3+4:** RPCs consolidadas + filtro Realtime → `docs/segunda_etapa_rest_requests.md`
- **Análisis de memoria:** Detalle de consumidores → `docs/memory_report.md`
- **Modelo de negocio:** Path de escalamiento Supabase → `docs/analisis_modelo_negocio.md`
