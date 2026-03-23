

## Plan: Migración SQL para jerarquía geográfica + Fix build errors

### Mi opinión sobre esta estructura

**PROS:**
- Estructura limpia y profesional: País → Departamento → Ciudad → Barrio es el estándar geográfico correcto
- No hay datos reales guardados, asi que la migración es limpia sin riesgo de pérdida de datos
- `department_id` en `properties` como nullable + campo texto `department` mantiene compatibilidad con el scraper actual (no hay que tocarlo ahora)
- Seed de Uruguay + Argentina prepara el sistema para expansión regional
- `ON DELETE SET NULL` en `cities.department_id` es seguro: no rompe datos existentes si se borra un departamento
- RLS coherente con el resto del sistema (lectura pública, escritura admin)

**CONTRAS / RIESGOS:**
- Eliminar `cities.country` es destructivo e irreversible. Si hay ciudades cargadas con `country = 'Uruguay'`, esa info se pierde. Recomiendo: **no dropear** la columna ahora, solo deprecarla. Agregar `department_id` y dejar `country` como legacy hasta confirmar que todo funciona
- La tabla `cities` actualmente actúa como "departamentos" en el frontend (`AdminGeografia.tsx` la llama "Departamentos"). Agregar una tabla `departments` real va a generar confusión hasta que se actualice el frontend
- `user_search_profiles.city_id` apunta a `cities` (que hoy son departamentos). Después de esta migración, habrá que decidir si ese FK debería apuntar a `departments` en su lugar
- Sin cambios en el frontend, el panel admin seguirá mostrando `cities` como "Departamentos" — inconsistencia temporal

**RECOMENDACION:** Hacer la migración pero **NO dropear** `cities.country`. Solo agregar `department_id`. Es más seguro y reversible.

---

### Fase 1 — Fix build errors (MarketplaceView.tsx)

**Archivo:** `src/components/MarketplaceView.tsx`

1. Agregar import de `supabase` desde `@/integrations/supabase/client`
2. Línea 136: cambiar `profile.neighborhood_ids` por `searchProfile.neighborhood_ids`
3. Línea 140: cambiar `profile.neighborhood_ids` por `searchProfile.neighborhood_ids`

Esto desbloquea el deploy en Vercel inmediatamente.

### Fase 2 — Migración SQL

**Archivo:** `supabase/migrations/20260323120000_add_departments_geo_hierarchy.sql`

Contenido:

1. **Crear tabla `departments`** con `id`, `name`, `country` (default 'UY'), `created_at`
2. **Habilitar RLS** + policies: SELECT para `public`, INSERT/UPDATE/DELETE solo admins
3. **Índice** en `(country, LOWER(name))` para búsquedas y unicidad
4. **Agregar `department_id`** a `cities` como FK nullable a `departments(id) ON DELETE SET NULL`
5. **NO dropear `cities.country`** — se deja como legacy por seguridad
6. **Agregar `department` (text)** y **`department_id` (uuid FK)** a `properties`
7. **Seed Uruguay:** 19 departamentos con `country = 'UY'`
8. **Seed Argentina:** 24 provincias con `country = 'AR'`

Todo con `IF NOT EXISTS` donde sea posible para idempotencia.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/MarketplaceView.tsx` | Fix 2 build errors (import supabase + searchProfile ref) |
| `supabase/migrations/20260323120000_...sql` | Crear migración completa |

### Qué NO se toca

- Scraper / edge functions
- AdminGeografia.tsx (se actualizará en una fase posterior)
- Formularios de propiedades
- user_search_profiles (se evaluará después)

