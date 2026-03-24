

# Plan: Agregar campos contact_name y contact_phone a user listings

## Resumen
Agregar campos de contacto (nombre y teléfono) en `user_listings` para que las familias tengan una agenda integrada. Los datos se intentan autocompletar desde scraping/fotos y se pueden editar manualmente.

## 1. Migración SQL

Agregar 3 columnas nullable a `user_listings`:
```sql
ALTER TABLE public.user_listings
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_source text;

COMMENT ON COLUMN public.user_listings.contact_name IS 'Nombre del contacto del aviso (manual, scrape o imagen)';
COMMENT ON COLUMN public.user_listings.contact_phone IS 'Teléfono del contacto del aviso';
COMMENT ON COLUMN public.user_listings.contact_source IS 'Origen del dato: manual | scrape | image_ocr | mixed';
```

## 2. Edge Functions - Agregar extracción de contacto

**`scrape-property/index.ts`** y **`extract-from-image/index.ts`**: Agregar `contactName` y `contactPhone` al tool schema de Gemini en las 3 funciones de extracción (`extractWithAI`, `extractWithVision`, y el schema de `extract-from-image`).

```
contactName: { type: "string", description: "Nombre de la persona o inmobiliaria de contacto. Vacío si no se detecta." }
contactPhone: { type: "string", description: "Teléfono de contacto. Vacío si no se detecta." }
```

## 3. Frontend - Tipos y modelos

**`src/types/property.ts`**: Agregar al interface `Property`:
```ts
contactName?: string;
contactPhone?: string;
contactSource?: "manual" | "scrape" | "image_ocr" | "mixed";
```

**`src/hooks/usePropertyExtractor.ts`**: Agregar `contactName` y `contactPhone` a `PropertyData` type y mapearlos desde la respuesta de scrape/image.

## 4. Hook de formulario

**`src/hooks/useAddPropertyForm.ts`**: Agregar `contactName` y `contactPhone` a `FormState`, incluir en `resetForm` y `updateForm`.

## 5. Mutaciones (escritura)

**`src/hooks/usePropertyMutations.ts`**: En `addPropertyMutation`, aceptar `contactName`, `contactPhone`, `contactSource` y pasarlos al insert de `user_listings`.

## 6. Queries (lectura)

**`src/hooks/usePropertyQueries.ts`**: En ambos bloques de mapeo (con y sin property join), leer `listing.contact_name`, `listing.contact_phone`, `listing.contact_source` y mapearlos a las propiedades del modelo UI.

**`src/lib/mappers/propertyMappers.ts`**: Agregar campos de contacto a `mapListingToProperty`.

## 7. Formulario UI (Add Property)

**`src/components/add-property/PropertyFormManual.tsx`**: Agregar 2 inputs (Nombre de contacto, Teléfono de contacto) entre "Referencia" y "Detalles". Se prellenan automáticamente si la extracción IA los detecta.

**`src/components/AddPropertyModal.tsx`**: Pasar `contactName`, `contactPhone` y calcular `contactSource` en `handleSubmit`.

## 8. Detalle UI (Property Detail)

**`src/components/PropertyDetailModal.tsx`**: Agregar sección de contacto debajo de la ubicación:
- Icono de usuario + nombre (o "Sin contacto cargado")
- Icono teléfono + número (o "Sin teléfono")
- Botón WhatsApp (usa `buildWhatsAppUrl` existente)
- Botón copiar número
- Badge pequeño de origen (Manual/Scraping/Fotos/Mixto) -- opcional

## Archivos tocados (resumen)

| Archivo | Cambio |
|---|---|
| `supabase/migrations/XXXX_add_contact_fields.sql` | 3 columnas nuevas |
| `supabase/functions/scrape-property/index.ts` | contactName/Phone en schema IA |
| `supabase/functions/extract-from-image/index.ts` | contactName/Phone en schema IA |
| `src/types/property.ts` | 3 campos nuevos en Property |
| `src/hooks/usePropertyExtractor.ts` | Mapear contacto desde respuesta |
| `src/hooks/useAddPropertyForm.ts` | FormState + reset |
| `src/hooks/usePropertyMutations.ts` | Persistir contacto en insert |
| `src/hooks/usePropertyQueries.ts` | Leer contacto del listing |
| `src/lib/mappers/propertyMappers.ts` | Mapear contacto |
| `src/components/add-property/PropertyFormManual.tsx` | 2 inputs nuevos |
| `src/components/AddPropertyModal.tsx` | Pasar contacto al submit |
| `src/components/PropertyDetailModal.tsx` | Mostrar contacto + WhatsApp |

## No se toca
- Flujos de agencias/marketplace
- Tabla `properties`
- Lógica de estados
- Paquetes nuevos

