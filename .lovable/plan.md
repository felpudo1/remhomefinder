

## Objetivo
Permitirte pegar la URL de un índice (ej. `ciu.org.uy/nuestros-socios`), que el sistema scrapee automáticamente todas las inmobiliarias listadas (nombre, dirección, departamento, teléfono, web, email) y las precargue en una tabla revisable antes de insertar en `external_agencies`.

## Hallazgo clave
La página de CIU ya devuelve las 430 agencias en el HTML completo (no necesita seguir paginación). Confirmado al hacer fetch: vienen todas, con el formato estándar `### NOMBRE / dirección, depto / tel / web / email`. El "100 por página" es filtro visual JS.

Para sitios futuros que sí tengan paginación real o subíndices, el plan contempla un modo "crawl" opcional.

## Diseño UX (en `AdminDirectorio.tsx`, pestaña Directorio)

Agregar un bloque nuevo arriba del listado: **"Importar desde índice web"**

```text
┌─────────────────────────────────────────────────┐
│ Importar agencias desde índice web              │
│ ┌─────────────────────────────────┐ ┌────────┐ │
│ │ https://ciu.org.uy/nuestros-... │ │Analizar│ │
│ └─────────────────────────────────┘ └────────┘ │
│ ☐ Recorrer subpáginas (crawl)  Máx páginas:[5]│
└─────────────────────────────────────────────────┘
        ↓ (tras analizar)
┌─────────────────────────────────────────────────┐
│ 430 agencias detectadas                         │
│ [Seleccionar todas] [Filtrar duplicadas]        │
│ ☑ A Y C NEGOCIOS  Canelones  web ✓ tel ✓       │
│ ☑ A. MEIKLE       Canelones  web ✓ tel ✓       │
│ ☐ ABACOS (ya existe)  ←gris                    │
│ ...                                             │
│ [Importar 387 seleccionadas]                    │
└─────────────────────────────────────────────────┘
```

## Arquitectura técnica

**1. Edge Function nueva: `scrape-agency-directory`**
- Input: `{ url, crawl?: boolean, maxPages?: number }`
- Auth: solo admins (validar `has_role` con JWT)
- Estrategia:
  - **Modo simple (default)**: Firecrawl `/scrape` con format `markdown` → parsea con regex el bloque `### NOMBRE\n\ndirección, depto\n\ntel web email`
  - **Modo crawl (opcional)**: Firecrawl `/crawl` con `limit=maxPages`, recorre links que matcheen el dominio
- Detecta departamento por la última palabra antes del salto (lista cerrada de los 19 deptos UY)
- Devuelve array `[{name, address, department_name, phone, website_url, email, _matched_department_id}]`
- Usa la Firecrawl key ya configurada (`FIRECRAWL_API_KEY`)

**2. Ampliar tabla `external_agencies`** (migración)
Agregar columnas opcionales para enriquecer el directorio:
- `address text default ''`
- `phone text default ''`
- `email text default ''`
- `imported_from text` (URL origen, para auditoría)

**3. UI en `AdminDirectorio.tsx`**
- Nuevo state: `importUrl`, `crawlMode`, `parsedAgencies`, `selectedIds`
- Llama edge function → muestra tabla preview con checkboxes
- Marca duplicados comparando `name` normalizado contra agencias ya cargadas
- Botón "Importar seleccionadas" → bulk insert en `external_agencies` con `onConflict: name`

## Flujo concreto con CIU
1. Pegás `https://ciu.org.uy/nuestros-socios/` → Analizar
2. Edge function scrapea (1 sola request, ~3s) → devuelve 430 entradas parseadas
3. Ves tabla con todas, podés deseleccionar las que no quieras
4. Importar → quedan en `external_agencies`, visibles automáticamente en el directorio público

## Para casos futuros con paginación real
El modo crawl maneja sitios tipo `?page=1`, `?page=2`. Para índices con subpáginas (cada agencia en su propia URL), se puede iterar links del índice y scrapear cada uno — ya soportado por Firecrawl crawl.

## Archivos a tocar
- `supabase/functions/scrape-agency-directory/index.ts` — nueva edge function
- `supabase/config.toml` — registrar la function
- Migración SQL — agregar columnas a `external_agencies`
- `src/components/admin/AdminDirectorio.tsx` — UI de import + preview
- `src/components/directory/AgenciesDirectoryPanel.tsx` — mostrar address/phone/email si vienen cargados

## Costos / límites
- Firecrawl: 1 scrape simple = 1 crédito. CIU completo = 1 crédito.
- Modo crawl: 1 crédito por página visitada (configurable, default 5 máx).

