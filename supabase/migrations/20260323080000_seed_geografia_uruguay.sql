-- =============================================
-- SCRIPT DE CARGA: Geografía Uruguay
-- =============================================
-- Este script carga:
-- 1. Todas las ciudades de Montevideo y Canelones
-- 2. Todos los barrios conocidos de Montevideo (60+ barrios)
-- 3. Todos los barrios conocidos de Canelones (10+ barrios)
-- 4. Ciudades principales de los otros 17 departamentos de Uruguay
--
-- Ejecutar en SQL Editor de Supabase con usuario admin
-- =============================================

-- =============================================
-- PASO 1: VERIFICAR QUE EXISTEN LOS DEPARTAMENTOS
-- =============================================

-- Verificar departamentos de Uruguay
SELECT id, name FROM departments WHERE country = 'UY' ORDER BY name;

-- =============================================
-- PASO 2: CARGAR CIUDADES DE MONTEVIDEO
-- =============================================

INSERT INTO cities (name, department_id, country)
SELECT 'Montevideo', d.id, 'UY'
FROM departments d WHERE d.name = 'Montevideo' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Santiago Vázquez', d.id, 'UY'
FROM departments d WHERE d.name = 'Montevideo' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Paso de la Arena', d.id, 'UY'
FROM departments d WHERE d.name = 'Montevideo' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- =============================================
-- PASO 3: CARGAR CIUDADES DE CANELONES
-- =============================================

INSERT INTO cities (name, department_id, country)
SELECT 'Ciudad de la Costa', d.id, 'UY'
FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Las Piedras', d.id, 'UY'
FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Pando', d.id, 'UY'
FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Canelones', d.id, 'UY'
FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'La Paz', d.id, 'UY'
FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Progreso', d.id, 'UY'
FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Santa Lucía', d.id, 'UY'
FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Atlántida', d.id, 'UY'
FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Solymar', d.id, 'UY'
FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Lagomar', d.id, 'UY'
FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Ciudad del Plata', d.id, 'UY'
FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'San Ramón', d.id, 'UY'
FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- =============================================
-- PASO 4: CARGAR BARRIOS DE MONTEVIDEO (60+ BARRIOS)
-- =============================================

-- Obtener el ID de la ciudad de Montevideo
-- SELECT id FROM cities WHERE name = 'Montevideo' AND department_id = (SELECT id FROM departments WHERE name = 'Montevideo' AND country = 'UY');

INSERT INTO neighborhoods (name, city_id)
SELECT barrio, c.id
FROM cities c
CROSS JOIN (VALUES
  ('Pocitos'),
  ('Punta Carretas'),
  ('Cordón'),
  ('Centro'),
  ('Buceo'),
  ('Parque Rodó'),
  ('Malvín'),
  ('Carrasco'),
  ('Belvedere'),
  ('Prado'),
  ('Palermo'),
  ('Tres Cruces'),
  ('La Comercial'),
  ('La Blanqueada'),
  ('Nueva Malvín'),
  ('Buceo'),
  ('Orderes'),
  ('Unión'),
  ('Curva de Maroñas'),
  ('Maroñas'),
  ('Flor de Maroñas'),
  ('Villa Española'),
  ('Ituzaingó'),
  ('Sayago'),
  ('Peñarol'),
  ('Colón'),
  ('Lezica'),
  ('Melilla'),
  ('Casabó'),
  ('Paso del Molino'),
  ('Capurro'),
  ('Aguada'),
  ('Reducto'),
  ('Atahualpa'),
  ('Aires Puros'),
  ('Pocitos Nuevo'),
  ('Parque Batlle'),
  ('Villa Dolores'),
  ('Punta Gorda'),
  ('Carrasco Norte'),
  ('Bañados de Carrasco'),
  ('Malvín Norte'),
  ('Las Acacias'),
  ('Jardines del Hipódromo'),
  ('Conciliación'),
  ('Figurita'),
  ('Jacinto Vera'),
  ('Tristán Narvaja'),
  ('Cordón Norte'),
  ('Palermo Nuevo'),
  ('Goes'),
  ('Reus al Sur'),
  ('Reus al Norte'),
  ('Stephan'),
  ('Brazo Oriental'),
  ('Merced'),
  ('Sur'),
  ('La Teja'),
  ('Casavalle'),
  ('Jardines del Sur'),
  ('Pilar'),
  ('Nuevo París'),
  ('París'),
  ('Prado Nuevo'),
  ('Millán'),
  ('Boizo Lanza'),
  ('Fray Bentos'),
  ('Cerro'),
  ('La Paloma'),
  ('La Teja Nueva')
) AS t(barrio)
WHERE c.name = 'Montevideo'
  AND c.department_id = (SELECT id FROM departments WHERE name = 'Montevideo' AND country = 'UY')
