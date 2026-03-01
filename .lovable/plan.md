
# Soporte para Compra/Venta de Inmuebles

## Resumen
Agregar un campo `listing_type` ("alquiler" o "venta") en todo el sistema para que tanto usuarios como agencias puedan gestionar propiedades en alquiler y en venta.

## Cambios en Base de Datos

1. **Crear enum `listing_type`** con valores `rent` y `sale`
2. **Agregar columna `listing_type`** a la tabla `properties` (default `rent`, not null)
3. **Agregar columna `listing_type`** a la tabla `marketplace_properties` (default `rent`, not null)

## Cambios en el Modelo de Datos

**`src/types/property.ts`**:
- Agregar tipo `ListingType = "rent" | "sale"`
- Agregar campo `listingType` a `Property` y `MarketplaceProperty`

## Cambios en la UI - Tarjeta Base

**`src/components/ui/PropertyCardBase.tsx`**:
- Recibir prop `listingType`
- Si es `sale`: mostrar el precio como precio de venta (sin "/mes", sin desglose alquiler+expensas)
- Si es `rent`: mantener el formato actual (alquiler + expensas /mes)

## Cambios en Formularios

**`src/components/AddPropertyModal.tsx`** (usuarios):
- Agregar selector "Alquiler" / "Venta" al inicio del formulario
- Si es venta: el campo "Alquiler" cambia a "Precio de venta" y se oculta "G/C (Expensas)"
- Pasar `listingType` al callback `onAdd`

**`src/components/PublishPropertyModal.tsx`** (agencias):
- Mismo selector "Alquiler" / "Venta"
- Misma logica de campos condicionales
- Insertar `listing_type` en `marketplace_properties`

## Cambios en Hooks

**`src/hooks/useProperties.ts`**:
- Mapear `listing_type` de la DB al campo `listingType` del modelo
- Incluir `listing_type` en los inserts

**`src/hooks/useMarketplaceProperties.ts`**:
- Mapear `listing_type` al modelo `MarketplaceProperty`

**`src/hooks/useSaveToList.ts`**:
- Propagar `listing_type` del marketplace property al insert en `properties`

## Cambios en Filtros

**`src/components/MarketplaceFilterSidebar.tsx`**:
- Agregar filtro "Tipo" con botones "Alquiler" / "Venta" / "Todos"

**`src/components/MarketplaceView.tsx`**:
- Agregar estado y logica de filtrado por `listingType`

**`src/components/FilterSidebar.tsx`** (Mi Listado):
- Agregar el mismo filtro de tipo

## Cambios en Tarjetas

**`src/components/PropertyCard.tsx`** y **`src/components/MarketplaceCard.tsx`**:
- Pasar `listingType` a `PropertyCardBase`

## Cambios en el Dashboard de Agencia

**`src/pages/AgentDashboard.tsx`**:
- Mostrar el tipo (Alquiler/Venta) en cada tarjeta publicada

---

### Seccion Tecnica - Migracion SQL

```sql
CREATE TYPE public.listing_type AS ENUM ('rent', 'sale');

ALTER TABLE public.properties 
  ADD COLUMN listing_type listing_type NOT NULL DEFAULT 'rent';

ALTER TABLE public.marketplace_properties 
  ADD COLUMN listing_type listing_type NOT NULL DEFAULT 'rent';
```

Todas las propiedades existentes quedaran como `rent` por defecto, sin romper nada.
