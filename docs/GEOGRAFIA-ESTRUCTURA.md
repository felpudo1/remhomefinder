# Estructura Geográfica — Guía completa

> Documento de referencia para entender la jerarquía geográfica del sistema y cómo cargar datos.

**Última actualización:** Marzo 2026  
**Seed script disponible:** `20260323080000_seed_geografia_uruguay.sql`  
**Triggers disponibles:** `20260323090000_triggers_sincronizacion_ubicacion.sql`  
**Cobertura actual:** 55+ ciudades, 230+ barrios de Uruguay

---

## 1. Jerarquía de 4 niveles

```
País (implícito en `departments.country`)
  └── Departamento / Provincia  →  tabla `departments`
        └── Ciudad / Localidad  →  tabla `cities`
              └── Barrio / Zona  →  tabla `neighborhoods`
```

### Ejemplo real

```
Uruguay (country = 'UY')
  └── Montevideo (department)
        └── Montevideo (city)
              ├── Pocitos (neighborhood)
              ├── Cordón (neighborhood)
              └── Punta Carretas (neighborhood)
        └── Ciudad de la Costa (city)  ← si se considera parte del depto
  └── Canelones (department)
        └── Las Piedras (city)
              └── Centro (neighborhood)
```

---

## 2. Tablas y relaciones

### `departments`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | Auto-generado |
| `name` | text | Nombre del departamento/provincia |
| `country` | text | Código de país: `'UY'`, `'AR'`, etc. Default: `'UY'` |
| `created_at` | timestamptz | Auto |

**Datos pre-cargados (seed):**
- 🇺🇾 Uruguay: 19 departamentos (Montevideo, Canelones, Maldonado, Colonia, etc.)
- 🇦🇷 Argentina: 24 provincias (Buenos Aires, CABA, Córdoba, etc.)

### `cities`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | Auto-generado |
| `name` | text | Nombre de la ciudad/localidad |
| `department_id` | uuid (FK → departments.id) | **Obligatorio en la práctica** — vincula la ciudad a su departamento |
| `country` | text | **LEGACY — no usar.** Existe por compatibilidad, será removido. Usar `department_id` |
| `created_at` | timestamptz | Auto |

### `neighborhoods`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | Auto-generado |
| `name` | text | Nombre del barrio/zona |
| `city_id` | uuid (FK → cities.id) | **Obligatorio en la práctica** — vincula el barrio a su ciudad |
| `created_at` | timestamptz | Auto |

### Diagrama de FKs

```
departments.id  ←──  cities.department_id
cities.id       ←──  neighborhoods.city_id
```

---

## 3. Cómo se usan en `properties`

La tabla `properties` tiene **campos duales**: texto plano + FK normalizada.

| Campo texto (scraper) | Campo FK (normalizado) | Tabla referenciada |
|------------------------|------------------------|--------------------|
| `department` | `department_id` | `departments` |
| `city` | `city_id` | `cities` |
| `neighborhood` | `neighborhood_id` | `neighborhoods` |

**¿Por qué campos duales?**
- El scraper extrae texto libre (ej: "Pocitos, Montevideo") y lo guarda en los campos texto.
- Los campos FK se llenan cuando el admin o un proceso de normalización vincula la propiedad a la geografía maestra.
- Esto permite que el scraper funcione sin depender de datos maestros cargados.

---

## 4. RLS (Row Level Security)

Las 3 tablas geográficas comparten el mismo patrón:

| Operación | Quién puede |
|-----------|-------------|
| `SELECT` | **Cualquiera** (público, sin autenticación) |
| `INSERT`, `UPDATE`, `DELETE` | Solo usuarios con rol `admin` |

---

## 5. Carga de datos con SQL

### Paso 1: Obtener el `id` del departamento

```sql
SELECT id, name FROM departments WHERE country = 'UY' ORDER BY name;
```

### Paso 2: Insertar ciudades vinculadas al departamento

