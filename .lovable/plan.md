

## Diagnóstico: Burst Balance estancado en 0%

### Por qué no se recupera

El Burst Balance de AWS (gp2/gp3) se recupera a una **tasa fija baseline** que depende del tamaño del volumen. En instancias pequeñas (como las de Supabase), esa tasa es muy baja (~3 IOPS por GB). Si el consumo de I/O **nunca baja por debajo de esa baseline**, el balance nunca sube.

Causas actuales de I/O constante incluso con el escudo activo:
1. **Pool de conexiones interno de Supabase** (17 conexiones idle): heartbeats y maintenance del motor Postgres.
2. **Tu polling cada 60s**: la Edge Function `get-system-metrics` hace INSERT en `system_metrics_history` + SELECT del historial + fetch de métricas Prometheus.
3. **Cleanup probabilístico (10%)**: DELETE de registros antiguos cuando se activa.
4. **El panel de sesiones activas** si lo dejás abierto.

### Plan de acción

#### Paso 1 — Verificar si la métrica es real o un falso 0%
Agr