-- Insertar configuraciones por defecto para la importación masiva en app_settings
INSERT INTO app_settings (key, value, description)
VALUES (
  'scraper_prompt_import',
  'Sos un experto en extracción de fichas inmobiliarias masivas para agencias de Uruguay y Argentina.
Instrucciones estrictas para esta importación por lotes:
- DISPONIBILIDAD (CRÍTICO): Si detectás que la propiedad ya no está disponible (ej: el sitio dice "vivienda ya vendida", "propiedad reservada", "señalada" o mensajes de error como "Ups, la propiedad ya fue señalada" comunes en ACSA), debés retornar isUnavailable: true.
- CALIDAD TOTAL: Extraé todos los detalles técnicos posibles de este aviso si está disponible.
- TIPO DE OPERACIÓN: Clasificá con precisión entre "sale" (venta) o "rent" (alquiler). Es CRÍTICO para el marketplace.
- PRECIO Y MONEDA: Extraé el precio principal y los gastos comunes por separado. Detectá la moneda (USD, UYU o ARS).
- BARRIO Y UBICACIÓN: Extraé solo el barrio o zona (ej: Pocitos, Palermo, Nordelta). NUNCA repitas la ciudad en el campo barrio.
- AMBIENTES: Traducí a ambientes totales ( dormitorios + 1 ). Monoambiente = 1.
- DATOS DE CONTACTO: Buscá nombres de agentes o inmobiliarias y teléfonos de contacto en el texto.
- RESUMEN: Hacé un resumen comercial atractivo de 2 oraciones.
- Si un dato no existe, devolvé "" o 0. No inventes información.',
  'Prompt especializado para el procesamiento de lotes de importación masiva desde webs de agencias.'
),
(
  'scraper_unavailable_tokens',
  'ya fue señalada, Ups!, propiedad ya fue, no disponible, señalada, reservada',
  'Lista de palabras clave separadas por comas que disparan el descarte automático por no disponibilidad.'
),
(
  'scraper_exclude_urls',
  '/propiedad/nada, /propiedad/alq, /propiedad/ven, /login, /registro, /mi-cuenta',
  'Patrones de URL separados por comas que el sistema debe ignorar durante el descubrimiento de propiedades.'
)
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, 
    description = EXCLUDED.description;
