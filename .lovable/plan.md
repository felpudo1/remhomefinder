## Plan: Extracción de datos de propiedad desde imágenes (capturas de RRSS)

### Concepto

El usuario sube una captura de pantalla de una publicación de RRSS (IG, FB Marketplace, etc.) y la IA (Gemini con capacidad multimodal) analiza la imagen para extraer los datos de la propiedad. Luego se muestra el formulario manual pre-llenado con los datos detectados, permitiendo al usuario agregar hasta 2 fotos reales de la propiedad.

### Flujo de usuario

1. En el modal "Agregar Propiedad" (paso `url`), el usuario hace click en **"Ingresar imágenes para analizar (IG, FB)"** (botón que ya existe visualmente en la captura).
2. Se abre un nuevo paso `"image-upload"` donde puede subir 1 captura de pantalla del aviso.
3. La imagen se sube a Supabase Storage (`property-images`) y se envía a una nueva Edge Function.
4. La Edge Function usa **Gemini 2.5 Flash** (multimodal, ya disponible via `LOVABLE_API_KEY`) para analizar la imagen y extraer: título, precio, barrio, m², ambientes, tipo de operación, resumen.
5. Se devuelven los datos y se pre-llena el formulario manual. En caso que no esten los datos, ya sea superficie o  cantidad de dormitorios o barrio o precio, esos datos se deja en blanco con la opcion que el user lo modifique
6. En el formulario manual se muestra una sección destacada para **"Agregar fotos de la propiedad"** (hasta 3 fotos, subidas desde el dispositivo o por URL), ya que la IA no puede extraer fotos de la propiedad desde una captura.

### Implementación

**1. Nueva Edge Function: `supabase/functions/extract-from-image/index.ts**`

- Recibe `{ imageUrl: string, role: string }`
- Carga el prompt desde `app_settings` (reutiliza `getPromptFromDb`)
- Llama a Gemini con la imagen como `image_url` en el mensaje + tool calling (mismo schema `extract_property_data`)
- Retorna los datos estructurados

**2. Modificar `AddPropertyModal.tsx**`

- Agregar nuevo paso `"image-upload"` entre `url` y `manual`
- Botón "Ingresar imágenes para analizar" en el paso `url` lleva a `image-upload`
- En `image-upload`: input de archivo para la captura, preview, botón "Analizar con IA"
- Al recibir resultados, pre-llena el form y pasa al paso `manual`
- En el paso `manual`, cuando se viene de imagen, mostrar nota: "Agregá fotos reales de la propiedad"

**3. Archivos a crear/modificar**

- `supabase/functions/extract-from-image/index.ts` (nueva)
- `src/components/AddPropertyModal.tsx` (nuevo step + lógica)

### Viabilidad

- Gemini 2.5 Flash soporta imágenes nativamente (multimodal) via la misma API gateway
- `LOVABLE_API_KEY` ya está configurado
- El bucket `property-images` ya existe para subir las capturas
- No se necesitan nuevas dependencias ni connectors