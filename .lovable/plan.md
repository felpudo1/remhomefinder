

# Plan: Backup de BD + Validación de persistencia multi-usuario

## Diagnóstico

La BD ya está 100% alineada con el frontend. No se requieren migraciones.

La arquitectura ya soporta **múltiples usuarios** calificando la misma publicación porque:
- Cada usuario tiene su propio `user_listing` (con `source_publication_id` apuntando a la `agent_publication`)
- Cada cambio de estado genera un registro **independiente** en `status_history_log` con su propio `event_metadata`
- La vista `agent_deserter_insights` ya agrega datos de descarte por publicación
- No hay conflictos: N usuarios pueden calificar la misma propiedad y cada feedback queda en su propio log

## Lo que se hará (2 pasos)

### Paso 1: Backup de 8 tablas críticas a CSV

Exportar a `/mnt/documents/backup-2026-03-20/`:
- `user_listings` (18 registros)
- `status_history_log` (50 registros)
- `properties`
- `profiles`
- `organizations`
- `organization_members`
- `attribute_scores`
- `family_comments`

Usando `psql` con las variables de entorno ya configuradas. Formato CSV con headers.

### Paso 2: Verificar que el fix de PropertyCard está deployado

El fix ya está aplicado localmente (líneas 706-726 pasan `closingFeedback`). Solo necesita deploy (que ocurre automáticamente al hacer cambios en Lovable).

**No hay SQL que ejecutar. No hay migraciones. No hay cambios de RLS.**

## Detalle técnico: Flujo multi-usuario

```text
Usuario A (familia 1)          Usuario B (familia 2)
    │                               │
    ▼                               ▼
user_listing (org_id=familia1)  user_listing (org_id=familia2)
source_publication_id ──────┐   source_publication_id ──────┐
                            ▼                               ▼
                    agent_publication (propiedad X)
                            │
    ┌───────────────────────┼───────────────────────┐
    ▼                       ▼                       ▼
status_history_log      status_history_log      status_history_log
(familia 1, contactado) (familia 2, descartado) (familia 1, firme_candidato)
event_metadata: {       event_metadata: {       event_metadata: {
  contacted_name,         reason,                 close_price_score,
  contacted_interest,     discarded_survey...     close_condition_score...
  contacted_urgency                             }
}                       }
```

Cada familia tiene su propio historial independiente. El agente puede agregar todos los logs por `source_publication_id` para ver insights globales.

## Riesgos

Ninguno. Solo lectura (backup) + deploy de fix ya aplicado.