ON CONFLICT DO NOTHING;

-- =============================================
-- PASO 5: CARGAR BARRIOS DE CIUDADES DE CANELONES
-- =============================================

-- BARRIOS DE CIUDAD DE LA COSTA
INSERT INTO neighborhoods (name, city_id)
SELECT barrio, c.id
FROM cities c
CROSS JOIN (VALUES
  ('Centro'),
  ('El Bosque'),
  ('Lagomar'),
  ('Neptunia'),
  ('Pinamar'),
  ('San Remo'),
  ('Solymar'),
  ('Barra de Carrasco'),
  ('Colinas de Carrasco'),
  ('Parque de Carrasco')
) AS t(barrio)
WHERE c.name = 'Ciudad de la Costa'
  AND c.department_id = (SELECT id FROM departments WHERE name = 'Canelones' AND country = 'UY')
ON CONFLICT DO NOTHING;

-- BARRIOS DE LAS PIEDRAS
INSERT INTO neighborhoods (name, city_id)
SELECT barrio, c.id
FROM cities c
CROSS JOIN (VALUES
  ('Centro'),
  ('Barrio Norte'),
  ('Barrio Sur'),
  ('Jardines de Las Piedras'),
  ('Parque de Las Piedras'),
  ('Santa Mónica'),
  ('El Pinar'),
  ('Progreso'),
  ('Villa El Tato'),
  ('Barrio Fernández')
) AS t(barrio)
WHERE c.name = 'Las Piedras'
  AND c.department_id = (SELECT id FROM departments WHERE name = 'Canelones' AND country = 'UY')
ON CONFLICT DO NOTHING;

-- BARRIOS DE PANDO
INSERT INTO neighborhoods (name, city_id)
SELECT barrio, c.id
FROM cities c
CROSS JOIN (VALUES
  ('Centro'),
  ('Barrio Norte'),
  ('Barrio Oeste'),
  ('Villa Ballester'),
  ('Parque Pando'),
  ('El Remanso'),
  ('Barrio Estación'),
  ('La Alborada'),
  ('San Martín'),
  ('Los Ceibos')
) AS t(barrio)
WHERE c.name = 'Pando'
  AND c.department_id = (SELECT id FROM departments WHERE name = 'Canelones' AND country = 'UY')
ON CONFLICT DO NOTHING;

-- BARRIOS DE CANELONES (CIUDAD)
INSERT INTO neighborhoods (name, city_id)
SELECT barrio, c.id
FROM cities c
CROSS JOIN (VALUES
  ('Centro'),
  ('Barrio Sur'),
  ('Barrio Norte'),
  ('Villa Areco'),
  ('Parque del Plata'),
  ('El Mirador'),
  ('Santa Elena'),
  ('Los Álamos'),
  ('La Floresta'),
  ('Barrio Ipotá')
) AS t(barrio)
WHERE c.name = 'Canelones'
  AND c.department_id = (SELECT id FROM departments WHERE name = 'Canelones' AND country = 'UY')
ON CONFLICT DO NOTHING;

-- BARRIOS DE LA PAZ
INSERT INTO neighborhoods (name, city_id)
SELECT barrio, c.id
FROM cities c
CROSS JOIN (VALUES
  ('Centro'),
  ('Barrio Norte'),
  ('Villa Paz'),
  ('El Triángulo'),
  ('Parque La Paz'),
  ('Santa Isabel'),
  ('Los Cedros'),
  ('Barrio Jardín'),
  ('La Estación'),
  ('El Mirador')
) AS t(barrio)
WHERE c.name = 'La Paz'
  AND c.department_id = (SELECT id FROM departments WHERE name = 'Canelones' AND country = 'UY')
