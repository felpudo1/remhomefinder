

## Plan: Corregir error 401 en `scrape-property`

### Problema

La Edge Function `scrape-property` retorna **401 Unauthorized** porque el gateway de Supabase valida el JWT antes de que el código de la función lo procese. La función usa decodificación manual de JWT (patrón `atob`), pero no tiene `verify_jwt = false` en `supabase/config.toml`.

Otras funciones con el mismo patrón (`get-system-metrics`, `discover-agency-links`) ya tienen esta configuración.

### Solución

**Archivo a modificar:** `supabase/config.toml`

Agregar:
```toml
[functions.scrape-property]
verify_jwt = false
```

Esto permite que el gateway deje pasar la request y la función maneje la autenticación internamente (como ya lo hace con `getUserIdFromAuthHeader`).

### Alcance

- Un solo archivo modificado: `supabase/config.toml`
- Sin cambios en código frontend ni en la lógica de la función
- Sin cambios en base de datos

### Archivos con errores de build preexistentes

Los errores de build listados en `AddPropertyModal.tsx`, `DuplicateAlertDialog.tsx`, `ScraperInput.tsx`, `PublishPropertyModal.tsx`, `usePropertyExtractor.ts`, `duplicateCheck.ts` y los tests son **preexistentes** y no están relacionados con este fix. Siguiendo REGLA 1, no los toco sin tu aprobación.

El error de `mp-create-preference` (`npm:mercadopago`) también es preexistente.

