

## Plan: Corregir 2 problemas

### 1. Build error en `AdminEstadisticas.tsx` (línea 28-32)

La migración que centralizó el status en `profiles` rompió esta query. La columna `status` ya no existe en `agencies`.

**Fix**: Cambiar la query para contar agencias pendientes desde `profiles` en vez de `agencies`:
- Reemplazar `supabase.from("agencies").select("id, status")` por una query a `profiles` con join a `user_roles` donde `role = 'agency'` y `status = 'pending'`.

### 2. Scraping siempre marca "alquiler"

El código en el edge function ya tiene `listingType` en el schema y en la respuesta, y `AddPropertyModal` ya lo lee. El problema es que:

1. El **FALLBACK_PROMPT** no menciona que debe detectar si es venta o alquiler — solo habla de moneda, barrio y resumen.
2. La edge function probablemente **no está deployada** con los últimos cambios.

**Fix**:
- Actualizar el `FALLBACK_PROMPT` para incluir instrucción explícita de detectar si el aviso es venta o alquiler.
- Re-deployar la edge function `scrape-property`.

### Archivos a modificar
1. `src/components/admin/AdminEstadisticas.tsx` — query de pendingAgencies desde profiles
2. `supabase/functions/scrape-property/index.ts` — mejorar FALLBACK_PROMPT
3. Deploy de la edge function

