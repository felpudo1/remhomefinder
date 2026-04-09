

## Plan: Importación desde Excel/CSV en AgencyMassImporter

### Resumen
Agregar una pestaña "Desde Archivo" al modal de importación masiva existente que permita subir Excel (.xlsx/.xls/.csv), parsear URLs client-side con `xlsx`, y alimentar el mismo flujo de selección + scraping existente.

### Cambios

#### 1. Instalar dependencia
- `xlsx` (SheetJS) — parseo de Excel/CSV client-side. Sin `pdfjs-dist`.

#### 2. Modificar `AgencyMassImporter.tsx`

**Nuevo estado y UI:**
- Agregar estado `importMode: "web" | "file"` para alternar entre las dos pestañas usando `Tabs` de shadcn
- Tab "Desde Web" = flujo actual (discover-agency-links), sin cambios
- Tab "Desde Archivo":
  - Input `type="file"` con `accept=".xlsx,.xls,.csv"`
  - Al seleccionar archivo, parsear con `xlsx` y extraer URLs con regex
  - Mostrar preview: cantidad de URLs encontradas y listado scrolleable
  - Botón "Continuar" que crea un `agency_discovery_task` con status `selecting` e inserta URLs en `discovered_links`

**Lógica de parseo (código exacto):**
```typescript
const workbook = XLSX.read(arrayBuffer, { type: "array" });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const urlRegex = /https?:\/\/[^\s"',<>]+/gi;
let rawUrls: string[] = [];

rows.forEach((row: any[]) => {
  row.forEach(cell => {
    const match = String(cell).match(urlRegex);
    if (match) rawUrls.push(...match);
  });
});

// Deduplicación local + limpieza
const uniqueCleanUrls = [...new Set(rawUrls.map(url => url.trim()))];
```

**Inserción en BD (Bulk Insert estricto):**
```typescript
// 1. Crear task
const { data: newTask } = await supabase
  .from("agency_discovery_tasks")
  .insert({ org_id: orgId, domain_url: fileName, status: "selecting",
            total_links: uniqueCleanUrls.length, created_by: userId })
  .select("id").single();

// 2. Bulk Insert — un solo .insert() con array completo
const { error } = await supabase
  .from("discovered_links")
  .insert(uniqueCleanUrls.map(url => ({ task_id: newTask.id, url })));
```

Luego se pasa al mismo paso 2 de selección existente (cargando links desde BD).

### Alcance
- **1 dependencia nueva**: `xlsx`
- **1 archivo modificado**: `AgencyMassImporter.tsx`
- **0 migraciones** — reutiliza tablas existentes
- **0 Edge Functions nuevas** — reutiliza `process-import-batch`

### Restricciones técnicas aplicadas
- Sin PDF / `pdfjs-dist`
- Deduplicación con `Set` + `.trim()` antes de insertar
- Un único Bulk Insert a `discovered_links` (sin bucle `for`)

