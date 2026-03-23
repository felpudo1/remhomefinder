# Migración manual de estados (referencia)

Scripts de **apoyo** para ejecutar en el Dashboard cuando no usás la CLI. El flujo normal del proyecto es **`supabase/migrations/`** + `supabase db push`.

Ver `migrate-estados.sql` en esta misma carpeta.

## Opción 1: Supabase SQL Editor (si no tenés link)

1. Entrá a [Supabase Dashboard](https://supabase.com/dashboard)
2. Elegí tu proyecto
3. **SQL Editor** → **New query**
4. Pegá el contenido de [`migrate-estados.sql`](./migrate-estados.sql)
5. **Run**

## Opción 2: CLI (si tenés el proyecto linkeado)

```bash
pnpm db:push
```

O directamente:

```bash
supabase db push
```

## Realtime: tablas para actualización en vivo

Para que los estados de las tarjetas se actualicen sin refrescar, agregá `user_listings` a la publicación:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_listings;
```
