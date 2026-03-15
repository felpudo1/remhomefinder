

## Plan: Corregir vulnerabilidades críticas de seguridad RLS

### Problema 1: Escalación de privilegios en `organization_members`

La policy actual de INSERT es:

```sql
WITH CHECK (user_id = auth.uid())
```

Esto permite que cualquier usuario autenticado se inserte en **cualquier organización** eligiendo el `role` que quiera (`owner`) y `is_system_delegate = true`.

**Solución:** Reemplazar la policy de INSERT con una más restrictiva:

```sql
DROP POLICY "Users can join orgs" ON public.organization_members;

CREATE POLICY "Users can join orgs"
ON public.organization_members
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'member'
  AND is_system_delegate = false
);
```

Esto garantiza que:
- Solo pueden insertarse a sí mismos (ya existía)
- **Solo con rol `member`** (no `owner` ni `agent`)
- **Sin flag `is_system_delegate`**
- Los roles `owner` y `system_delegate` solo se asignan via triggers del servidor o por admins (que tienen su propia policy ALL)

---

### Problema 2: Datos sensibles expuestos en `profiles`

La policy actual:

```sql
Policy: "Users can view all profiles"
USING (true)  -- Expone email y teléfono de TODOS
```

**Solución:** Reemplazar con una policy que solo permita ver:
1. Su propio perfil completo
2. Perfiles de miembros de sus mismas organizaciones
3. Admins ven todo (ya tienen policy separada)

```sql
DROP POLICY "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own or org profiles"
ON public.profiles
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.organization_members om1
    WHERE om1.user_id = auth.uid()
      AND om1.org_id IN (
        SELECT om2.org_id FROM public.organization_members om2
        WHERE om2.user_id = profiles.user_id
      )
  )
);
```

Esto usa `organization_members` (no `profiles`) en el subquery, evitando recursión infinita de RLS. Los usuarios solo ven perfiles de gente en sus mismas organizaciones.

---

### Resumen de cambios

Una sola migración SQL con 4 statements:
1. DROP policy INSERT permisiva de `organization_members`
2. CREATE policy INSERT restrictiva (solo `member`, sin `is_system_delegate`)
3. DROP policy SELECT permisiva de `profiles`
4. CREATE policy SELECT restrictiva (propio perfil + misma org)

No hay cambios en el frontend. Todo es backend/RLS.

