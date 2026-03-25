
-- Seed ciudades de Montevideo
INSERT INTO cities (name, department_id, country) SELECT 'Montevideo', d.id, 'UY' FROM departments d WHERE d.name = 'Montevideo' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Santiago Vázquez', d.id, 'UY' FROM departments d WHERE d.name = 'Montevideo' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Paso de la Arena', d.id, 'UY' FROM departments d WHERE d.name = 'Montevideo' AND d.country = 'UY' ON CONFLICT DO NOTHING;

-- Canelones
INSERT INTO cities (name, department_id, country) SELECT 'Ciudad de la Costa', d.id, 'UY' FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Las Piedras', d.id, 'UY' FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Pando', d.id, 'UY' FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Canelones', d.id, 'UY' FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'La Paz', d.id, 'UY' FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Progreso', d.id, 'UY' FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Santa Lucía', d.id, 'UY' FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Atlántida', d.id, 'UY' FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Solymar', d.id, 'UY' FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Lagomar', d.id, 'UY' FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Ciudad del Plata', d.id, 'UY' FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'San Ramón', d.id, 'UY' FROM departments d WHERE d.name = 'Canelones' AND d.country = 'UY' ON CONFLICT DO NOTHING;

-- Barrios Montevideo
INSERT INTO neighborhoods (name, city_id) SELECT barrio, c.id FROM cities c CROSS JOIN (VALUES ('Pocitos'),('Punta Carretas'),('Cordón'),('Centro'),('Buceo'),('Parque Rodó'),('Malvín'),('Carrasco'),('Belvedere'),('Prado'),('Palermo'),('Tres Cruces'),('La Comercial'),('La Blanqueada'),('Nueva Malvín'),('Unión'),('Curva de Maroñas'),('Maroñas'),('Flor de Maroñas'),('Villa Española'),('Ituzaingó'),('Sayago'),('Peñarol'),('Colón'),('Lezica'),('Melilla'),('Casabó'),('Paso del Molino'),('Capurro'),('Aguada'),('Reducto'),('Atahualpa'),('Aires Puros'),('Pocitos Nuevo'),('Parque Batlle'),('Villa Dolores'),('Punta Gorda'),('Carrasco Norte'),('Bañados de Carrasco'),('Malvín Norte'),('Las Acacias'),('Jardines del Hipódromo'),('Conciliación'),('Figurita'),('Jacinto Vera'),('Tristán Narvaja'),('Cordón Norte'),('Palermo Nuevo'),('Goes'),('Reus al Sur'),('Reus al Norte'),('Stephan'),('Brazo Oriental'),('Merced'),('Sur'),('La Teja'),('Casavalle'),('Jardines del Sur'),('Pilar'),('Nuevo París'),('París'),('Prado Nuevo'),('Millán'),('Boizo Lanza'),('Fray Bentos'),('Cerro'),('La Paloma'),('La Teja Nueva')) AS t(barrio) WHERE c.name = 'Montevideo' AND c.department_id = (SELECT id FROM departments WHERE name = 'Montevideo' AND country = 'UY') ON CONFLICT DO NOTHING;

-- Barrios Ciudad de la Costa
INSERT INTO neighborhoods (name, city_id) SELECT barrio, c.id FROM cities c CROSS JOIN (VALUES ('Centro'),('El Bosque'),('Lagomar'),('Neptunia'),('Pinamar'),('San Remo'),('Solymar'),('Barra de Carrasco'),('Colinas de Carrasco'),('Parque de Carrasco')) AS t(barrio) WHERE c.name = 'Ciudad de la Costa' AND c.department_id = (SELECT id FROM departments WHERE name = 'Canelones' AND country = 'UY') ON CONFLICT DO NOTHING;

-- Barrios Las Piedras
INSERT INTO neighborhoods (name, city_id) SELECT barrio, c.id FROM cities c CROSS JOIN (VALUES ('Centro'),('Barrio Norte'),('Barrio Sur'),('Jardines de Las Piedras'),('Parque de Las Piedras'),('Santa Mónica'),('El Pinar'),('Progreso'),('Villa El Tato'),('Barrio Fernández')) AS t(barrio) WHERE c.name = 'Las Piedras' AND c.department_id = (SELECT id FROM departments WHERE name = 'Canelones' AND country = 'UY') ON CONFLICT DO NOTHING;

-- Ciudades otros departamentos
INSERT INTO cities (name, department_id, country) SELECT 'Artigas', d.id, 'UY' FROM departments d WHERE d.name = 'Artigas' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Bella Unión', d.id, 'UY' FROM departments d WHERE d.name = 'Artigas' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Melo', d.id, 'UY' FROM departments d WHERE d.name = 'Cerro Largo' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Colonia del Sacramento', d.id, 'UY' FROM departments d WHERE d.name = 'Colonia' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Carmelo', d.id, 'UY' FROM departments d WHERE d.name = 'Colonia' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Durazno', d.id, 'UY' FROM departments d WHERE d.name = 'Durazno' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Trinidad', d.id, 'UY' FROM departments d WHERE d.name = 'Flores' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Florida', d.id, 'UY' FROM departments d WHERE d.name = 'Florida' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Minas', d.id, 'UY' FROM departments d WHERE d.name = 'Lavalleja' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Maldonado', d.id, 'UY' FROM departments d WHERE d.name = 'Maldonado' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Punta del Este', d.id, 'UY' FROM departments d WHERE d.name = 'Maldonado' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'San Carlos', d.id, 'UY' FROM departments d WHERE d.name = 'Maldonado' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Paysandú', d.id, 'UY' FROM departments d WHERE d.name = 'Paysandú' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Fray Bentos', d.id, 'UY' FROM departments d WHERE d.name = 'Río Negro' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Rivera', d.id, 'UY' FROM departments d WHERE d.name = 'Rivera' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Rocha', d.id, 'UY' FROM departments d WHERE d.name = 'Rocha' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Salto', d.id, 'UY' FROM departments d WHERE d.name = 'Salto' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'San José de Mayo', d.id, 'UY' FROM departments d WHERE d.name = 'San José' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Mercedes', d.id, 'UY' FROM departments d WHERE d.name = 'Soriano' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Tacuarembó', d.id, 'UY' FROM departments d WHERE d.name = 'Tacuarembó' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Paso de los Toros', d.id, 'UY' FROM departments d WHERE d.name = 'Tacuarembó' AND d.country = 'UY' ON CONFLICT DO NOTHING;
INSERT INTO cities (name, department_id, country) SELECT 'Treinta y Tres', d.id, 'UY' FROM departments d WHERE d.name = 'Treinta y Tres' AND d.country = 'UY' ON CONFLICT DO NOTHING;
