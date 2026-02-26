

## Plan: Crear tablas en la nueva BD de Supabase

### Problema
La nueva BD de Supabase está vacía. El archivo `types.ts` generado tiene las tablas vacías (`[_ in never]: never`), lo que causa todos los errores de TypeScript.

### Solución
Crear una migración consolidada que incluya todo el esquema de la BD original (15 migraciones) en una sola migración nueva. Esto va a:

1. Crear el enum `property_status` con todos los valores
2. Crear las 3 tablas: `properties`, `property_comments`, `property_shares`
3. Configurar todas las políticas RLS
4. Crear las funciones helper (`has_property_access`, `has_property_permission`, `can_view_property`, `update_updated_at_column`)
5. Crear el bucket de storage `property-images`
6. Habilitar Realtime
7. Crear el índice único en URL

### Detalle técnico

Se creará un archivo de migración nuevo que consolida las 15 migraciones existentes en una sola. Después de aplicarla, los tipos de Supabase se regenerarán automáticamente y todos los errores de build se resolverán.

**Archivo a crear:**
- `supabase/migrations/20260226000000_consolidated_schema.sql` - Migración consolidada con todo el esquema

**Archivo a actualizar:**
- `src/integrations/supabase/types.ts` - Se regenerará automáticamente con las definiciones de las 3 tablas

Las 15 migraciones anteriores se eliminarán para evitar conflictos con la nueva BD.

