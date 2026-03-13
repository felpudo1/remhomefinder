

## Plan: Compartir propiedades entre agentes del mismo equipo (Opcion A)

### Resumen
Crear una tabla puente `agency_shared_properties` que vincula `marketplace_properties` con `groups`. Agregar una nueva pestaña "Equipo" en el AgentDashboard que muestra las propiedades compartidas por todos los miembros del grupo activo. Agregar un botón "Compartir en equipo" en cada card de propiedad del agente.

### 1. Migración SQL

Nueva tabla `agency_shared_properties`:
```sql
CREATE TABLE public.agency_shared_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_property_id uuid NOT NULL REFERENCES marketplace_properties(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(marketplace_property_id, group_id)
);

ALTER TABLE public.agency_shared_properties ENABLE ROW LEVEL SECURITY;
```

RLS policies usando `is_group_member` (security definer existente):
- **SELECT**: `is_group_member(auth.uid(), group_id)` -- miembros del grupo pueden ver
- **INSERT**: `is_group_member(auth.uid(), group_id) AND shared_by = auth.uid()` -- solo miembros pueden compartir
- **DELETE**: `shared_by = auth.uid() OR is_group_owner(auth.uid(), group_id)` -- autor o dueño del grupo pueden quitar

### 2. Nueva pestaña "Equipo" en AgentDashboard

- Agregar tab `{ id: "equipo", label: "Equipo", icon: Users }` al array `TABS`
- Actualizar el tipo `AgentTab` para incluir `"equipo"`
- Renderizar nuevo componente `AgentTeamProperties` cuando `activeTab === "equipo"`
- La pestaña solo se muestra si hay un `activeGroupId` seleccionado; si no hay grupo activo, mostrar un mensaje invitando a seleccionar/crear uno

### 3. Nuevo componente `AgentTeamProperties`

**Props**: `activeGroupId: string | null`

**Lógica**:
- Query a `agency_shared_properties` filtrando por `group_id = activeGroupId`, con join a `marketplace_properties` para obtener los datos completos
- Como Supabase JS no soporta joins directos entre tablas sin FK declarada en el cliente, hacer un query en dos pasos: primero los IDs compartidos, luego las propiedades
- Mostrar las propiedades usando `PropertyCardBase` (read-only, sin botones de editar/estado)
- Mostrar quién compartió cada propiedad (badge con nombre del agente)

### 4. Botón "Compartir en equipo" en AgentProperties

- En cada `PropertyCardBase` dentro de la pestaña "Mis Propiedades", agregar un botón/icono "Compartir" junto a "Editar" y "Estado"
- Al hacer click, si el agente pertenece a un solo grupo, compartir directo. Si pertenece a varios, mostrar un pequeño dropdown/select para elegir el grupo
- Insertar en `agency_shared_properties` con `marketplace_property_id`, `group_id` y `shared_by`
- Si ya está compartido en ese grupo, mostrar opción de "Dejar de compartir" (DELETE)
- Usar `useGroups()` para obtener los grupos del agente

### 5. Hook `useAgencySharedProperties`

Nuevo hook en `src/hooks/useAgencySharedProperties.ts`:
- Recibe `groupId: string | null`
- Query `agency_shared_properties` por `group_id`, luego fetch de `marketplace_properties` por los IDs obtenidos
- Enriquecer con `shared_by` -> nombre del agente desde `profiles`
- Mutations para compartir (INSERT) y dejar de compartir (DELETE)

### Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| Migracion SQL | Crear tabla + RLS |
| `src/hooks/useAgencySharedProperties.ts` | Crear (hook) |
| `src/components/agent/AgentTeamProperties.tsx` | Crear (componente pestaña Equipo) |
| `src/pages/AgentDashboard.tsx` | Agregar tab "equipo" y renderizar componente |
| `src/components/agent/AgentProperties.tsx` | Agregar botón "Compartir en equipo" en cada card |

### Notas
- No se toca la lógica de grupos de usuarios/familias (tabla `properties` + `group_id`)
- El sistema de grupos (`groups` + `group_members`) se reutiliza tal cual, sin cambios
- Las propiedades compartidas son read-only para los miembros que no son el autor original

