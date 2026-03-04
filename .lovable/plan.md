

## Plan: Agregar `marketplace_status` a properties

Tu enfoque es el correcto y es la mejor opción. No hay una alternativa más "pro" — separar el estado del marketplace del estado personal del usuario es exactamente el patrón adecuado. El usuario mantiene su flujo (ingresado → contactado → coordinado → visitado) y además ve si el agente marcó la propiedad como vendida/reservada/alquilada.

### Paso 1 — Migración SQL

- Agregar columna `marketplace_status` (tipo `marketplace_property_status`, default `'active'`, nullable) a `properties`.
- Actualizar el trigger `sync_marketplace_to_properties` para que también sincronice `marketplace_status = NEW.status`.
- Backfill: actualizar las filas existentes que tengan `source_marketplace_id` con el status actual del marketplace.

### Paso 2 — Tipos TypeScript

- Agregar `marketplaceStatus` al tipo `Property` en `src/types/property.ts`.
- Actualizar el mapper `mapDbToProperty` en `src/lib/mappers/propertyMappers.ts` para incluir el nuevo campo.

### Paso 3 — UI en PropertyCard

- Reutilizar el mismo `STATUS_OVERLAY_CONFIG` del `MarketplaceCard` (reservada, vendida, alquilada).
- Pasar un `statusOverlay` al `PropertyCardBase` cuando `marketplaceStatus` sea `reserved`, `sold` o `rented`.
- El overlay se muestra encima de la foto, idéntico al marketplace.

### Archivos a modificar

1. Nueva migración SQL (1 archivo)
2. `src/types/property.ts` — agregar campo
3. `src/lib/mappers/propertyMappers.ts` — mapear campo
4. `src/components/PropertyCard.tsx` — mostrar overlay

