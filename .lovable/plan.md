

# Plan: Marketplace + Mi Listado

## Resumen

Transformar HomeFinder en una app con dos secciones principales:

1. **Marketplace** (pantalla de inicio): Catálogo publico de propiedades publicadas por agencias aprobadas. Cualquier usuario puede explorar y "guardar" propiedades en su listado personal.

2. **Mi Listado** (pantalla privada): Donde el usuario gestiona sus propiedades guardadas (del marketplace o ingresadas manualmente), con todo el sistema de seguimiento actual (estados, comentarios, grupos familiares).

---

## Flujo del usuario

```text
┌─────────────────────────────────────────┐
│           MARKETPLACE (Home)            │
│  Propiedades publicadas por agencias    │
│  [Guardar en mi listado] por propiedad  │
│                                         │
│  Tab: Marketplace | Mi Listado          │
└──────────────┬──────────────────────────┘
               │ click "Mi Listado"
               ▼
┌─────────────────────────────────────────┐
│           MI LISTADO (privado)          │
│  - Propiedades guardadas del marketplace│
│  - Propiedades ingresadas manualmente   │
│  - Seguimiento de estados              │
│  - Comentarios, grupos familiares      │
│  - Botón + para agregar nueva          │
└─────────────────────────────────────────┘
```

---

## Cambios por área

### 1. Base de datos (migración SQL)

- **Nueva tabla `marketplace_properties`**: Propiedades publicadas por agencias.
  - `id`, `agency_id`, `title`, `price_rent`, `price_expenses`, `total_cost`, `currency`, `neighborhood`, `sq_meters`, `rooms`, `images`, `description`, `url`, `status` (active/paused/sold), `created_at`, `updated_at`
  
- **Nuevo campo en `properties`**: `source_marketplace_id` (nullable, FK a `marketplace_properties`)
  - Permite saber si una propiedad del listado personal vino del marketplace
  - Permite sincronizar cambios de precio/fotos de la publicacion original

- **Politicas RLS**:
  - `marketplace_properties`: lectura publica para todos los usuarios autenticados, escritura solo para miembros de la agencia dueña
  - `properties` existente: sin cambios

### 2. Navegacion (Index.tsx)

- Agregar tabs "Marketplace" y "Mi Listado" en la parte superior usando el componente Tabs existente
- El tab activo por defecto es "Marketplace"
- El contenido actual de Index.tsx pasa a ser el tab "Mi Listado"

### 3. Nuevos componentes

- **`MarketplaceView.tsx`**: Grilla de propiedades de agencias con filtros por barrio, precio, ambientes. Cada card tiene boton "Guardar en mi listado".
- **`MarketplaceCard.tsx`**: Card similar a PropertyCard pero simplificada (sin selector de estado, con boton de guardar y badge de agencia).

### 4. Hooks nuevos

- **`useMarketplaceProperties.ts`**: Query de `marketplace_properties` con join a `agencies` para mostrar nombre de agencia. Filtros de busqueda.
- **`useSaveToList.ts`**: Mutacion que copia una propiedad del marketplace a la tabla `properties` del usuario, con `source_marketplace_id` seteado.

### 5. Panel del agente (AgentDashboard.tsx)

- Conectar el boton "Publicar propiedad" para insertar en `marketplace_properties`
- Formulario similar al AddPropertyModal pero insertando en la tabla del marketplace
- Listar propiedades publicadas por la agencia con opciones de editar/pausar/eliminar

### 6. Indicador visual de origen

- En "Mi Listado", las propiedades que vienen del marketplace muestran un badge "De agencia: [nombre]"
- En PropertyDetailModal, mostrar la agencia de origen si aplica

---

## Detalle tecnico de archivos

| Archivo | Accion |
|---------|--------|
| `supabase/migrations/xxx_marketplace.sql` | Crear tabla `marketplace_properties`, agregar `source_marketplace_id` a `properties`, RLS |
| `src/integrations/supabase/types.ts` | Se regenera automaticamente |
| `src/pages/Index.tsx` | Agregar Tabs (Marketplace / Mi Listado), mover contenido actual a tab Mi Listado |
| `src/components/MarketplaceView.tsx` | **Nuevo** - Vista de propiedades de agencias |
| `src/components/MarketplaceCard.tsx` | **Nuevo** - Card de propiedad del marketplace |
| `src/hooks/useMarketplaceProperties.ts` | **Nuevo** - Hook para leer marketplace_properties |
| `src/hooks/useSaveToList.ts` | **Nuevo** - Hook para guardar propiedad del marketplace en listado personal |
| `src/pages/AgentDashboard.tsx` | Agregar formulario y listado de propiedades publicadas |
| `src/components/PropertyCard.tsx` | Badge "De agencia" si tiene source_marketplace_id |
| `src/components/PropertyDetailModal.tsx` | Mostrar info de agencia origen |
| `src/types/property.ts` | Agregar `sourceMarketplaceId` y tipo `MarketplaceProperty` |

---

## Orden de implementacion

1. Migracion SQL (tabla + columna + RLS)
2. Tipos y hooks del marketplace
3. MarketplaceCard y MarketplaceView
4. Integrar tabs en Index.tsx
5. Panel del agente: publicar propiedades
6. Guardar del marketplace al listado personal
7. Indicadores visuales de origen

