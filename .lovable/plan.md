

## Revisión de Integridad Referencial

### Ya aplicado (migración anterior)

Las siguientes FKs **ya fueron creadas** en la migración `20260315061717`:

- `user_roles(user_id)` -> `profiles(user_id)` ON DELETE CASCADE
- `properties(created_by)` -> `profiles(user_id)` ON DELETE CASCADE
- `agency_comments(user_id)` -> `profiles(user_id)` ON DELETE CASCADE
- `family_comments(user_id)` -> `profiles(user_id)` ON DELETE CASCADE
- `status_history_log(changed_by)` -> `profiles(user_id)` ON DELETE CASCADE
- Plus: `organization_members`, `user_listings`, `agent_publications`, `property_reviews`, `partner_leads`, `profiles.referred_by_id`

### Faltante detectado

| Tabla | Columna | Estado |
|-------|---------|--------|
| `app_settings` | `updated_by` | **Sin FK** — no fue incluida en la migración anterior |

### Plan

1. **Nueva migración**: Agregar la FK faltante `app_settings(updated_by) -> profiles(user_id) ON DELETE SET NULL` (SET NULL porque `updated_by` es nullable y no tiene sentido borrar configuraciones del sistema si se elimina un admin).

2. **Regenerar types.ts**: Después de aplicar la migración, actualizar `src/integrations/supabase/types.ts` para reflejar las relaciones (el archivo se regenera automáticamente desde la API de Supabase).

### Notas

- Las demás tablas que mencionás ya están cubiertas.
- `app_settings.updated_by` usa SET NULL en vez de CASCADE porque son configuraciones globales del sistema que no deben desaparecer si se elimina un perfil de admin.

