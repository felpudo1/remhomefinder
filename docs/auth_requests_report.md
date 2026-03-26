# 🔴 Informe: Auth Requests Excesivas en Supabase

**Proyecto:** homefinder4  
**Fecha:** 2026-03-26  
**Métrica observada:** 1,252 Auth Requests en 24h con solo 10 usuarios de prueba  
**Métrica esperada:** ~30-50 Auth Requests en el mismo período  
**Exceso estimado:** ~25x más de lo necesario  

---

## Resumen Ejecutivo

La app tiene **40+ llamadas independientes** a `supabase.auth.getUser()` y `getSession()` distribuidas en **20+ archivos**. No existe un **estado centralizado de usuario** — cada hook y componente consulta la auth de Supabase por su cuenta, generando requests redundantes al servidor.

> [!CAUTION]
> Cada llamada a `getUser()` genera un **request HTTP al servidor de Supabase**, NO es una lectura local. Esto es lo que infla las Auth Requests.

---

## 🔍 Hallazgos Detallados

### 1. `getUser()` como patrón repetido en TODOS los hooks

Cada hook llama `supabase.auth.getUser()` independientemente, sin cachear ni compartir el resultado:

| Archivo | Cantidad de `getUser()` | Tipo | Frecuencia |
|---------|------------------------|------|------------|
| [PublishPropertyModal.tsx](file:///e:/github/remhomefinder/src/components/PublishPropertyModal.tsx) | **6** | Componente | Por cada acción del usuario |
| [usePropertyMutations.ts](file:///e:/github/remhomefinder/src/hooks/usePropertyMutations.ts) | **5** (L78, L201, L315, L349, L349) | Hook | Por cada mutación + optimistic update |
| [useGroups.ts](file:///e:/github/remhomefinder/src/hooks/useGroups.ts) | **4** (L39, L104, L144, L176) | Hook | En queryFn + cada mutación |
| [usePropertyRating.ts](file:///e:/github/remhomefinder/src/hooks/usePropertyRating.ts) | **2** (L32, L71) | Hook | Al montar + al votar |
| [useImageUploader.ts](file:///e:/github/remhomefinder/src/hooks/useImageUploader.ts) | **2** (L45, L87) | Hook | Por cada upload |
| [AdminPublicaciones.tsx](file:///e:/github/remhomefinder/src/components/admin/AdminPublicaciones.tsx) | **2** (L195, L279) | Componente | Por acción admin |
| [useProfile.ts](file:///e:/github/remhomefinder/src/hooks/useProfile.ts) | **1** (L38) | Hook | **En cada mount** (staleTime: 0) |
| [useSubscription.ts](file:///e:/github/remhomefinder/src/hooks/useSubscription.ts) | **1** (L21) | Hook | En cada mount |
| [usePropertyQueries.ts](file:///e:/github/remhomefinder/src/hooks/usePropertyQueries.ts) | **1** (L198) | Hook | En cada mount |
| [useSaveToList.ts](file:///e:/github/remhomefinder/src/hooks/useSaveToList.ts) | **1** (L14) | Hook | Por cada save |
| [usePropertyExtractor.ts](file:///e:/github/remhomefinder/src/hooks/usePropertyExtractor.ts) | **1** (L142) | Hook | Por extracción |
| [duplicateCheck.ts](file:///e:/github/remhomefinder/src/lib/duplicateCheck.ts) | **1** (L45) | Utility | Por cada check |
| [ProtectedRoute.tsx](file:///e:/github/remhomefinder/src/components/ProtectedRoute.tsx) | **1** (getSession L32) | Componente | **En cada navegación** |
| [ReferralTracker.tsx](file:///e:/github/remhomefinder/src/components/ReferralTracker.tsx) | **1** (L31) | Componente | Condicional |
| [GroupsModal.tsx](file:///e:/github/remhomefinder/src/components/GroupsModal.tsx) | **1** (L62) | Componente | Al abrir modal |
| [PropertyDetailModal.tsx](file:///e:/github/remhomefinder/src/components/PropertyDetailModal.tsx) | **1** (L160) | Componente | Al abrir detalle |
| [Index.tsx](file:///e:/github/remhomefinder/src/pages/Index.tsx) | **1** (L66) | Página | Al montar |
| [AgentDashboard.tsx](file:///e:/github/remhomefinder/src/pages/AgentDashboard.tsx) | **1** (L53) | Página | Al montar |
| [AdminDatosAdmin.tsx](file:///e:/github/remhomefinder/src/components/admin/AdminDatosAdmin.tsx) | **1** (L74) | Componente | Al montar |
| [AdminUsuarios.tsx](file:///e:/github/remhomefinder/src/components/admin/AdminUsuarios.tsx) | **1** (L368) | Componente | Por acción |

**Total: ~34 llamadas a `getUser()` + 4 llamadas a `getSession()` = ~38 puntos de auth request**

---

### 2. 🚨 El problema principal: `useProfile` con `staleTime: 0`

```typescript
// useProfile.ts — Línea 63
staleTime: 0, // ← CADA VEZ que un componente monta, refetch
```

`useProfile()` se usa en **múltiples componentes simultáneamente** (Index.tsx, ReferralTracker, etc.). Con `staleTime: 0`, cada vez que un componente se monta o re-monta, TanStack Query ejecuta el `queryFn`, que llama a `getUser()`.

**Impacto estimado:** Este solo hook puede generar **~200-400 auth requests/hora** con 10 usuarios navegando activamente.

---

### 3. 🚨 Listeners `onAuthStateChange` superpuestos

Hay **4 listeners** de `onAuthStateChange` registrados simultáneamente en la app:

| Archivo | Línea | ¿Se limpia? | Efecto |
|---------|-------|-------------|--------|
| [ProtectedRoute.tsx](file:///e:/github/remhomefinder/src/components/ProtectedRoute.tsx#L94) | L94 | ✅ Sí | Llama `checkAccess()` → `getSession()` + query a `user_roles` |
| [usePropertyQueries.ts](file:///e:/github/remhomefinder/src/hooks/usePropertyQueries.ts#L201) | L201 | ✅ Sí | Actualiza `currentUserId` → puede triggear refetch |
| [Auth.tsx](file:///e:/github/remhomefinder/src/pages/Auth.tsx#L65) | L65 | ✅ Sí | Setea sesión local |
| [AuthResetPassword.tsx](file:///e:/github/remhomefinder/src/pages/AuthResetPassword.tsx#L39) | L39 | ✅ Sí | Verificación de reset |

Cada vez que ocurre un evento de auth (login, token refresh, etc.), **todos los listeners activos se ejecutan**, y algunos llaman a `getUser()` o `getSession()` de nuevo, multiplicando las requests.

> [!IMPORTANT]
> El **TOKEN_REFRESHED** event ocurre cada ~1 hora por usuario. Con 10 usuarios, eso son ~10 refreshes/hora, y cada uno dispara 4+ listeners que hacen requests adicionales.

---

### 4. 🚨 `ProtectedRoute` se re-ejecuta en cada navegación

```typescript
// ProtectedRoute.tsx — Línea 117
}, [allowedRoles, location.pathname, queryClient]);
```

El `useEffect` depende de `location.pathname`. **Cada vez que el usuario navega entre rutas**, se ejecuta:
1. `getSession()` → 1 auth request
2. Query a `user_roles` → 1 REST request

Con 10 usuarios navegando activamente (digamos 5 navegaciones/hora cada uno): **50 auth requests/hora solo por navegación**.

---

### 5. 🚨 `usePropertyMutations.onMutate` llama a `getUser()`

```typescript
// usePropertyMutations.ts — Línea 315
onMutate: async ({ id, status }) => {
    const { data: { user } } = await supabase.auth.getUser(); // ← Auth request en optimistic update
    const queryKey = ["properties", user?.id];
```

El `onMutate` se ejecuta **antes** de cada mutación para hacer optimistic update. Esto significa que **cada cambio de estado genera una auth request adicional** solo para obtener el userId para la queryKey.

---

### 6. `PublishPropertyModal` — 6 llamadas independientes

El modal tiene funciones separadas que cada una llama `getUser()`:
- `handleUnifiedImageAnalysis` (L226)
- `handleAnalyzeImage` (L286)  
- `handleFileUpload` (L334)
- `handlePrivateFileUpload` (L364)
- `handleAddExistingFromApp` (L392)
- `handleSubmit` (L436)

Un agente publicando una propiedad puede generar **3-4 auth requests por publicación** (upload + análisis + submit).

---

## 📊 Estimación de Auth Requests por Sesión de Usuario

Asumiendo un usuario activo durante 1 hora:

| Acción | Requests | Frecuencia/hora | Total/hora |
|--------|----------|-----------------|------------|
| Mount de página (ProtectedRoute + useProfile + usePropertyQueries + useSubscription + Index.tsx) | 5 | ~3-5 navegaciones | **15-25** |
| Token refresh (dispara 4 listeners) | 4 | ~1 vez | **4** |
| onAuthStateChange cascading | 2-3 | ~2-3 veces | **6-9** |
| Cambio de estado de propiedad (mutationFn + onMutate) | 2 | ~5-10 cambios | **10-20** |
| Abrir detalle propiedad | 1 | ~10-15 veces | **10-15** |
| Otros hooks (groups, ratings, comments) | 1-2 | ~5-10 | **5-20** |
| **TOTAL POR USUARIO/HORA** | | | **~50-93** |

Con **10 usuarios × 4 horas**: **~2,000 - 3,720 auth requests**

> [!NOTE]
> Los 1,252 observados están dentro de este rango estimado, confirmando que el problema es el patrón de over-fetching descrito.

---

## 🎯 Solución Recomendada (para cuando JP decida implementar)

### Solución Central: Crear un `AuthProvider` con contexto React

En vez de que cada hook/componente llame a `getUser()`, centralizar el estado de auth en un Context Provider:

```
┌─────────────────┐
│  AuthProvider    │  ← UN solo listener de onAuthStateChange
│  (Context React) │  ← UN solo getSession() al montar
│                  │  ← Cachea user en estado React
└───────┬─────────┘
        │
   ┌────┴────┐
   │ useAuth │  ← Hook que todos los componentes usan
   │ Context │  ← Lectura LOCAL, 0 network requests
   └─────────┘
```

**Resultado esperado:**
- Auth requests bajarían de **~1,252 a ~50-100** en el mismo período (reducción del **90-95%**)
- Solo habrían requests en: login, logout, token refresh (~1/hora/usuario), y getSession() inicial

---

## 📋 Archivos que requieren cambios (ordenados por impacto)

### Prioridad ALTA (generan requests en cada mount/navegación):
1. [useProfile.ts](file:///e:/github/remhomefinder/src/hooks/useProfile.ts) — `staleTime: 0` + `getUser()` en queryFn
2. [ProtectedRoute.tsx](file:///e:/github/remhomefinder/src/components/ProtectedRoute.tsx) — `getSession()` en cada navegación
3. [usePropertyQueries.ts](file:///e:/github/remhomefinder/src/hooks/usePropertyQueries.ts) — `getUser()` en mount
4. [useSubscription.ts](file:///e:/github/remhomefinder/src/hooks/useSubscription.ts) — `getUser()` en queryFn
5. [Index.tsx](file:///e:/github/remhomefinder/src/pages/Index.tsx) — `getUser()` directo en useEffect

### Prioridad MEDIA (generan requests en acciones de usuario):
6. [usePropertyMutations.ts](file:///e:/github/remhomefinder/src/hooks/usePropertyMutations.ts) — 5 llamadas
7. [useGroups.ts](file:///e:/github/remhomefinder/src/hooks/useGroups.ts) — 4 llamadas
8. [PublishPropertyModal.tsx](file:///e:/github/remhomefinder/src/components/PublishPropertyModal.tsx) — 6 llamadas
9. [usePropertyRating.ts](file:///e:/github/remhomefinder/src/hooks/usePropertyRating.ts) — 2 llamadas
10. [useImageUploader.ts](file:///e:/github/remhomefinder/src/hooks/useImageUploader.ts) — 2 llamadas

### Prioridad BAJA (acciones infrecuentes):
11. [AdminPublicaciones.tsx](file:///e:/github/remhomefinder/src/components/admin/AdminPublicaciones.tsx)
12. [AdminUsuarios.tsx](file:///e:/github/remhomefinder/src/components/admin/AdminUsuarios.tsx)
13. [AdminDatosAdmin.tsx](file:///e:/github/remhomefinder/src/components/admin/AdminDatosAdmin.tsx)
14. [ReferralTracker.tsx](file:///e:/github/remhomefinder/src/components/ReferralTracker.tsx)
15. [duplicateCheck.ts](file:///e:/github/remhomefinder/src/lib/duplicateCheck.ts)

---

---

## ✅ Plan de Acción (aprobado por JP)

### Nivel 1 — Quick Win (AHORA)
- Cambiar `staleTime: 0` → `staleTime: 300000` (5 min) en `useProfile.ts`
- **Impacto:** -30% auth requests
- **Riesgo:** ⚪ Casi nulo

### Nivel 2 — AuthProvider Parcial (AHORA)
- Crear `src/contexts/AuthProvider.tsx` con Context React
- Migrar los 5 archivos de Prioridad Alta a usar el provider
- **Archivos:** `useProfile.ts`, `ProtectedRoute.tsx`, `usePropertyQueries.ts`, `useSubscription.ts`, `Index.tsx`
- **Impacto:** -70% auth requests
- **Riesgo:** 🟢 Bajo

### Nivel 3 — Migración Completa (DESPUÉS de pruebas)
- Migrar los ~15 archivos restantes de Prioridad Media y Baja
- **Impacto:** -90-95% auth requests
- **Riesgo:** 🟡 Medio
