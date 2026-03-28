

## Problema identificado

La tabla `system_metrics_history` tiene el valor real `disk_io_budget = 35.328` del `2026-03-28 02:55:18`. Sin embargo, la Edge Function tiene un `fallbackMaxAgeMs = 2h` que descarta cualquier muestra más vieja de 2 horas. Como la métrica en vivo de Prometheus lleva horas devolviendo `null`, y la última muestra tiene ~6 horas, el sistema la rechaza y muestra "N/D".

El Burst Balance real es **~35%** (zona amarilla de precaución), NO 0%.

## Plan de corrección

### Paso 1 — Extender el fallback histórico a 48h (Edge Function)

En `supabase/functions/get-system-metrics/index.ts`, línea 488:

Cambiar `fallbackMaxAgeMs` de `2 * 60 * 60 * 1000` (2h) a `48 * 60 * 60 * 1000` (48h), que coincide con la ventana de historial que ya se consulta. Si hay un dato en las últimas 48h, usarlo como fallback.

Agregar al log la edad en minutos del dato usado para transparencia.

### Paso 2 — Hacer configurable el fallback desde system_config

Leer una key `history_fallback_max_hours` de `system_config` (default 48). Así el sysadmin puede ajustarlo desde el panel sin redesplegar.

### Paso 3 — Mostrar la edad del dato en el gauge (Frontend)

En `DiskIoGauge.tsx`, cuando `source === "history"`, mostrar hace cuánto tiempo fue la última muestra (ej: "Dato de hace 6h 12min") para que el sysadmin sepa qué tan fresco es.

### Paso 4 — Redesplegar la Edge Function

## Resultado esperado

Con el dato de las 02:55 (35.328%), el gauge mostrará **35%** en amarillo con badge "Dato histórico" y la hora de la muestra, en vez de "N/D".

