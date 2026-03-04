

## Análisis: Eliminación física (DELETE) de propiedades desde el admin

**Respuesta corta: No es complicado.** La base de datos ya tiene foreign keys con `ON DELETE CASCADE` en `property_comments` (referencia a `property_id`). Solo hay que manejar un caso especial.

### Cascada de datos al borrar una property

| Tabla | Relación | Solución |
|-------|----------|----------|
| `property_comments` | FK `property_id` → `properties.id` | CASCADE automático (ya configurado) |
| `properties` con `source_marketplace_id` | Referencia lógica, no FK | No afecta — borrar la property del user no toca el marketplace |

**No hay que tocar `marketplace_properties`**. El admin borra la copia del usuario, no la publicación del agente. El `source_marketplace_id` es solo una referencia lógica (no FK con cascade inverso).

### Plan de implementación

1. **Migración SQL**: Agregar política RLS para que admins puedan hacer `DELETE` en `properties` (actualmente solo el owner puede).

2. **UI en `AdminPublicaciones.tsx`**:
   - Agregar botón de eliminar (ícono Trash2) en cada fila.
   - Al hacer click, abrir un `AlertDialog` de confirmación.
   - Al confirmar, ejecutar `supabase.from("properties").delete().eq("id", id)` — los comentarios se borran en cascada automáticamente.
   - Actualizar la lista local tras el delete.

### Archivos a modificar
- Nueva migración SQL (1 política RLS)
- `src/components/admin/AdminPublicaciones.tsx` (botón + diálogo + lógica delete)

