# 📋 Segunda Etapa: Mejora Auth Requests

**Fecha:** 2026-03-26  
**Proyecto:** homefinder4

---

## ✅ Lo que ya se hizo (Nivel 1 + Nivel 2)

### Nivel 1 — Quick Win
| Archivo | Cambio | Impacto |
|---------|--------|---------|
| [useProfile.ts](file:///e:/github/remhomefinder/src/hooks/useProfile.ts) | `staleTime: 0` → `5 * 60 * 1000` | Evita refetch en cada mount |

### Nivel 2 — AuthProvider Parcial
| Archivo | Cambio | Auth requests eliminadas |
|---------|--------|--------------------------|
| [AuthProvider.tsx](file:///e:/github/remhomefinder/src/contexts/AuthProvider.tsx) | **NUEVO** — Provider central con 1 listener | Centraliza toda la auth |
| [App.tsx](file:///e:/github/remhomefinder/src/App.tsx) | Wrap con `<AuthProvider>` | — |
| [useProfile.ts](file:///e:/github/remhomefinder/src/hooks/useProfile.ts) | `getUser()` → `useCurrentUser()` | -1 request/mount |
| [ProtectedRoute.tsx](file:///e:/github/remhomefinder/src/components/ProtectedRoute.tsx) | `getSession()` + `onAuthStateChange` → `useCurrentUser()` | -1 request/navegación + eliminó 1 listener |
| [usePropertyQueries.ts](file:///e:/github/remhomefinder/src/hooks/usePropertyQueries.ts) | `getUser()` + `onAuthStateChange` → `useCurrentUser()` | -1 request/mount + eliminó 1 listener |
| [useSubscription.ts](file:///e:/github/remhomefinder/src/hooks/useSubscription.ts) | `getUser()` → `useCurrentUser()` | -1 request/mount |
| [Index.tsx](file:///e:/github/remhomefinder/src/pages/Index.tsx) | `getUser()` → `useCurrentUser()` | -1 request/mount |

**Estado actual:** Compilando sin errores ✅. De 4 listeners `onAuthStateChange`, quedaron 2 (Auth.tsx y AuthResetPassword.tsx, que son páginas de login y no afectan usuarios logueados).

---

## 🔮 Nivel 3 — Migración Completa (plan detallado)

> [!IMPORTANT]
> Estos cambios se harán **después de testear** que Nivel 1+2 funcionan correctamente en producción.

### Resumen de Nivel 3

| Métrica | Valor |
|---------|-------|
| Archivos a modificar | **15** |
| `getUser()` a eliminar | **~28** |
| Tiempo estimado | 2-3 horas |
| Riesgo | 🟡 Medio |
| Reducción adicional | ~20-25% auth requests |

---

### Grupo A: Hooks con `mutationFn` (reciben user vía closure)

> [!NOTE]
> Los hooks que usan `useMutation` no pueden llamar a `useCurrentUser()` dentro del `mutationFn` (es async, no es un componente React).
> **Patrón:** Llamar a `useCurrentUser()` al nivel del hook y capturar `user` por closure en cada `mutationFn`.

---

#### A1. [usePropertyMutations.ts](file:///e:/github/remhomefinder/src/hooks/usePropertyMutations.ts)

**Cantidad de `getUser()`:** 5  
**Complejidad:** 🟡 Media  
**Riesgo:** 🟡 Medio (tiene optimistic update en `onMutate`)

| Línea | Función | Código actual | Cambio propuesto |
|-------|---------|--------------|------------------|
| L78 | `addPropertyMutation.mutationFn` | `const { data: { user } } = await supabase.auth.getUser();` | Usar `authUser` del closure |
| L201 | `updateStatusMutation.mutationFn` | `const { data: { user } } = await supabase.auth.getUser();` | Usar `authUser` del closure |
| L315 | `updateStatusMutation.onMutate` | `const { data: { user } } = await supabase.auth.getUser();` | Usar `authUser` del closure |
| L349 | `addCommentMutation.mutationFn` | `const { data: { user } } = await supabase.auth.getUser();` | Usar `authUser` del closure |

**Cambio concreto:**
```diff
 export function usePropertyMutations() {
     const queryClient = useQueryClient();
+    // Leer userId del AuthProvider centralizado
+    const { user: authUser } = useCurrentUser();

     const addPropertyMutation = useMutation({
         mutationFn: async (form: { ... }) => {
-            const { data: { user } } = await supabase.auth.getUser();
-            if (!user) throw new Error("No autenticado");
+            if (!authUser) throw new Error("No autenticado");
+            const user = authUser; // Mantener compat con código existente
```

Este patrón se repite idéntico en las 5 ocurrencias del archivo.

> [!WARNING]
> El `onMutate` (L315) es el más delicado: se usa para construir la `queryKey` del optimistic update. Actualmente hace `getUser()` → usa `user?.id` como key. Con el AuthProvider, usará `authUser?.id` del closure. Si `authUser` es `null` en ese momento (race condition), el optimistic update no funcionaría. **Verificar bien este punto al implementar.**

---

#### A2. [useGroups.ts](file:///e:/github/remhomefinder/src/hooks/useGroups.ts)

**Cantidad de `getUser()`:** 4  
**Complejidad:** 🟢 Baja  
**Riesgo:** 🟢 Bajo

| Línea | Función | Código actual |
|-------|---------|--------------|
| L39 | `queryFn` (fetch groups) | `const { data: { user } } = await supabase.auth.getUser();` |
| L104 | `createGroupMutation.mutationFn` | `const { data: { user } } = await supabase.auth.getUser();` |
| L144 | `joinGroupMutation.mutationFn` | `const { data: { user } } = await supabase.auth.getUser();` |
| L176 | `leaveGroupMutation.mutationFn` | `const { data: { user } } = await supabase.auth.getUser();` |

**Cambio concreto:**
```diff
 export function useGroups() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
+  const { user: authUser } = useCurrentUser();

   const { data, isLoading } = useQuery({
-    queryKey: ["groups"],
+    queryKey: ["groups", authUser?.id],
+    enabled: !!authUser,
     queryFn: async () => {
-      const { data: { user } } = await supabase.auth.getUser();
-      if (!user) return { groups: [] as Group[], agencyOrg: null };
+      if (!authUser) return { groups: [] as Group[], agencyOrg: null };
```

---

#### A3. [useSaveToList.ts](file:///e:/github/remhomefinder/src/hooks/useSaveToList.ts)

**Cantidad de `getUser()`:** 1 (L14)  
**Complejidad:** 🟢 Baja  
**Riesgo:** 🟢 Bajo

```diff
 export function useSaveToList() {
   const queryClient = useQueryClient();
+  const { user: authUser } = useCurrentUser();

   return useMutation({
     mutationFn: async ({ property, groupId }) => {
-      const { data: { user } } = await supabase.auth.getUser();
-      if (!user) throw new Error("No autenticado");
+      if (!authUser) throw new Error("No autenticado");
```

---

#### A4. [usePropertyRating.ts](file:///e:/github/remhomefinder/src/hooks/usePropertyRating.ts)

**Cantidad de `getUser()`:** 2 (L32, L71)  
**Complejidad:** 🟢 Baja  
**Riesgo:** 🟢 Bajo

| Línea | Función |
|-------|---------|
| L32 | `queryFn` (fetch ratings) |
| L71 | `rateMutation.mutationFn` |

```diff
 export function usePropertyRating(propertyId: string, groupId: string | null) {
     const queryClient = useQueryClient();
     const { toast } = useToast();
+    const { user: authUser } = useCurrentUser();

     const { data: ratingsData, isLoading } = useQuery({
         queryFn: async () => {
-            const { data: { user } } = await supabase.auth.getUser();
-            if (!user) return null;
+            if (!authUser) return null;
```

---

### Grupo B: Hooks y componentes que NO son componentes React

> [!CAUTION]
> `duplicateCheck.ts` es un **archivo de utilidad puro** (no es un hook ni un componente React). No puede usar `useCurrentUser()` directamente. La solución es **recibir `userId` como parámetro**.

---

#### B1. [duplicateCheck.ts](file:///e:/github/remhomefinder/src/lib/duplicateCheck.ts)

**Cantidad de `getUser()`:** 1 (L45)  
**Complejidad:** 🔴 Alta  
**Riesgo:** 🟡 Medio (requiere cambiar la firma de la función y todos sus callers)

**Código actual (L36-55):**
```typescript
export async function checkUrlStatus(
  url: string,
  orgId: string | null
): Promise<UrlCheckResult> {
  const normalized = normalizeUrl(url);
  if (!normalized) return { case: "none" };

  let resolvedOrgId = orgId;
  if (!resolvedOrgId) {
    const { data: { user } } = await supabase.auth.getUser(); // ← AUTH REQUEST
    if (!user) return { case: "none" };
    const { data: membership } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    resolvedOrgId = membership?.org_id ?? null;
  }
```

**Cambio propuesto:** Agregar `userId` como parámetro opcional:
```diff
 export async function checkUrlStatus(
   url: string,
-  orgId: string | null
+  orgId: string | null,
+  userId?: string | null
 ): Promise<UrlCheckResult> {
   ...
   if (!resolvedOrgId) {
-    const { data: { user } } = await supabase.auth.getUser();
-    if (!user) return { case: "none" };
+    if (!userId) return { case: "none" };
     const { data: membership } = await supabase
       .from("organization_members")
       .select("org_id")
-      .eq("user_id", user.id)
+      .eq("user_id", userId)
```

**Archivos que llaman a `checkUrlStatus` (callers a actualizar):**
- [usePropertyExtractor.ts](file:///e:/github/remhomefinder/src/hooks/usePropertyExtractor.ts) L64 — pasar `authUser?.id`
- [PublishPropertyModal.tsx](file:///e:/github/remhomefinder/src/components/PublishPropertyModal.tsx) L133 — pasar `authUser?.id`

---

### Grupo C: Hooks de upload/extracción

---

#### C1. [useImageUploader.ts](file:///e:/github/remhomefinder/src/hooks/useImageUploader.ts)

**Cantidad de `getUser()`:** 2 (L45, L87)  
**Complejidad:** 🟢 Baja  
**Riesgo:** 🟢 Bajo

| Línea | Función |
|-------|---------|
| L45 | `uploadFiles` — usa `user.id` para path de storage |
| L87 | `uploadScreenshot` — usa `user.id` para path de storage |

```diff
 export function useImageUploader() {
   const [isUploading, setIsUploading] = useState(false);
+  const { user: authUser } = useCurrentUser();

   const uploadFiles = async (...) => {
-    const { data: { user } } = await supabase.auth.getUser();
-    if (!user) { toast.error("..."); return []; }
+    if (!authUser) { toast.error("..."); return []; }
     ...
-    const path = `${user.id}/${prefix}${safeUUID()}.${ext}`;
+    const path = `${authUser.id}/${prefix}${safeUUID()}.${ext}`;
```

---

#### C2. [usePropertyExtractor.ts](file:///e:/github/remhomefinder/src/hooks/usePropertyExtractor.ts)

**Cantidad de `getUser()`:** 1 (L142)  
**Complejidad:** 🟢 Baja  
**Riesgo:** 🟢 Bajo

```diff
 export function usePropertyExtractor() {
+  const { user: authUser } = useCurrentUser();

   const handleImagesExtractor = async (...) => {
-    const { data: { user } } = await supabase.auth.getUser();
-    if (!user) { toast.error("..."); return null; }
+    if (!authUser) { toast.error("..."); return null; }
     ...
-    const path = `${user.id}/screenshot-${safeUUID()}.${ext}`;
+    const path = `${authUser.id}/screenshot-${safeUUID()}.${ext}`;
```

---

### Grupo D: Componentes (leer user del Context directo)

---

#### D1. [PublishPropertyModal.tsx](file:///e:/github/remhomefinder/src/components/PublishPropertyModal.tsx)

**Cantidad de `getUser()`:** 6  
**Complejidad:** 🟡 Media (archivo largo, muchas funciones)  
**Riesgo:** 🟢 Bajo (cada función es independiente)

| Línea | Función |
|-------|---------|
| L226 | `handleUnifiedImageAnalysis` |
| L286 | `handleAnalyzeImage` |
| L334 | `handleFileUpload` |
| L364 | `handlePrivateFileUpload` |
| L392 | `handleAddExistingFromApp` |
| L436 | `handleSubmit` |

**Cambio concreto:** Agregar `useCurrentUser()` al inicio del componente y reemplazar las 6 llamadas:
```diff
 export function PublishPropertyModal({ ... }) {
   const { toast } = useToast();
+  const { user: authUser } = useCurrentUser();

   // En cada función async:
-  const { data: { user } } = await supabase.auth.getUser();
-  if (!user) { sonnerToast.error("..."); return; }
+  if (!authUser) { sonnerToast.error("..."); return; }
```

---

#### D2. [GroupsModal.tsx](file:///e:/github/remhomefinder/src/components/GroupsModal.tsx)

**Cantidad de `getUser()`:** 1 (L62)  
**Complejidad:** 🟢 Baja  
**Riesgo:** 🟢 Bajo

```diff
 export function GroupsModal({ ... }) {
+  const { user: authUser } = useCurrentUser();
   ...
   useEffect(() => {
     if (open) {
-      supabase.auth.getUser().then(({ data }) => {
-        setCurrentUserId(data.user?.id || null);
-      });
+      setCurrentUserId(authUser?.id || null);
     } else {
```

---

#### D3. [PropertyDetailModal.tsx](file:///e:/github/remhomefinder/src/components/PropertyDetailModal.tsx)

**Cantidad de `getUser()`:** 1 (L160)  
**Complejidad:** 🟢 Baja  
**Riesgo:** 🟢 Bajo

Se usa en `markCommentsAsRead` (L158-180):
```diff
 export function PropertyDetailModal({ ... }) {
+  const { user: authUser } = useCurrentUser();
   ...
   const markCommentsAsRead = async () => {
-    const { data: { user } } = await supabase.auth.getUser();
-    if (!user) return;
+    if (!authUser) return;
     await (supabase as any)
       .from("user_listing_comment_reads")
       .upsert({
         user_listing_id: property.id,
-        user_id: user.id,
+        user_id: authUser.id,
```

---

#### D4. [ReferralTracker.tsx](file:///e:/github/remhomefinder/src/components/ReferralTracker.tsx)

**Cantidad de `getUser()`:** 1 (L31)  
**Complejidad:** 🟢 Baja  
**Riesgo:** 🟢 Bajo (condicional, rara vez se ejecuta)

```diff
 export const ReferralTracker = () => {
+    const { user: authUser } = useCurrentUser();
     ...
     const linkReferral = async () => {
-        const { data: { user } } = await supabase.auth.getUser();
-        if (!user) return;
+        if (!authUser) return;
         const { error } = await (supabase.from("profiles") as any)
             .update({ referred_by_id: refId })
-            .eq("user_id", user.id);
+            .eq("user_id", authUser.id);
```

---

### Grupo E: Páginas y Admin

---

#### E1. [AgentDashboard.tsx](file:///e:/github/remhomefinder/src/pages/AgentDashboard.tsx)

**Cantidad de `getUser()`:** 1 (L53)  
**Complejidad:** 🟢 Baja

```diff
+const { user: authUser } = useCurrentUser();
-const { data: { user } } = await supabase.auth.getUser();
+// Usar authUser del contexto
```

---

#### E2. [AdminPublicaciones.tsx](file:///e:/github/remhomefinder/src/components/admin/AdminPublicaciones.tsx)

**Cantidad de `getUser()`:** 2 (L195, L279)  
**Complejidad:** 🟢 Baja

---

#### E3. [AdminUsuarios.tsx](file:///e:/github/remhomefinder/src/components/admin/AdminUsuarios.tsx)

**Cantidad de `getUser()`:** 1 (L368)  
**Complejidad:** 🟢 Baja

---

#### E4. [AdminDatosAdmin.tsx](file:///e:/github/remhomefinder/src/components/admin/AdminDatosAdmin.tsx)

**Cantidad de `getUser()`:** 1 (L74)  
**Complejidad:** 🟢 Baja

> [!NOTE]
> Los 3 archivos admin son cambios idénticos y mecánicos. El patrón es siempre el mismo: `useCurrentUser()` al inicio del componente y reemplazar `getUser()`.

---

## 📊 Resumen por prioridad de implementación

| # | Archivo | getUser eliminadas | Complejidad | Orden sugerido |
|---|---------|-------------------|-------------|----------------|
| 1 | usePropertyMutations.ts | 5 | 🟡 Media | Primero (más impacto) |
| 2 | PublishPropertyModal.tsx | 6 | 🟡 Media | Segundo |
| 3 | useGroups.ts | 4 | 🟢 Baja | Tercero |
| 4 | usePropertyRating.ts | 2 | 🟢 Baja | Cuarto |
| 5 | useImageUploader.ts | 2 | 🟢 Baja | Quinto |
| 6 | usePropertyExtractor.ts | 1 | 🟢 Baja | Sexto |
| 7 | duplicateCheck.ts | 1 | 🔴 Alta | Séptimo (cambio de firma) |
| 8 | GroupsModal.tsx | 1 | 🟢 Baja | Octavo |
| 9 | PropertyDetailModal.tsx | 1 | 🟢 Baja | Noveno |
| 10 | useSaveToList.ts | 1 | 🟢 Baja | Décimo |
| 11 | ReferralTracker.tsx | 1 | 🟢 Baja | Once |
| 12 | AgentDashboard.tsx | 1 | 🟢 Baja | Doce |
| 13 | AdminPublicaciones.tsx | 2 | 🟢 Baja | Trece |
| 14 | AdminUsuarios.tsx | 1 | 🟢 Baja | Catorce |
| 15 | AdminDatosAdmin.tsx | 1 | 🟢 Baja | Quince |
| | **TOTAL** | **~28** | | |

---

## ⚠️ Puntos de atención al implementar Nivel 3

1. **`onMutate` en usePropertyMutations.ts (L315):** Verifica que `authUser` no sea `null` cuando se ejecuta el optimistic update. Si hay una race condition (usuario se deslogueó justo antes), el rollback debe funcionar igual.

2. **`duplicateCheck.ts`:** Requiere cambiar la firma de `checkUrlStatus()` y actualizar todos los callers. Es el cambio más invasivo del Nivel 3.

3. **`PublishPropertyModal.tsx`:** Tiene 6 funciones async independientes. El patrón es idéntico en todas pero hay que tener cuidado de no romper el flujo de upload → análisis → submit.

4. **Testing post-implementación:**
   - Login/logout funciona
   - Agregar propiedad (manual + scrape)
   - Cambiar estado de propiedad
   - Agregar comentario
   - Subir fotos
   - Crear/unirse a grupo
   - Dashboard de agente funciona
   - Panel admin funciona

---

## 🤖 Prompt para Lovable

```
## Contexto
La app ya tiene un AuthProvider centralizado en `src/contexts/AuthProvider.tsx` que exporta 
un hook `useCurrentUser()` con `{ user, session, isLoading, refreshUser }`. Este provider 
ya está integrado en `App.tsx` wrapping toda la app, y ya se migró exitosamente en 5 archivos 
(useProfile.ts, ProtectedRoute.tsx, usePropertyQueries.ts, useSubscription.ts, Index.tsx).

Ahora necesito migrar los 15 archivos restantes que todavía llaman a 
`supabase.auth.getUser()` directamente, para que usen `useCurrentUser()` del AuthProvider.

La app usa: React, TypeScript, TanStack Query, Supabase.

## Patrón de migración

Hay 2 patrones según el tipo de archivo:

### Patrón 1: Hooks con mutations (usePropertyMutations, useGroups, useSaveToList, usePropertyRating)
- Agregar `const { user: authUser } = useCurrentUser();` al nivel del hook
- Agregar `import { useCurrentUser } from "@/contexts/AuthProvider";`
- En cada `queryFn` y `mutationFn`: reemplazar `const { data: { user } } = await supabase.auth.getUser();` por usar `authUser` del closure
- En queryKeys que usen userId: agregar `authUser?.id` y `enabled: !!authUser`
- MANTENER el `if (!user/!authUser) throw new Error("No autenticado");` check

### Patrón 2: Componentes React (PublishPropertyModal, GroupsModal, PropertyDetailModal, ReferralTracker, AgentDashboard, AdminPublicaciones, AdminUsuarios, AdminDatosAdmin)
- Agregar `const { user: authUser } = useCurrentUser();` dentro del componente
- Agregar `import { useCurrentUser } from "@/contexts/AuthProvider";`
- Reemplazar todas las llamadas a `supabase.auth.getUser()` por usar `authUser`
- Reemplazar `user.id` por `authUser.id`, `user.email` por `authUser.email`, etc.

### Caso especial: `src/lib/duplicateCheck.ts`
- Este es un archivo de UTILIDAD PURO (no es un hook ni componente React)
- NO puede usar `useCurrentUser()` porque no es un componente React
- Solución: agregar `userId?: string | null` como tercer parámetro opcional a `checkUrlStatus()`
- Dentro de la función: reemplazar `getUser()` por usar el `userId` recibido
- Actualizar los callers:
  - `src/hooks/usePropertyExtractor.ts` línea 64: pasar `authUser?.id` como tercer argumento
  - `src/components/PublishPropertyModal.tsx` donde llama a `checkUrlStatus`: pasar `authUser?.id`

## Archivos a modificar (en este orden)

1. `src/hooks/usePropertyMutations.ts` — 5 llamadas a getUser() (L78, L201, L315, L349)
   ⚠️ CUIDADO con onMutate en L315: usa getUser() para construir queryKey del optimistic update
2. `src/components/PublishPropertyModal.tsx` — 6 llamadas a getUser()
3. `src/hooks/useGroups.ts` — 4 llamadas a getUser() (en queryFn y 3 mutations)
   Agregar queryKey: ["groups", authUser?.id] y enabled: !!authUser
4. `src/hooks/usePropertyRating.ts` — 2 llamadas (queryFn + mutation)
5. `src/hooks/useImageUploader.ts` — 2 llamadas (uploadFiles L45 + uploadScreenshot L87)
   user.id se usa para path de Storage: `${user.id}/prefix-uuid.ext`
6. `src/hooks/usePropertyExtractor.ts` — 1 llamada (handleImagesExtractor L142)
   user.id se usa para path de Storage
7. `src/lib/duplicateCheck.ts` — 1 llamada (L45) — CASO ESPECIAL: agregar parámetro userId
8. `src/components/GroupsModal.tsx` — 1 llamada (L62, en useEffect al abrir modal)
9. `src/components/PropertyDetailModal.tsx` — 1 llamada (L160, markCommentsAsRead)
10. `src/hooks/useSaveToList.ts` — 1 llamada (mutationFn L14)
11. `src/components/ReferralTracker.tsx` — 1 llamada (L31, condicional con referral ID)
12. `src/pages/AgentDashboard.tsx` — 1 llamada (L53)
13. `src/components/admin/AdminPublicaciones.tsx` — 2 llamadas (L195, L279)
14. `src/components/admin/AdminUsuarios.tsx` — 1 llamada (L368)
15. `src/components/admin/AdminDatosAdmin.tsx` — 1 llamada (L74)

## Reglas importantes
1. NO modificar `AuthProvider.tsx`, `App.tsx`, `useProfile.ts`, `ProtectedRoute.tsx`, 
   `usePropertyQueries.ts`, `useSubscription.ts`, ni `Index.tsx` — ya están migrados
2. NO cambiar la lógica de negocio, solo reemplazar de dónde viene el `user`
3. Mantener todos los tipos TypeScript existentes
4. Si encontrás algún error en otro lugar, NO lo corrijas — avisame primero
5. Agregar comentarios cortos explicando que el user viene del AuthProvider
6. Después de todos los cambios, correr `npx tsc --noEmit` para verificar que no hay errores de tipos
```

