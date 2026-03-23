# Estructura Geográfica — Guía completa

> Documento de referencia para entender la jerarquía geográfica del sistema y cómo cargar datos.

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
```