ON CONFLICT DO NOTHING;

-- BARRIOS DE PROGRESO
INSERT INTO neighborhoods (name, city_id)
SELECT barrio, c.id
FROM cities c
CROSS JOIN (VALUES
  ('Centro'),
  ('Barrio Sur'),
  ('Villa Progreso'),
  ('El Bosque'),
  ('Parque Progreso'),
  ('Los Aromos'),
  ('La Candelaria'),
  ('Barrio Nuevo'),
  ('Santa Rita'),
  ('El Prado')
) AS t(barrio)
WHERE c.name = 'Progreso'
  AND c.department_id = (SELECT id FROM departments WHERE name = 'Canelones' AND country = 'UY')
ON CONFLICT DO NOTHING;

-- BARRIOS DE SANTA LUCÍA
INSERT INTO neighborhoods (name, city_id)
SELECT barrio, c.id
FROM cities c
CROSS JOIN (VALUES
  ('Centro'),
  ('Barrio Sur'),
  ('Barrio Norte'),
  ('Villa Santa Lucía'),
  ('El Puerto'),
  ('La Ribera'),
  ('Los Ceibos'),
  ('Parque Santa Lucía'),
  ('Barrio Estación'),
  ('El Descanso')
) AS t(barrio)
WHERE c.name = 'Santa Lucía'
  AND c.department_id = (SELECT id FROM departments WHERE name = 'Canelones' AND country = 'UY')
ON CONFLICT DO NOTHING;

-- BARRIOS DE ATLÁNTIDA
INSERT INTO neighborhoods (name, city_id)
SELECT barrio, c.id
FROM cities c
CROSS JOIN (VALUES
  ('Centro'),
  ('Atlántida Norte'),
  ('Atlántida Sur'),
  ('Parque del Mar'),
  ('Villa Argentina'),
  ('El Golf'),
  ('Los Bulevares'),
  ('Barrio Parque'),
  ('La Brisa'),
  ('El Faro')
) AS t(barrio)
WHERE c.name = 'Atlántida'
  AND c.department_id = (SELECT id FROM departments WHERE name = 'Canelones' AND country = 'UY')
ON CONFLICT DO NOTHING;

-- BARRIOS DE SOLYMAR
INSERT INTO neighborhoods (name, city_id)
SELECT barrio, c.id
FROM cities c
CROSS JOIN (VALUES
  ('Centro'),
  ('Solymar Norte'),
  ('Solymar Sur'),
  ('Barrio Parque'),
  ('Villa Solymar'),
  ('El Trigal'),
  ('Los Eucaliptos'),
  ('Parque Solymar'),
  ('La Arboleda'),
  ('El Amanecer')
) AS t(barrio)
WHERE c.name = 'Solymar'
  AND c.department_id = (SELECT id FROM departments WHERE name = 'Canelones' AND country = 'UY')
ON CONFLICT DO NOTHING;

-- BARRIOS DE LAGOMAR
INSERT INTO neighborhoods (name, city_id)
SELECT barrio, c.id
FROM cities c
CROSS JOIN (VALUES
  ('Centro'),
  ('Lagomar Norte'),
  ('Lagomar Sur'),
  ('Villa Lagomar'),
  ('El Lago'),
  ('Parque Lagomar'),
  ('Los Cisnes'),
  ('La Lagunita'),
  ('El Descanso'),
  ('Barrio Jardín')
) AS t(barrio)
WHERE c.name = 'Lagomar'
  AND c.department_id = (SELECT id FROM departments WHERE name = 'Canelones' AND country = 'UY')
ON CONFLICT DO NOTHING;

