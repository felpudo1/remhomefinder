

## Plan: Separar visualmente la org principal de agencia en GroupsModal

### Cambios

**1. `src/hooks/useGroups.ts`** — Exponer el campo `type` en la interfaz `Group` y en el query:

- Agregar `type: string` a la interfaz `Group`
- Mapear `o.type` en el return del queryFn
- Crear una segunda query (o retornar separado) para la org principal de agencia: filtrar donde `type = 'agency_team'` en lugar de excluirla. Alternativamente, hacer un solo query sin filtro `is_personal` y separar en el hook:
  - `agencyOrg`: la org con `type === 'agency_team'` (puede ser `null`)
  - `groups`: las demás orgs con `is_personal === false` y `type !== 'agency_team'`
- Retornar `{ groups, agencyOrg, ... }`

**2. `src/components/GroupsModal.tsx`** — Cuando `isAgent = true`, mostrar sección fija "Mi Agencia" arriba:

- Extraer `agencyOrg` del hook `useGroups`
- Si `isAgent && agencyOrg`:
  - Renderizar una sección fija arriba del tab "Mis grupos" con:
    - Nombre de la agencia con icono diferenciado (Building2)
    - Código de invitación con botón copiar
    - Contador de miembros (clickeable para ver detalle)
    - Sin botón "Abandonar" ni "Eliminar"
  - Un separador visual, luego la lista normal de sub-equipos debajo
- Ajustar micro-copy cuando `isAgent`: "Mis Equipos" en lugar de "Mis Grupos", "Crear equipo" en lugar de "Crear grupo", placeholders adaptados

**3. Detail view** — Si el grupo abierto es la org `agency_team`:
- No mostrar botón "Abandonar grupo"
- Mostrar label "Organización principal" en la cabecera

### Archivos tocados
- `src/hooks/useGroups.ts` — agregar `type` a `Group`, retornar `agencyOrg` separado
- `src/components/GroupsModal.tsx` — sección fija agencia + micro-copy adaptado

No hay cambios de DB ni migraciones.

