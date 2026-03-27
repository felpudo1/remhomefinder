

# Plan: Dashboard de Monitoreo de Infraestructura (sysadmin)

## Resumen

Crear una ruta segregada `/admin/infra` accesible solo para usuarios con rol `sysadmin`, con un dashboard dark-mode que muestra metricas de infraestructura Supabase (Disk IO, requests, CPU, RAM, conexiones DB) obtenidas via Edge Function proxy.

## Arquitectura

```text
Browser (sysadmin)
  │
  ├─ /admin/infra  ──► ProtectedRoute(allowedRoles=['sysadmin'])
  │                        │
  │                        ▼
  │                  InfraMonitorPage
  │                        │
  │                  useQuery (poll 60s)
  │                        │
  │                        ▼
  │              supabase.functions.invoke('get-system-metrics')
  │                        │
  │                        ▼
  │              Edge Function (Deno)
  │                ├─ Auth: getClaims() → verifica sysadmin
  │                ├─ Fetch: metrics endpoint con service_role key
  │                ├─ Parse: Prometheus text → JSON
  │                └─ Return: metricas filtradas
```

## Paso 1 — Migración: agregar `sysadmin` al enum `app_role`

```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sysadmin';
```

Tambien agregar una RLS policy o usar `has_role()` existente (ya soporta cualquier valor del enum).

Despues de la migracion, asignar manualmente el rol sysadmin al usuario deseado via SQL o admin panel.

## Paso 2 — Edge Function `get-system-metrics`

Archivo: `supabase/functions/get-system-metrics/index.ts`

- Valida JWT con `getClaims()`, luego verifica rol `sysadmin` consultando `user_roles`
- Usa `SUPABASE_SERVICE_ROLE_KEY` para hacer fetch a `https://{ref}.supabase.co/customer/v1/privileged/metrics`
- Parsea formato Prometheus (lineas `metric_name{labels} value timestamp`) a JSON estructurado
- Retorna objeto con: `diskIo`, `restRequests`, `authRequests`, `realtimeRequests`, `storageRequests`, `cpuUsage`, `ramUsage`, `dbConnections`
- CORS headers incluidos

## Paso 3 — Ruta y guard en App.tsx

- Agregar `SYSADMIN` a `ROLES` en constants.ts
- Agregar ruta `/admin/infra` en App.tsx con `ProtectedRoute allowedRoles={[ROLES.SYSADMIN]}`
- Ruta completamente separada de `/admin/:section` (no es una seccion del admin existente)

## Paso 4 — Pagina `InfraMonitorPage`

Archivo: `src/pages/InfraMonitorPage.tsx`

Componentes internos (todos en el mismo archivo o carpeta `src/components/infra/`):

1. **DiskIoGauge** — Barra de progreso circular/semicircular con el burst balance. Colores: verde >50%, amarillo 20-50%, rojo <20% con badge "PELIGRO"
2. **RequestsChart** — 4 bar charts (Recharts) para REST, Auth, Realtime, Storage requests
3. **ResourceCards** — Cards con CPU %, RAM MB, DB Connections activas
4. **MetricsSkeleton** — Skeleton loaders para carga inicial

UX:
- Dark mode forzado con `className="dark"` en el wrapper
- Polling cada 60s via `refetchInterval: 60_000` en useQuery
- Boton "Refrescar ahora" que invalida la query
- Glassmorphism cards: `bg-slate-900/80 backdrop-blur border-slate-700/50`

## Paso 5 — Hook `useSystemMetrics`

Archivo: `src/hooks/useSystemMetrics.ts`

- Llama a `supabase.functions.invoke('get-system-metrics')`
- `refetchInterval: 60_000`
- `staleTime: 30_000`
- Tipado TypeScript para la respuesta

## Archivos a crear/modificar

| Archivo | Accion |
|---------|--------|
| Migracion SQL | Agregar `sysadmin` al enum `app_role` |
| `supabase/functions/get-system-metrics/index.ts` | Crear edge function proxy |
| `src/lib/constants.ts` | Agregar `SYSADMIN: "sysadmin"` a ROLES, ruta INFRA |
| `src/App.tsx` | Agregar ruta `/admin/infra` protegida |
| `src/pages/InfraMonitorPage.tsx` | Crear pagina principal del dashboard |
| `src/components/infra/DiskIoGauge.tsx` | Gauge de disk IO budget |
| `src/components/infra/RequestsCharts.tsx` | Graficos de requests por tipo |
| `src/components/infra/ResourceCards.tsx` | Cards de CPU, RAM, DB connections |
| `src/hooks/useSystemMetrics.ts` | Hook React Query para metricas |

## Nota de seguridad

La `SUPABASE_SERVICE_ROLE_KEY` ya existe como secret en el proyecto. La edge function la usa server-side; nunca se expone al cliente. El acceso al dashboard requiere doble validacion: JWT valido + rol `sysadmin` en `user_roles`.