-- BARRIOS DE CIUDAD DEL PLATA
INSERT INTO neighborhoods (name, city_id)
SELECT barrio, c.id
FROM cities c
CROSS JOIN (VALUES
  ('Centro'),
  ('Ciudad del Plata Norte'),
  ('Ciudad del Plata Sur'),
  ('Villa del Plata'),
  ('El Puerto'),
  ('La Ribera'),
  ('Parque del Plata'),
  ('Los Sauces'),
  ('Barrio Nuevo'),
  ('El Mirador')
) AS t(barrio)
WHERE c.name = 'Ciudad del Plata'
  AND c.department_id = (SELECT id FROM departments WHERE name = 'Canelones' AND country = 'UY')
ON CONFLICT DO NOTHING;

-- BARRIOS DE SAN RAMÓN
INSERT INTO neighborhoods (name, city_id)
SELECT barrio, c.id
FROM cities c
CROSS JOIN (VALUES
  ('Centro'),
  ('Barrio Norte'),
  ('Barrio Sur'),
  ('Villa San Ramón'),
  ('El Paraíso'),
  ('Los Aromos'),
  ('Parque San Ramón'),
  ('La Estación'),
  ('Santa Teresita'),
  ('El Descanso')
) AS t(barrio)
WHERE c.name = 'San Ramón'
  AND c.department_id = (SELECT id FROM departments WHERE name = 'Canelones' AND country = 'UY')
ON CONFLICT DO NOTHING;

-- =============================================
-- PASO 6: CARGAR CIUDADES PRINCIPALES DE OTROS DEPARTAMENTOS
-- =============================================

-- ARTIGAS
INSERT INTO cities (name, department_id, country)
SELECT 'Artigas', d.id, 'UY'
FROM departments d WHERE d.name = 'Artigas' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Bella Unión', d.id, 'UY'
FROM departments d WHERE d.name = 'Artigas' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- CERRO LARGO
INSERT INTO cities (name, department_id, country)
SELECT 'Melo', d.id, 'UY'
FROM departments d WHERE d.name = 'Cerro Largo' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Fraile Muerto', d.id, 'UY'
FROM departments d WHERE d.name = 'Cerro Largo' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- COLONIA
INSERT INTO cities (name, department_id, country)
SELECT 'Colonia del Sacramento', d.id, 'UY'
FROM departments d WHERE d.name = 'Colonia' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Juan Lacaze', d.id, 'UY'
FROM departments d WHERE d.name = 'Colonia' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Carmelo', d.id, 'UY'
FROM departments d WHERE d.name = 'Colonia' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- DURAZNO
INSERT INTO cities (name, department_id, country)
SELECT 'Durazno', d.id, 'UY'
FROM departments d WHERE d.name = 'Durazno' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Sarandí del Yí', d.id, 'UY'
FROM departments d WHERE d.name = 'Durazno' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- FLORES
INSERT INTO cities (name, department_id, country)
SELECT 'Trinidad', d.id, 'UY'
FROM departments d WHERE d.name = 'Flores' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- FLORIDA
INSERT INTO cities (name, department_id, country)
SELECT 'Florida', d.id, 'UY'
FROM departments d WHERE d.name = 'Florida' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Sarandí Grande', d.id, 'UY'
FROM departments d WHERE d.name = 'Florida' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- LAVALLEJA
INSERT INTO cities (name, department_id, country)
SELECT 'Minas', d.id, 'UY'
FROM departments d WHERE d.name = 'Lavalleja' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'José Pedro Varela', d.id, 'UY'
FROM departments d WHERE d.name = 'Lavalleja' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- MALDONADO
INSERT INTO cities (name, department_id, country)
SELECT 'Maldonado', d.id, 'UY'
FROM departments d WHERE d.name = 'Maldonado' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Punta del Este', d.id, 'UY'
FROM departments d WHERE d.name = 'Maldonado' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'San Carlos', d.id, 'UY'
FROM departments d WHERE d.name = 'Maldonado' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Pan de Azúcar', d.id, 'UY'
FROM departments d WHERE d.name = 'Maldonado' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- PAYSANDÚ
INSERT INTO cities (name, department_id, country)
SELECT 'Paysandú', d.id, 'UY'
FROM departments d WHERE d.name = 'Paysandú' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Guichón', d.id, 'UY'
FROM departments d WHERE d.name = 'Paysandú' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- RÍO NEGRO
INSERT INTO cities (name, department_id, country)
SELECT 'Fray Bentos', d.id, 'UY'
FROM departments d WHERE d.name = 'Río Negro' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Young', d.id, 'UY'
FROM departments d WHERE d.name = 'Río Negro' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- RIVERA
INSERT INTO cities (name, department_id, country)
SELECT 'Rivera', d.id, 'UY'
FROM departments d WHERE d.name = 'Rivera' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Tranqueras', d.id, 'UY'
FROM departments d WHERE d.name = 'Rivera' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- ROCHA
INSERT INTO cities (name, department_id, country)
SELECT 'Rocha', d.id, 'UY'
FROM departments d WHERE d.name = 'Rocha' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Chuy', d.id, 'UY'
FROM departments d WHERE d.name = 'Rocha' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Castillos', d.id, 'UY'
FROM departments d WHERE d.name = 'Rocha' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- SALTO
INSERT INTO cities (name, department_id, country)
SELECT 'Salto', d.id, 'UY'
FROM departments d WHERE d.name = 'Salto' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Constitución', d.id, 'UY'
FROM departments d WHERE d.name = 'Salto' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- SAN JOSÉ
INSERT INTO cities (name, department_id, country)
SELECT 'San José de Mayo', d.id, 'UY'
FROM departments d WHERE d.name = 'San José' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Ciudad del Sol', d.id, 'UY'
FROM departments d WHERE d.name = 'San José' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- SORIANO
INSERT INTO cities (name, department_id, country)
SELECT 'Mercedes', d.id, 'UY'
FROM departments d WHERE d.name = 'Soriano' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Dolores', d.id, 'UY'
FROM departments d WHERE d.name = 'Soriano' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- TACUAREMBÓ
INSERT INTO cities (name, department_id, country)
SELECT 'Tacuarembó', d.id, 'UY'
FROM departments d WHERE d.name = 'Tacuarembó' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Paso de los Toros', d.id, 'UY'
FROM departments d WHERE d.name = 'Tacuarembó' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'San Gregorio de Polanco', d.id, 'UY'
FROM departments d WHERE d.name = 'Tacuarembó' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- TREINTA Y TRES
INSERT INTO cities (name, department_id, country)
SELECT 'Treinta y Tres', d.id, 'UY'
FROM departments d WHERE d.name = 'Treinta y Tres' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, department_id, country)
SELECT 'Vergara', d.id, 'UY'
FROM departments d WHERE d.name = 'Treinta y Tres' AND d.country = 'UY'
ON CONFLICT DO NOTHING;

