# 📋 RemHomeFinder — Changelog y Documentación Técnica

> **Proyecto:** RemHomeFinder  
> **Período documentado:** Sesiones de desarrollo Feb–Mar 2026  
> **Stack:** React + TypeScript + Supabase + Vite + TailwindCSS  

---

## 🗂️ Índice

1. [Arquitectura general](#arquitectura-general)
2. [Base de datos — Cambios de schema](#base-de-datos--cambios-de-schema)
3. [Autenticación y usuarios](#autenticación-y-usuarios)
4. [Panel de administración](#panel-de-administración)
5. [Agentes y agencias](#agentes-y-agencias)
6. [Publicaciones del marketplace](#publicaciones-del-marketplace)
7. [Listado personal del usuario](#listado-personal-del-usuario)
8. [IA — Scraping de propiedades](#ia--scraping-de-propiedades)
9. [UI / UX — Cambios visuales](#ui--ux--cambios-visuales)
10. [Pendientes y próximos pasos](#pendientes-y-próximos-pasos)
11. [Correcciones realizadas en Lovable (Mar 2026)](#correcciones-realizadas-en-lovable-mar-2026)

---

## 🏗️ Arquitectura general

### Estructura de tablas principales

```
profiles           → datos del usuario + status (active/pending/suspended/rejected)
agencies           → datos de la agencia/agente (sin columna status — dropada)
properties         → listado personal del usuario
marketplace_properties → publicaciones de agentes (HFMarket)
app_settings       → configuración global (prompts IA, email soporte, etc.)
```

### Flujo de estado de usuario

```
Registro usuario/agente
  ↓
profiles.status = "pending"   (agentes) / "active" (usuarios normales)
  ↓
Admin aprueba desde /admin/usuarios
  ↓
profiles.status = "active"
  ↓
Usuario puede operar normalmente
```

### Jerarquía de componentes de tarjetas

```
PropertyCard          → tarjeta del listado personal (lógica + estado + acciones)
  └── PropertyCardBase   → UI visual reutilizable (imagen, precio, metros)

MarketplaceCard       → tarjeta del HFMarket
  └── PropertyCardBase   → mismo componente base
```

---

## 🗄️ Base de datos — Cambios de schema

### ✅ Eliminación de `agencies.status`

**Problema:** la columna `status` existía duplicada en `agencies` y en `profiles`.  
**Solución:** se dropó `agencies.status` y se centralizó el estado en `profiles.status`.

```sql
-- Políticas RLS que dependían de agencies.status fueron dropeadas y recreadas
-- usando profiles.status en su lugar.
ALTER TABLE agencies DROP COLUMN status CASCADE;
```

**Archivos afectados:**
- `src/integrations/supabase/types.ts` — se eliminó `status` del tipo `agencies`
- `src/components/admin/AdminAgencias.tsx` — ya no lee `agency.status`
- `src/components/agent/AgentProfile.tsx` — eliminado del interface `Agency`

---

### ✅ Nueva columna `properties.marketplace_status`

**Problema:** cuando un agente cambia el estado de una propiedad en el marketplace (pausada, reservada, vendida), el user que la tiene guardada no se entera.  
**Solución:** se agregó `marketplace_status` en `properties` para guardar el estado del agente sin pisar el estado personal del user.

```sql
ALTER TABLE properties 
ADD COLUMN marketplace_status marketplace_property_status NULL;
```

**Pendiente:** trigger SQL para sincronizar automáticamente cuando el agente actualiza `marketplace_properties`.

```sql
-- PENDIENTE: crear este trigger en Supabase
CREATE OR REPLACE FUNCTION sync_marketplace_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE properties
  SET marketplace_status = NEW.status
  WHERE source_marketplace_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_marketplace_status_change
AFTER UPDATE OF status ON marketplace_properties
FOR EACH ROW EXECUTE FUNCTION sync_marketplace_status();
```

---

## 🔐 Autenticación y usuarios

### ✅ Estado por defecto de nuevos agentes: `pending`

**Archivo:** `src/hooks/useAuth.ts`  
**Función:** `signUp`

**Antes:** los agentes se registraban con `status: 'active'` por defecto (valor del trigger de BD).  
**Después:** al registrar un agente, el upsert explícitamente setea `status: 'pending'`.

```typescript
// useAuth.ts — registro de agente
await supabase.from("profiles").upsert({
  id: user.id,
  email: user.email,
  role: "agent",
  status: "pending",   // ← explícito para garantizar revisión admin
});
```

**Impacto:** los agentes no pueden operar hasta que un admin los apruebe desde `/admin/usuarios`.

---

### ✅ Centralización del status en `profiles`

- Eliminado manejo de `agency.status` de todos los componentes
- El único source of truth es `profiles.status`
- Hook `useProfile` centraliza el fetch del perfil del usuario
- Componentes actualizados: `AdminAgencias`, `AgentProfile`, `AgentProperties`, `Index.tsx`, `AgentDashboard`

---

## 🛡️ Panel de administración

### ✅ `/admin/agentes` — Rediseño sin manejo de estado

**Antes:** `AdminAgencias.tsx` tenía un dropdown para cambiar el estado del agente.  
**Después:** solo muestra información del agente (logo, descripción, propiedades publicadas, teléfonos). El estado se maneja únicamente desde `/admin/usuarios`.

**Campos que muestra ahora:**
- Logo de la agencia
- Descripción
- Email de contacto
- Teléfonos separados
- Cantidad de propiedades publicadas

### ✅ `/admin/publicaciones` — Nueva sección

**Archivo:** `src/components/admin/AdminPublicaciones.tsx` (nuevo)  
**Acceso:** `/admin` → tab "Publicaciones"  
Muestra todas las propiedades guardadas por usuarios en el sistema.

---

## 🏢 Agentes y agencias

### ✅ `PublishPropertyModal` — Modal de publicación

#### Moneda por defecto según tipo de operación

```typescript
// useEffect que reacciona al cambio de listingType
useEffect(() => {
  if (!propertyToEdit) {
    setForm(prev => ({
      ...prev,
      currency: listingType === "sale" ? "USD" : "UYU",
    }));
  }
}, [listingType, propertyToEdit]);
```

| Tipo | Moneda default |
|------|---------------|
| Alquiler | `UYU` ($ Pesos) |
| Venta | `USD` (U$S Dólares) |

#### Opciones de moneda simplificadas

**Antes:** `ARS` (Pesos Argentinos) y `USD`  
**Después:** `UYU` ($ Pesos) y `USD` (U$S Dólares)

#### Detección automática de tipo de operación (IA)

```typescript
// Después del setForm, se aplica el listingType de la IA
if (d.listingType === "sale" || d.listingType === "rent") {
  setListingType(d.listingType);
}
```

---

## 🏠 Publicaciones del marketplace

### ✅ Badge Venta/Alquiler en `MarketplaceCard`

Se agregó el badge en `subImageContent` alineado a la derecha.

```tsx
subImageContent={
  <div className="px-4 pt-2 flex items-center justify-end">
    <span className={`... ${property.listingType === "sale"
      ? "bg-accent/15 text-accent-foreground"
      : "bg-primary/10 text-primary"
    }`}>
      {property.listingType === "sale" ? "Venta" : "Alquiler"}
    </span>
  </div>
}
```

### ✅ Overlay de estado del agente en `PropertyCard`

Cuando `property.marketplaceStatus` es `reserved`, `sold` o `rented`, aparece un badge visual sobre la foto de la propiedad en el listado personal del user.

```typescript
const MARKETPLACE_STATUS_OVERLAY = {
  reserved: { label: "Reservada", className: "bg-blue-600/90 text-white" },
  sold:     { label: "Vendida",   className: "bg-slate-900/90 text-white" },
  rented:   { label: "Alquilada", className: "bg-purple-600/90 text-white" },
};
```

---

## 🤖 IA — Scraping de propiedades

### ✅ Detección de Venta/Alquiler en Edge Function

**Archivo:** `supabase/functions/scrape-property/index.ts`

**Problema:** el prompt le pedía a la IA que devuelva `listingType`, pero el schema de `function_calling` tenía `additionalProperties: false` sin incluir ese campo, lo que impedía a la IA retornarlo.

**Solución:** se agregó `listingType` al schema del tool:

```typescript
// Schema del function calling — ANTES faltaba este campo
listingType: {
  type: "string",
  enum: ["sale", "rent"],
  description: "Tipo de operación: 'sale' para venta, 'rent' para alquiler"
},

// required actualizado
required: ["title", "listingType", "neighborhood", "aiSummary"]

// Respuesta de la Edge Function
data: {
  listingType: extracted.listingType || "rent",
  // ...resto de campos
}
```

**⚠️ Requiere redespliegue de la Edge Function en Supabase para tomar efecto.**

### ✅ Prompts actualizados

Se actualizaron `DEFAULT_PROMPT_USER` y `DEFAULT_PROMPT_AGENT` en `AdminPrompt.tsx` con:

1. **TIPO DE OPERACIÓN** como prioridad máxima con palabras clave explícitas:
   - VENTA: "venta", "en venta", "se vende", "precio de venta", "compra"
   - ALQUILER: "alquiler", "se alquila", "arriendo", "renta"
2. Hint para dudas: ventas tienen precios altos en USD sin cuota mensual
3. Precio diferenciado: alquiler (mensual + G.C.) vs venta (total en priceRent)
4. Superficie: prioriza cubiertos sobre totales
5. Resumen: siempre menciona si es venta o alquiler

### ✅ `AddPropertyModal` — Fix para usuarios

```typescript
// Se agregó este bloque después del setForm en handleScrape
if (d.listingType === "sale" || d.listingType === "rent") {
  setListingType(d.listingType);
}
```

### ✅ `PublishPropertyModal` — Fix para agentes (mismo fix)

```typescript
// Idem en PublishPropertyModal.tsx
if (d.listingType === "sale" || d.listingType === "rent") {
  setListingType(d.listingType);
}
```

---

## 🎨 UI / UX — Cambios visuales

### ✅ "Expensas" → "Gastos comunes"

Cambio de terminología en toda la app:

| Archivo | Línea |
|---------|-------|
| `PropertyCardBase.tsx` | Label de expenses |
| `PublishPropertyModal.tsx` | Label del input |
| `PropertyDetailModal.tsx` | Detalle de precio |
| `AdminPrompt.tsx` | Prompt de IA |

### ✅ Buscador movido del Header al panel de Filtros

**Antes:** el buscador estaba en `UserHeader` (top navbar).  
**Después:** el buscador vive en `FilterSidebar`, arriba del contador de resultados.

**Archivos modificados:**
- `UserHeader.tsx` — eliminados props `searchQuery` y `setSearchQuery`, eliminado bloque del input
- `FilterSidebar.tsx` — agregados props `searchQuery` y `onSearchChange`, nuevo input con ícono
- `Index.tsx` — props redirigidas de `UserHeader` a `FilterSidebar`

### ✅ Botón "Compartir en familia"

**Antes:** botón icónico pequeño sin texto.  
**Después:** botón con texto visible en todos los tamaños.

```tsx
<Button variant={activeGroupId ? "default" : "outline"} size="sm" className="h-9 px-3 gap-2 rounded-xl">
  <Users className="w-4 h-4" />
  <span>Compartir en familia</span>
</Button>
```

### ✅ Badge Venta/Alquiler en listado personal

**Posición:** debajo de la imagen, alineado a la derecha, en la misma línea que "Ingresado por XX".  
**Tamaño:** `text-xs` (2 puntos más grande que antes).  
**Layout:** `justify-between` en el contenedor.

```tsx
<div className="px-4 pt-2 flex items-center justify-between gap-2">
  {/* Ingresado por... o De agencia (izquierda) */}
  <span className="...">Ingresado por {ownerEmail}</span>
  {/* Badge tipo operación (derecha) */}
  <span className={`... text-xs font-semibold ...`}>
    {property.listingType === "sale" ? "Venta" : "Alquiler"}
  </span>
</div>
```

### ✅ Estado read-only en `PropertyDetailModal`

**Antes:** el modal tenía un `<Select>` para cambiar el estado.  
**Después:** el estado se muestra como badge de solo lectura. Solo se puede cambiar desde la tarjeta.

```tsx
<div className="flex items-center gap-2">
  <span className="text-xs font-semibold">Estado</span>
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${config.bg} ${config.color}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
    {config.label}
  </span>
</div>
```

### ✅ Mensaje de bienvenida agentes (`AgentWelcome`)

- Texto cambiado a: *"Te notificaremos apenas tu cuenta sea activada."*
- Movido: entre el párrafo introductorio y las tarjetas de features
- Tamaño aumentado para mayor visibilidad

### ✅ Grid responsive en `Index.tsx`

```tsx
// Antes
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

// Después
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
```

El botón de filtros mobile también cambió de `md:hidden` a `lg:hidden`.

---

## ⏳ Pendientes y próximos pasos

### 🔴 Crítico — Edge Function sin redesplegar

Los cambios de `scrape-property/index.ts` (schema `listingType`) **no están activos** hasta redesplegar la función en Supabase.

```bash
supabase functions deploy scrape-property --project-ref kgoynhisjssxvulgrsaf
```

### 🟡 Trigger SQL de sincronización marketplace → listado

Sin este trigger, `properties.marketplace_status` siempre viene en `null` aunque el agente cambie estado.

Ver script completo en sección [Base de datos — marketplace_status](#nueva-columna-propertiesmarketplace_status).

### 🟡 Verificar query de `properties` incluye `marketplace_status`

El select de propiedades en `useProperties` o `Index.tsx` debe incluir la columna nueva:

```typescript
// Verificar que no filtre la columna
supabase.from("properties").select("*, marketplace_status")
```

### 🟢 Borrar ENUM `agency_status` de la BD

Luego de dropear `agencies.status`, el tipo ENUM `agency_status` quedó huérfano en Supabase.

```sql
DROP TYPE IF EXISTS agency_status;
```

### 🟢 Backend status enforcement

El frontend controla el acceso según `profiles.status`, pero un usuario con token activo podría evadir la validación. Se recomienda agregar validación servidor en Supabase Edge Functions o RLS adicional.

---

## 🔧 Correcciones realizadas en Lovable (Mar 2026)

En marzo de 2026 se realizaron correcciones en [Lovable](https://lovable.dev) por fallos detectados en el código. Esta sección documenta cada fallo y su solución.

**Formato de cada entrada:**

- **Problema:** descripción del fallo (error en consola, comportamiento incorrecto, tipo TypeScript, etc.).
- **Solución:** qué se cambió en Lovable (archivo/componente y cambio concreto).
- **Archivos afectados:** rutas o nombres de componentes, si aplica.

*(Pendiente: listar aquí cada fallo y su corrección cuando JP proporcione el detalle.)*

### Ejemplo de entrada (plantilla)

```markdown
### [Título breve del fallo]

**Problema:** Descripción del fallo.
**Solución:** Qué se cambió en Lovable.
**Archivos afectados:** `src/...`
```

---

## 📁 Mapa de archivos principales

```
src/
├── components/
│   ├── AddPropertyModal.tsx         → modal ingreso propiedad (usuario)
│   ├── FilterSidebar.tsx            → panel filtros + buscador
│   ├── MarketplaceCard.tsx          → tarjeta HFMarket + badge venta/alquiler
│   ├── PropertyCard.tsx             → tarjeta listado personal + overlay marketplace
│   ├── PropertyDetailModal.tsx      → modal detalle (estado read-only)
│   ├── PublishPropertyModal.tsx     → modal publicación agente
│   ├── UserHeader.tsx               → navbar (sin buscador)
│   ├── admin/
│   │   ├── AdminAgencias.tsx        → datos agentes (sin status management)
│   │   ├── AdminPrompt.tsx          → editor prompts IA
│   │   ├── AdminPublicaciones.tsx   → listado global publicaciones (admin)
│   │   └── AdminUsuarios.tsx        → gestión status usuarios
│   ├── agent/
│   │   ├── AgentProfile.tsx         → perfil agente (sin agency.status)
│   │   └── AgentWelcome.tsx         → pantalla bienvenida agente pendiente
│   └── ui/
│       └── PropertyCardBase.tsx     → base visual reutilizable
├── hooks/
│   ├── useAuth.ts                   → registro: agentes parten como "pending"
│   └── useProfile.ts                → fetch centralizado del perfil
├── pages/
│   ├── Admin.tsx                    → panel admin con sección "publicaciones"
│   └── Index.tsx                    → dashboard usuario + filtros
├── types/
│   └── property.ts                  → tipos: marketplaceStatus agregado
└── integrations/supabase/
    └── types.ts                     → types generados: marketplace_status en properties

supabase/
└── functions/
    └── scrape-property/
        └── index.ts                 → Edge Function IA con listingType en schema
```

---

*Documentación generada: 2026-03-04 — RemHomeFinder*
