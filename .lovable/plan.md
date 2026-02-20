

## Plan: Sistema de Permisos para Compartir Propiedades

### Resumen
Implementar un sistema donde el usuario logueado pueda compartir el acceso a sus propiedades con otros usuarios registrados, con distintos niveles de permiso (ver, comentar, editar, completo).

---

### Paso 1: Crear tabla `property_shares`

```sql
CREATE TABLE public.property_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  shared_with_id UUID NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, shared_with_id)
);

ALTER TABLE public.property_shares ENABLE ROW LEVEL SECURITY;
```

**Nota:** No se usa FK a `auth.users` para seguir las buenas practicas de Supabase. Se valida por logica de aplicacion.

Permisos posibles: `'view'`, `'comment'`, `'edit'`, `'full'`

---

### Paso 2: Funcion SECURITY DEFINER para evitar recursion RLS

```sql
CREATE OR REPLACE FUNCTION public.has_property_access(
  _property_user_id UUID, 
  _accessing_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM property_shares
    WHERE owner_id = _property_user_id
      AND shared_with_id = _accessing_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_property_permission(
  _property_user_id UUID, 
  _accessing_user_id UUID,
  _permissions TEXT[]
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM property_shares
    WHERE owner_id = _property_user_id
      AND shared_with_id = _accessing_user_id
      AND permission = ANY(_permissions)
  );
$$;
```

---

### Paso 3: RLS en `property_shares`

- **SELECT**: El owner ve sus shares + el invitado ve los shares donde esta invitado
- **INSERT/DELETE**: Solo el owner puede crear/revocar shares

---

### Paso 4: Actualizar RLS de `properties`

Reemplazar las policies existentes:

- **SELECT**: `user_id = auth.uid() OR has_property_access(user_id, auth.uid())`
- **UPDATE**: `user_id = auth.uid() OR has_property_permission(user_id, auth.uid(), ARRAY['edit','full'])`
- **INSERT**: Se mantiene solo para el propio usuario
- **DELETE**: Se mantiene solo para el propio usuario

---

### Paso 5: Actualizar RLS de `property_comments`

- **SELECT**: Incluir acceso compartido
- **INSERT**: Permitir comentar si tiene permiso `'comment'`, `'edit'` o `'full'`

---

### Paso 6: Frontend - Hook `usePropertyShares`

Nuevo hook en `src/hooks/usePropertyShares.ts`:
- `getShares()`: listar usuarios con acceso
- `addShare(email, permission)`: buscar usuario por email y crear share
- `removeShare(shareId)`: revocar acceso
- `updateSharePermission(shareId, permission)`: cambiar nivel de permiso

Para buscar usuarios por email, se necesitara una edge function que use el service role key (ya que no se puede consultar `auth.users` desde el cliente).

---

### Paso 7: Edge Function `find-user-by-email`

Edge function que recibe un email y devuelve el `user_id` si existe en `auth.users`. Usa el service role key para la consulta.

---

### Paso 8: Frontend - Modal `ShareSettingsModal`

Nuevo componente `src/components/ShareSettingsModal.tsx`:
- Input para buscar usuario por email
- Selector de nivel de permiso (view/comment/edit/full)
- Lista de usuarios con acceso actual con opcion de revocar
- Boton para agregar

---

### Paso 9: Integrar boton "Compartir" en la UI

Agregar un boton en el navbar (al lado del usuario) o en un menu de settings que abra el `ShareSettingsModal`.

---

### Secuencia de implementacion

1. Migracion DB: tabla + funciones + RLS (pasos 1-5)
2. Edge function para buscar usuario por email (paso 7)
3. Hook `usePropertyShares` (paso 6)
4. Componente `ShareSettingsModal` (paso 8)
5. Integrar en `Index.tsx` (paso 9)

---

### Seccion Tecnica

**Archivos nuevos:**
- `supabase/migrations/` - Migracion con tabla, funciones y policies
- `supabase/functions/find-user-by-email/index.ts` - Edge function
- `src/hooks/usePropertyShares.ts` - Hook CRUD de shares
- `src/components/ShareSettingsModal.tsx` - Modal de compartir

**Archivos modificados:**
- `src/pages/Index.tsx` - Agregar boton compartir y modal
- `src/integrations/supabase/types.ts` - Se actualiza automaticamente

**Ventaja clave:** El hook `useProperties` NO necesita cambios. Las RLS se encargan de filtrar automaticamente las propiedades compartidas junto con las propias.