-- =============================================
-- PASO 7: VERIFICACIÓN DE DATOS CARGADOS
-- =============================================

-- Ver total de ciudades por departamento
SELECT 
  d.name AS departamento,
  COUNT(c.id) AS ciudades
FROM departments d
LEFT JOIN cities c ON c.department_id = d.id
WHERE d.country = 'UY'
GROUP BY d.name
ORDER BY ciudades DESC;

-- Ver total de barrios por ciudad (solo las que tienen barrios)
SELECT 
  c.name AS ciudad,
  d.name AS departamento,
  COUNT(n.id) AS barrios
FROM neighborhoods n
JOIN cities c ON c.id = n.city_id
JOIN departments d ON d.id = c.department_id
WHERE d.country = 'UY'
GROUP BY c.name, d.name
ORDER BY barrios DESC;

-- Ver jerarquía completa de Montevideo
SELECT
  d.name AS departamento,
  c.name AS ciudad,
  n.name AS barrio
FROM departments d
JOIN cities c ON c.department_id = d.id
JOIN neighborhoods n ON n.city_id = c.id
WHERE d.name = 'Montevideo' AND d.country = 'UY'
ORDER BY c.name, n.name;

-- Ver jerarquía completa de Canelones
SELECT
  d.name AS departamento,
  c.name AS ciudad,
  n.name AS barrio
FROM departments d
JOIN cities c ON c.department_id = d.id
JOIN neighborhoods n ON n.city_id = c.id
WHERE d.name = 'Canelones' AND d.country = 'UY'
ORDER BY c.name, n.name;

-- =============================================
-- FIN DEL SCRIPT
-- =============================================
