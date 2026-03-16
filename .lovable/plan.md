

## Diagnóstico

Hay **dos problemas** que causan que el grupo se cree pero no aparezca:

### 1. Error silencioso en la inserción de membresía (useGroups.ts, línea 121-125)

```typescript
await supabase.from("organization_members").insert({
  org_id: data.id,
  user_id: user.id,
  role: "owner" as any,
});
```

El resultado del `insert` no se captura ni se valida. Si falla (y falla, ver punto 2), el código sigue adelante y muestra el toast de éxito.

### 2. RLS bloquea la inserción como "owner"

La política INSERT de `organization_members` es:

```sql
WITH CHECK (
  (user_id = auth.uid()) AND (role = 'member') AND (is_system_delegate = false)
)
```

Solo permite `role = 'member'`. El insert con `role: "owner"` viola RLS silenciosamente (retorna error, pero nadie lo lee).

### 3. Query filtra grupos personales

La query principal filtra con `.eq("is_personal", false)`, pero los grupos family nuevos se crean sin especificar `is_personal`, por lo que toman el default `false`. Esto no es problema actualmente, pero vale verificar que no cambie.

---

## Plan de corrección

### A. Migración SQL: permitir auto-asignarse como "owner" al crear org

Modificar la política INSERT de `organization_members` para permitir que el creador de la organización se inserte como `owner`:

```sql
DROP POLICY "Users can join orgs" ON public.organization_members;

CREATE POLICY "Users can join orgs" ON public.organization_members
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND is_system_delegate = false
  AND (
    role = 'member'
    OR (role = 'owner' AND EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = org_id AND created_by = auth.uid()
    ))
  )
);
```

Esto permite `owner` solo si el usuario es el `created_by` de la organización.

### B. useGroups.ts: validar error de membresía

Cambiar líneas 121-125 para capturar y lanzar el error:

```typescript
const { error: memberError } = await supabase
  .from("organization_members")
  .insert({
    org_id: data.id,
    user_id: user.id,
    role: "owner" as any,
  });

if (memberError) {
  // Limpiar la org huérfana
  await supabase.from("organizations").delete().eq("id", data.id);
  throw new Error("No se pudo crear la membresía del grupo.");
}
```

Si la membresía falla, se borra la organización recién creada y se lanza error, evitando el toast de éxito.

---

Son dos cambios: una migración SQL y una edición en `useGroups.ts`.

