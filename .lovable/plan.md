## Plan: Centralizar status de usuarios en `profiles`

### Contexto actual

- `agencies` tiene una columna `status` (enum `agency_status`: pending/approved/rejected/suspended) que controla si un agente puede operar.
- Los usuarios normales no tienen status — no se pueden suspender/bloquear desde el admin.
- `AdminUsuarios` solo lista user_ids con roles, sin capacidad de gestión.

### Enfoque acordado

Agregar una columna `status` a `profiles` que aplique a **todos** los usuarios (users y agencies). Eventualmente eliminar `status` de `agencies`.

### Migración DB

1. Crear enum `user_status` con valores: `active`, `pending`, `suspended`, `rejected` (mapeo directo de `agency_status`).
2. Agregar columna `status` a `profiles` con default `'active' para users y 'pending' para agencias`.
3. Migrar datos: para cada agencia, copiar su status al profile del `created_by` correspondiente (mapeando approved→active).
4. **No** eliminar `status` de `agencies` aún (se hace en un segundo deploy para no romper nada).

### Cambios Frontend

`**AdminUsuarios.tsx**` — Reescribir completamente:

- Consultar `profiles` con join a `user_roles` para mostrar nombre, email (del display_name o del profile), rol y status.
- Agregar un `<Select>` igual al de `AdminAgencias` para cambiar el status del profile.
- Mostrar badges de color según status.

`**AgentDashboard.tsx**` — Leer status desde profile en lugar de agency:

- Después de obtener el user, consultar `profiles` para obtener el `status`.
- Pasar ese status a `AgentHeader` y usarlo para condicionar la UI (en lugar de `agency.status`).

`**AgentHeader.tsx**` — Sin cambios de lógica, solo recibe el status desde otra fuente.

`**AgentProfile.tsx**` — Leer status del profile en vez de `agency.status` para los banners de pending/suspended/rejected.

`**AgentProperties.tsx**` — Condicionar `enabled` y el render según el status del profile.

`**AdminAgencias.tsx**` — Actualizar `updateStatus` para escribir en `profiles` en vez de (o además de) `agencies`. Eventualmente solo en `profiles`.

### RLS

- Agregar política para que admins puedan actualizar `profiles.status`.
- La política existente de "Users can update own profile" no debe permitir que un user cambie su propio status (se puede resolver con una función security definer o restringiendo las columnas actualizables).

### Orden de implementación

1. Migración SQL (enum + columna + datos)
2. RLS para admin update de status
3. Refactorizar `AdminUsuarios` con gestión de status
4. Refactorizar agent dashboard para leer status de profiles
5. (Futuro) DROP column `status` de `agencies`