```sql
-- Ejemplo: ciudades del departamento Montevideo
INSERT INTO cities (name, department_id) VALUES
  ('Montevideo', '<UUID_DEPTO_MONTEVIDEO>'),
  ('Santiago Vázquez', '<UUID_DEPTO_MONTEVIDEO>');

-- Ejemplo: ciudades del departamento Canelones
INSERT INTO cities (name, department_id) VALUES
  ('Ciudad de la Costa', '<UUID_DEPTO_CANELONES>'),
  ('Las Piedras', '<UUID_DEPTO_CANELONES>'),
  ('Pando', '<UUID_DEPTO_CANELONES>');
```

### Paso 3: Insertar barrios vinculados a la ciudad

```sql
-- Primero obtener el id de la ciudad
SELECT id, name FROM cities WHERE department_id = '<UUID_DEPTO_MONTEVIDEO>';

-- Insertar barrios
INSERT INTO neighborhoods (name, city_id) VALUES
  ('Pocitos', '<UUID_CIUDAD_MONTEVIDEO>'),
  ('Cordón', '<UUID_CIUDAD_MONTEVIDEO>'),
  ('Punta Carretas', '<UUID_CIUDAD_MONTEVIDEO>'),
  ('Centro', '<UUID_CIUDAD_MONTEVIDEO>'),
  ('Buceo', '<UUID_CIUDAD_MONTEVIDEO>'),
  ('Parque Rodó', '<UUID_CIUDAD_MONTEVIDEO>'),
  ('Malvín', '<UUID_CIUDAD_MONTEVIDEO>'),
  ('Carrasco', '<UUID_CIUDAD_MONTEVIDEO>');
```

### Script completo con sub-selects (sin copiar UUIDs a mano)

```sql
-- Insertar ciudades usando sub-select del departamento
INSERT INTO cities (name, department_id)
SELECT city_name, d.id
FROM departments d
CROSS JOIN (VALUES
  ('Montevideo'),
  ('Santiago Vázquez')
) AS t(city_name)
WHERE d.name = 'Montevideo' AND d.country = 'UY';

-- Insertar barrios usando sub-select de la ciudad
INSERT INTO neighborhoods (name, city_id)
SELECT barrio, c.id
FROM cities c
CROSS JOIN (VALUES
  ('Pocitos'),
  ('Cordón'),
  ('Punta Carretas'),
  ('Centro'),
  ('Buceo')
) AS t(barrio)
WHERE c.name = 'Montevideo'
  AND c.department_id = (SELECT id FROM departments WHERE name = 'Montevideo' AND country = 'UY');
```

> ⚠️ **Importante:** Estos scripts se ejecutan en el **SQL Editor de Supabase** con sesión de admin autenticado, o vía migración CLI.

---

## 6. Carga desde el panel Admin (UI)

1. Ir a **Admin → Geografía**
2. La UI muestra 3 columnas: Departamentos | Ciudades | Barrios
3. Seleccionar un departamento → aparecen sus ciudades
4. Seleccionar una ciudad → aparecen sus barrios
5. Usar el botón "+" en cada columna para agregar

**Flujo obligatorio:** Primero el departamento debe existir, luego la ciudad, luego el barrio. No se puede crear un barrio sin ciudad, ni una ciudad sin departamento.

---

## 7. Notas importantes

### Campo `cities.country` (LEGACY)
- Existe por compatibilidad histórica.
- **NO usarlo** para nuevas inserciones.
- La relación correcta es `cities.department_id → departments.id`, y el país se obtiene de `departments.country`.
- Se eliminará en una migración futura cuando se confirme que nada lo usa.

### Idempotencia
- Los departamentos de Uruguay y Argentina ya están cargados como seed.
- Si necesitás agregar un país nuevo, primero insertá sus departamentos/provincias en `departments` con el `country` code correspondiente.

### Convención de `country`
- Usamos códigos ISO 3166-1 alpha-2: `'UY'`, `'AR'`, `'CL'`, `'BR'`, etc.
- El default de `departments.country` es `'UY'`.

---

## 8. Queries útiles

