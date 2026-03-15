

# Solución definitiva: Columna `is_personal` en `organizations`

## El problema raíz

El trigger `handle_new_user_profile` crea una organización automática por cada usuario nuevo. Esto es **necesario** porque toda la arquitectura RLS depende de `org_id` (listings, comments, reviews, etc.). Sin esa org, el usuario no puede hacer nada.

Pero mostrarla como "grupo" en la UI es incorrecto. No es un grupo que el usuario creó conscientemente.

## La solución senior: `is_personal` flag

Agregar una columna `is_personal BOOLEAN DEFAULT false` a `organizations`. La org auto-creada se marca como `true`. La UI la filtra.

### Por qué es la mejor opción

1. **No rompe nada**: RLS sigue funcionando, listings siguen teniendo org_id, cascades intactos
2. **Semántica clara**: Distingue org técnica (personal workspace) de grupos reales creados por el usuario
3. **Un solo cambio de esquema** + un ajuste al trigger + un filtro en el frontend
4. **Escalable**: Si mañana querés mostrar "Mi espacio personal" como sección separada, ya tenés la data

### Cambios concretos

**1. Migración SQL** (3 statements):
- `ALTER TABLE organizations ADD COLUMN is_personal BOOLEAN NOT NULL DEFAULT false`
- `UPDATE organizations SET is_personal = true` para las orgs existentes donde el usuario es owner y la org tiene tipo `family` y solo 1 miembro (el creador)
- Modificar el trigger `handle_new_user_profile` para que haga `INSERT INTO organizations (..., is_personal) VALUES (..., true)` cuando crea la org automática para usuarios tipo `user`

**2. Frontend** — `useGroups.ts`:
- Agregar `.eq("is_personal", false)` al query de organizaciones, o filtrar en el map. Así la org personal nunca aparece en "Mis Grupos"

**3. Frontend** — `usePropertyQueries.ts` / `usePropertyMutations.ts`:
- No cambia nada. Siguen usando `org_id` de `user_listings` que viene por RLS. La org personal sigue siendo la org por defecto para guardar propiedades.

**4. Frontend** — `AddPropertyModal` y cualquier lugar que necesite el `org_id` por defecto:
- Crear un helper o query que obtenga la org personal del usuario (`is_personal = true`) para usarla como default al agregar propiedades sin grupo activo.

### Resumen de archivos tocados

```text
supabase/migrations/  → Nueva migración (ALTER + UPDATE + ALTER FUNCTION)
src/hooks/useGroups.ts → Filtrar is_personal = false
```

No se toca RLS, no se tocan policies, no se rompe el flujo de registro. Cambio limpio y definitivo.

