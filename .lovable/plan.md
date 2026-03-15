

# Fix: Los equipos creados por agentes no aparecen en el listado

## Problema

`createGroupMutation` siempre inserta con `type: "family"` y sin `parent_id`. Cuando un agente crea un equipo, se crea como org independiente tipo `family`, no como sub-equipo de su agencia.

## Opciones

### Opcion A — Pasar contexto al mutation (recomendada)

Modificar `createGroupMutation` para que acepte un parámetro opcional `parentOrgId`. Cuando se pasa (caso agente), insertar con `type: "sub_team"` y `parent_id = parentOrgId`. Cuando no se pasa (caso usuario), mantener `type: "family"`.

En `GroupsModal`, al llamar a `createGroup`, pasar `agencyOrg.id` como `parentOrgId` cuando `isAgent = true`.

En el query del hook, además de buscar orgs donde el usuario es miembro, también traer orgs con `parent_id` apuntando a la `agencyOrg` (sub-equipos de la agencia).

**Cambios**: `useGroups.ts` (mutation + query), `GroupsModal.tsx` (pasar parentOrgId).

**Pros**: Usa `parent_id` que ya existe en la tabla. Semántica correcta. El trigger `trg_validate_sub_teams` ya valida máximo 5 sub-equipos.

**Contras**: Requiere agregar `sub_team` al enum `org_type` en la DB (migración).

### Opcion B — Mismo type "family" pero con parent_id

No tocar el enum. Insertar con `type: "family"` pero con `parent_id = agencyOrg.id`. Filtrar en el query por `parent_id` para agruparlos bajo la agencia.

**Cambios**: `useGroups.ts` (mutation + query), `GroupsModal.tsx` (pasar parentOrgId).

**Pros**: Sin migración de enum. Más simple.

**Contras**: Semánticamente confuso — un "family" con parent de agency_team no tiene sentido. Puede generar bugs futuros.

### Opcion C — Reusar type "agency_team" con parent_id

Insertar sub-equipos como `type: "agency_team"` con `parent_id`. Distinguir org principal (parent_id = null) de sub-equipo (parent_id != null).

**Cambios**: `useGroups.ts` (mutation + query).

**Pros**: Sin migración de enum.

**Contras**: Ambiguo — mismo type para org principal y sub-equipo.

## Recomendacion

**Opcion A**. Es la más limpia. Solo requiere una migración para agregar `sub_team` al enum `org_type`, y ajustar el mutation y query en `useGroups.ts`. El trigger de validación de máximo 5 sub-equipos ya funciona con `parent_id`.

### Archivos a tocar

```
supabase/migrations/  → ALTER TYPE org_type ADD VALUE 'sub_team'
src/hooks/useGroups.ts → mutation acepta parentOrgId, query trae sub-equipos
src/components/GroupsModal.tsx → pasa agencyOrg.id al crear cuando isAgent
```

