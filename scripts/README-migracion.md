# Cómo ejecutar la migración de estados

## Opción 1: Supabase SQL Editor (recomendado si no tenés link)

1. Entrá a [Supabase Dashboard](https://supabase.com/dashboard)
2. Elegí tu proyecto
3. **SQL Editor** → **New query**
4. Pegá el contenido de `migrate-estados.sql`
5. **Run**

## Opción 2: CLI (si tenés el proyecto linkeado)

```bash
pnpm db:push
```

O directamente:

```bash
supabase db push
```