```sql
-- Ver toda la jerarquía
SELECT
  d.country,
  d.name AS departamento,
  c.name AS ciudad,
  n.name AS barrio
FROM departments d
LEFT JOIN cities c ON c.department_id = d.id
LEFT JOIN neighborhoods n ON n.city_id = c.id
WHERE d.country = 'UY'
ORDER BY d.name, c.name, n.name;

-- Contar ciudades por departamento
SELECT d.name, COUNT(c.id) AS ciudades
FROM departments d
LEFT JOIN cities c ON c.department_id = d.id
WHERE d.country = 'UY'
GROUP BY d.name
ORDER BY ciudades DESC;

-- Barrios de una ciudad específica
SELECT n.name
FROM neighborhoods n
JOIN cities c ON c.id = n.city_id
WHERE c.name = 'Montevideo'
ORDER BY n.name;

-- Ver jerarquía completa de Montevideo con conteo de barrios
SELECT
  c.name AS ciudad,
  COUNT(n.id) AS total_barrios
FROM cities c
LEFT JOIN neighborhoods n ON n.city_id = c.id
WHERE c.department_id = (SELECT id FROM departments WHERE name = 'Montevideo' AND country = 'UY')
GROUP BY c.name;
```

---

## 9. Scripts de Seed Disponibles

### `20260323080000_seed_geografia_uruguay.sql`

Script completo que carga:

**Montevideo:**
- 3 ciudades (Montevideo, Santiago Vázquez, Paso de la Arena)
- **67 barrios** de Montevideo capital (Pocitos, Punta Carretas, Cordón, Centro, Buceo, Prado, Palermo, Carrasco, etc.)

**Canelones:**
- 12 ciudades (Ciudad de la Costa, Las Piedras, Pando, Canelones, La Paz, Progreso, Santa Lucía, Atlántida, Solymar, Lagomar, Ciudad del Plata, San Ramón)
- **10 barrios por ciudad** (120 barrios en total)

**Otros 17 departamentos:**
- 2-3 ciudades principales por departamento
- Total: ~40 ciudades adicionales

**Total aproximado:**
- 55+ ciudades
- 230+ barrios

### Ejecutar el script

```bash
# Opción 1: Desde Supabase CLI
supabase db push

# Opción 2: Copiar y pegar en SQL Editor de Supabase
# Ir a: https://app.supabase.com/project/_/sql
```

---

## 10. Próximos Pasos

### Pendientes

1. **Agregar barrios a otras ciudades importantes:**
   - Maldonado y Punta del Este
   - Colonia del Sacramento
   - Salto y Paysandú
   - Rivera y Melo

2. **Agregar índices de performance para búsquedas:**
   ```sql
   CREATE INDEX idx_neighborhoods_lower_name 
     ON neighborhoods(LOWER(name));
   ```

3. **Crear vista materializada para consultas rápidas:**
   ```sql
   CREATE VIEW properties_con_ubicacion AS
   SELECT p.*, d.name AS dept_name, c.name AS city_name, n.name AS barrio_name
   FROM properties p
   LEFT JOIN departments d ON p.department_id = d.id
   LEFT JOIN cities c ON p.city_id = c.id
   LEFT JOIN neighborhoods n ON p.neighborhood_id = n.id;
   ```

---

## 11. Triggers de Sincronización

### ¿Qué problema resuelven?

Los triggers garantizan **consistencia automática** entre los campos de texto (`department`, `city`, `neighborhood`) y los campos normalizados (`department_id`, `city_id`, `neighborhood_id`).

**Sin trigger:**
```typescript
// Posible inconsistencia:
{
  department: "Montevideo",      // texto
  department_id: "uuid-canelones" // FK → INCONSISTENCIA ❌
}
```

**Con trigger:**
```typescript
// El trigger actualiza automáticamente:
{
  department: "Canelones",       // actualizado automáticamente ✅
  department_id: "uuid-canelones" // FK correcta
}
```

### Triggers disponibles

#### 1. `trg_sync_property_location` - Sincroniza TEXTO desde ID

**Dirección:** `department_id` → `department`

**Se ejecuta:** BEFORE INSERT OR UPDATE

**Función:** `sync_property_location_fields()`

