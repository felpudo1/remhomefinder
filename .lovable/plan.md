

# Plan de Recuperacion y Prevencion de Crash por Disk I/O

## Diagnostico

Las estadisticas de Supabase muestran en 24h:
- **26,909 REST requests** (excesivo para ~10 usuarios)
- **1,626 Auth requests** (aun alto, deberia ser ~50)
- **764 Realtime requests**

Ademas, en los network logs del preview se ven **refresh_token requests cada ~30 segundos que fallan** ("signal is aborted without reason"), lo cual genera un bucle de reintentos de auth que martilla la BD.

### Fuentes del problema identificadas:

1. **Auth: 15+ llamadas `getUser()` dispersas** — Pese al AuthProvider, quedan ~15 archivos llamando `supabase.auth.getUser()` directamente (PublishPropertyModal tiene 6 sola, usePropertyRating tiene 2, GroupsModal, useImageUploader, AdminPublicaciones, AdminDatosAdmin, PropertyDetailModal, usePropertyExtractor, AdminUsuarios). Cada una es un HTTP request al servidor de Auth.

2. **DbStatusBadge: polling cada 60 segundos** — Hace un `SELECT` a `properties` cada minuto. Con multiples tabs = multiples queries/minuto constantes.

3. **Realtime: 2 canales globales sin filtro** — Escuchan `event: "*"` en tablas completas (`user_listings`, `properties`, `user_listing_attachments`, `family_comments`). Cualquier cambio de CUALQUIER usuario dispara invalidacion para TODOS los clientes conectados.

4. **`select("*")` en 6+ archivos** — Admin y AgentProperties traen datos completos incluyendo campos pesados como `raw_ai_data`.

5. **useProfile con staleTime: 0** — Se refetchea en CADA mount/navegacion.

---

## Plan de Implementacion

### Paso 1 — Eliminar `getUser()` restantes (Auth: -1,500 req/dia)

Reemplazar las ~15 llamadas directas a `supabase.auth.getUser()` con `useCurrentUser()` del AuthProvider en:

- `usePropertyRating.ts` (2 llamadas) — pasar `userId` como parametro o leer del hook
- `PublishPropertyModal.tsx` (6 llamadas) — leer `authUser` del hook al inicio del componente
- `GroupsModal.tsx` (1 llamada) — usar `useCurrentUser()`
- `useImageUploader.ts` (2 llamadas)
- `PropertyDetailModal.tsx` (1 llamada)
- `usePropertyExtractor.ts` (1 llamada)
- `AdminDatosAdmin.tsx` (1 llamada)
- `AdminPublicaciones.tsx` (2 llamadas)
- `AdminUsuarios.tsx` (1 llamada)

### Paso 2 — DbStatusBadge: subir intervalo a 5 min

Cambiar `setInterval(runCheck, 60_000)` a `setInterval(runCheck, 300_000)` (5 min). El badge ya tiene un boton manual de reintento. Tambien eliminar `useAdminDbStatus.ts` si duplica la misma logica.

### Paso 3 — Realtime: filtrar por usuario

Agregar `filter: "added_by=eq.{userId}"` en el canal de `user_listings` para que solo reciba eventos del usuario actual, no de todos los usuarios de la plataforma. Esto reduce drasticamente los eventos Realtime y las invalidaciones de cache.

### Paso 4 — useProfile: agregar staleTime

Agregar `staleTime: 2 * 60 * 1000` (2 min) a useProfile para evitar refetch en cada navegacion.

### Paso 5 — Proyectar columnas en `select("*")` restantes

Reemplazar `select("*")` por columnas especificas en:
- `AgentProperties.tsx` (user_search_profiles)
- `AdminGrupos.tsx` (organizations)
- `AdminEstadisticas.tsx` (user_search_profiles x2)
- `AdminAuditLog.tsx` (deletion_audit_log, publication_deletion_audit_log)
- `AdminDatosAdmin.tsx` (admin_keys)

### Impacto estimado

| Metrica | Antes (24h) | Despues estimado |
|---------|-------------|-----------------|
| Auth Requests | 1,626 | ~50 |
| REST Requests | 26,909 | ~5,000 |
| Realtime | 764 | ~200 |

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/usePropertyRating.ts` | Reemplazar 2x `getUser()` con useCurrentUser |
| `src/components/PublishPropertyModal.tsx` | Reemplazar 6x `getUser()` con useCurrentUser |
| `src/components/GroupsModal.tsx` | Reemplazar `getUser()` con useCurrentUser |
| `src/hooks/useImageUploader.ts` | Reemplazar 2x `getUser()` con useCurrentUser |
| `src/components/PropertyDetailModal.tsx` | Reemplazar `getUser()` con useCurrentUser |
| `src/hooks/usePropertyExtractor.ts` | Reemplazar `getUser()` con useCurrentUser |
| `src/components/admin/AdminDatosAdmin.tsx` | Reemplazar `getUser()` + proyectar columnas |
| `src/components/admin/AdminPublicaciones.tsx` | Reemplazar 2x `getUser()` |
| `src/components/admin/AdminUsuarios.tsx` | Reemplazar `getUser()` |
| `src/components/ui/DbStatusBadge.tsx` | Intervalo 60s → 300s |
| `src/hooks/useAdminDbStatus.ts` | Evaluar eliminacion (duplicado) |
| `src/hooks/usePropertyQueries.ts` | Filtro Realtime por usuario |
| `src/hooks/useProfile.ts` | Agregar staleTime 2 min |
| `src/components/agent/AgentProperties.tsx` | Proyectar columnas |
| `src/components/admin/AdminGrupos.tsx` | Proyectar columnas |
| `src/components/admin/AdminEstadisticas.tsx` | Proyectar columnas |
| `src/components/admin/system/AdminAuditLog.tsx` | Proyectar columnas |

