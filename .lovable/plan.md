

## Plan: Corregir errores de build y habilitar borrado físico de publicaciones de agentes

### Problema actual
Hay errores de compilación porque `property_ratings` no está en el archivo auto-generado `types.ts`. TypeScript no reconoce esa tabla. No podemos editar `types.ts` directamente (es auto-generado).

Además, ya existe una política RLS que permite a agentes borrar sus propias publicaciones del marketplace, y otra para admins. El borrado físico ya debería funcionar desde el panel admin (la política "Admins can delete any marketplace property" NO existe aún pero sí existe "Agency members can delete marketplace properties"). Solo falta agregar la política de admin.

### Solución

**Paso 1: Corregir los 3 archivos con errores de TypeScript**

Castear `.from("property_ratings" as any)` en los 3 archivos afectados para que TypeScript no se queje:

- **`src/hooks/usePropertyRating.ts`** (líneas 22-23 y 62): agregar `as any` al `.from()`
- **`src/components/admin/AdminPublicaciones.tsx`** (línea 165): agregar `as any` al `.from()` y castear `ratingsData` como `any[]`
- **`src/components/agent/AgentEstadisticas.tsx`** (línea 81): agregar `as any` al `.from()` y castear `allRatingsData` como `any[]`

**Paso 2: Migración SQL para política de borrado admin**

Agregar la política RLS que permite a admins borrar publicaciones del marketplace:

```sql
DROP POLICY IF EXISTS "Admins can delete any marketplace property" ON public.marketplace_properties;
CREATE POLICY "Admins can delete any marketplace property"
ON public.marketplace_properties FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

El trigger `trg_sync_marketplace_delete` ya existe en la base de datos (la función `sync_marketplace_delete_to_properties` está listada), así que al borrar físicamente una publicación de agente, las copias de usuarios se marcarán automáticamente como `eliminado_agencia`.

### Resultado
- Los errores de build se corrigen
- El admin puede borrar publicaciones de agentes igual que borra avisos de usuarios
- Las copias de usuarios se actualizan automáticamente a "Aviso Finalizado"