```sql
-- Ejemplo de uso:
INSERT INTO properties (
  title,
  department_id,  -- Solo seteás el ID
  ...
) VALUES (
  'Departamento en Pocitos',
  'uuid-montevideo',
  ...
);

-- El trigger actualiza automáticamente:
-- department = 'Montevideo' ✅
```

---

#### 2. `trg_resolve_property_location_ids` - Resuelve ID desde TEXTO

**Dirección:** `department` → `department_id`

**Se ejecuta:** BEFORE INSERT OR UPDATE

**Función:** `resolve_property_location_ids()`

```sql
-- Ejemplo de uso (scraper):
INSERT INTO properties (
  title,
  department,  -- Solo texto del scraping
  city,
  neighborhood,
  ...
) VALUES (
  'Departamento en Pocitos',
  'Montevideo',    -- texto
  'Montevideo',    -- texto
  'Pocitos',       -- texto
  ...
);

-- El trigger resuelve automáticamente:
-- department_id = 'uuid-montevideo' ✅
-- city_id = 'uuid-montevideo-city' ✅
-- neighborhood_id = 'uuid-pocitos' ✅
```

---

### Migración disponible

**Archivo:** `20260323090000_triggers_sincronizacion_ubicacion.sql`

**Incluye:**
- ✅ Función `sync_property_location_fields()`
- ✅ Función `resolve_property_location_ids()`
- ✅ Trigger `trg_sync_property_location`
- ✅ Trigger `trg_resolve_property_location_ids`
- ✅ Script de actualización para datos existentes
- ✅ Queries de verificación

---

### Ejecutar migración de datos existentes

El script incluye UPDATEs para sincronizar propiedades existentes:

```sql
-- Actualiza department_id desde department (texto)
UPDATE properties p
SET department_id = d.id
FROM departments d
WHERE LOWER(p.department) = LOWER(d.name)
  AND d.country = 'UY'
  AND p.department_id IS NULL;

-- Actualiza city_id desde city + department_id
UPDATE properties p
SET city_id = c.id
FROM cities c
WHERE LOWER(p.city) = LOWER(c.name)
  AND p.department_id = c.department_id
  AND p.city_id IS NULL;

-- Actualiza neighborhood_id desde neighborhood + city_id
UPDATE properties p
SET neighborhood_id = n.id
FROM neighborhoods n
WHERE LOWER(p.neighborhood) = LOWER(n.name)
  AND p.city_id = n.city_id
  AND p.neighborhood_id IS NULL;
```

---

### Verificar sincronización

```sql
-- Ver resumen de sincronización
SELECT
  COUNT(*) AS total_properties,
  COUNT(department_id) AS with_department_id,
  COUNT(city_id) AS with_city_id,
  COUNT(neighborhood_id) AS with_neighborhood_id,
  ROUND(100.0 * COUNT(department_id) / NULLIF(COUNT(*), 0), 2) AS pct_department,
  ROUND(100.0 * COUNT(city_id) / NULLIF(COUNT(*), 0), 2) AS pct_city,
  ROUND(100.0 * COUNT(neighborhood_id) / NULLIF(COUNT(*), 0), 2) AS pct_neighborhood
FROM properties;
```

**Resultado esperado:**
```
 total_properties | with_department_id | with_city_id | with_neighborhood_id | pct_department | pct_city | pct_neighborhood
------------------+-------------------+--------------+---------------------+----------------+----------+------------------
              100 |                95 |           90 |                  85 |          95.00 |    90.00 |            85.00
```

---

### Flujo recomendado para scraping

```
1. Scraper guarda propiedad con solo texto:
   { department: "Montevideo", city: "Montevideo", neighborhood: "Pocitos" }
   
2. Trigger `trg_resolve_property_location_ids` se ejecuta:
   → Resuelve department_id, city_id, neighborhood_id automáticamente
   
3. Trigger `trg_sync_property_location_fields` verifica:
   → Confirma que los nombres de texto coincidan con los IDs
   
4. Propiedad guardada con consistencia 100% ✅
```
