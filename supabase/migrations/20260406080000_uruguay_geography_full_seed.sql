-- 🌍 SEED GEOGRÁFICO INTEGRAL URUGUAY - REMHOMEFINDER
-- Este script realiza la carga masiva de Departamentos, Ciudades y Barrios de todo el Uruguay.
-- Es IDEMPOTENTE: Se puede ejecutar múltiples veces sin duplicar datos ni arrojar errores.

DO $$ 
DECLARE
    row_rec RECORD;
    v_dept_id UUID;
    v_city_id UUID;
BEGIN

    -- 1. ASEGURAR DEPARTAMENTOS (19/19)
    FOR row_rec IN SELECT * FROM (VALUES 
        ('Artigas'), ('Canelones'), ('Cerro Largo'), ('Colonia'), ('Durazno'), 
        ('Flores'), ('Florida'), ('Lavalleja'), ('Maldonado'), ('Montevideo'), 
        ('Paysandú'), ('Río Negro'), ('Rivera'), ('Rocha'), ('Salto'), 
        ('San José'), ('Soriano'), ('Tacuarembó'), ('Treinta y Tres')
    ) AS t(name) LOOP
        INSERT INTO public.departments (name, country)
        SELECT row_rec.name, 'UY'
        WHERE NOT EXISTS (
            SELECT 1 FROM public.departments 
            WHERE LOWER(name) = LOWER(row_rec.name) AND country = 'UY'
        );
    END LOOP;

    -- 2. ASEGURAR CIUDADES CLAVE DEL INTERIOR
    FOR row_rec IN SELECT * FROM (VALUES 
        ('Punta del Este', 'Maldonado'), ('Maldonado', 'Maldonado'), ('San Carlos', 'Maldonado'),
        ('Jose Ignacio', 'Maldonado'), ('Ciudad de la Costa', 'Canelones'), ('Las Piedras', 'Canelones'),
        ('Atlántida', 'Canelones'), ('Pando', 'Canelones'), ('Colonia del Sacramento', 'Colonia'),
        ('Carmelo', 'Colonia'), ('Melo', 'Cerro Largo'), ('Mercedes', 'Soriano'),
        ('Fray Bentos', 'Río Negro'), ('Paysandú', 'Paysandú'), ('Salto', 'Salto'),
        ('Rivera', 'Rivera'), ('Artigas', 'Artigas'), ('Tacuarembó', 'Tacuarembó'),
        ('Durazno', 'Durazno'), ('Florida', 'Florida'), ('Minas', 'Lavalleja'),
        ('Rocha', 'Rocha'), ('San José de Mayo', 'San José'), ('Trinidad', 'Flores'),
        ('Treinta y Tres', 'Treinta y Tres'), ('Piriapolis', 'Maldonado'), ('Chuy', 'Rocha'),
        ('Young', 'Río Negro'), ('Dolores', 'Soriano'), ('Tomas Gomensoro', 'Artigas'),
        ('Baltasar Brum', 'Artigas'), ('Nueva Helvecia', 'Colonia'), ('Ciudad del Plata', 'San José')
    ) AS t(city, dept) LOOP
        SELECT d.id INTO v_dept_id FROM public.departments d WHERE LOWER(d.name) = LOWER(row_rec.dept) AND d.country = 'UY' LIMIT 1;
        IF v_dept_id IS NOT NULL THEN
            INSERT INTO public.cities (name, department_id, country)
            SELECT row_rec.city, v_dept_id, 'UY'
            WHERE NOT EXISTS (
                SELECT 1 FROM public.cities 
                WHERE LOWER(name) = LOWER(row_rec.city) AND country = 'UY'
            );
        END IF;
    END LOOP;

    -- 3. BARRIOS: MONTEVIDEO
    SELECT c.id INTO v_city_id FROM public.cities c 
    JOIN public.departments d ON c.department_id = d.id 
    WHERE LOWER(c.name) = 'montevideo' AND LOWER(d.name) = 'montevideo' LIMIT 1;

    IF v_city_id IS NOT NULL THEN
        FOR row_rec IN SELECT * FROM (VALUES 
            ('Pocitos'),('Punta Carretas'),('Carrasco'),('Malvín'),('Buceo'),('Centro'),('Cordón'),
            ('Parque Rodó'),('Prado'),('Palermo'),('Barrio Sur'),('Aguada'),('Tres Cruces'),
            ('La Blanqueada'),('La Comercial'),('Villa Española'),('Unión'),('Sayago'),('Peñarol'),
            ('Colón'),('Lezica'),('Paso de la Arena'),('Cerro'),('La Teja'),('Casavalle'),('Manga'),
            ('Piedras Blancas'),('Melilla'),('Carrasco Norte'),('Jardines del Hipódromo'),
            ('Maroñas'),('Flor de Maroñas'),('Ituzaingó'),('Nueva Malvín'),('Malvín Norte'),
            ('Punta Gorda'),('Bañados de Carrasco'),('Las Acacias'),('Aires Puros'),('Atahualpa'),
            ('Figurita'),('Jacinto Vera'),('Brazo Oriental'),('Goes'),('Reducto'),('Capurro'),
            ('Bella Vista'),('Arroyo Seco'),('Cerrito de la Victoria'),('Larrañaga'),('Mercado Modelo')
        ) AS t(name) LOOP
            INSERT INTO public.neighborhoods (name, city_id)
            SELECT row_rec.name, v_city_id
            WHERE NOT EXISTS (SELECT 1 FROM public.neighborhoods WHERE LOWER(name) = LOWER(row_rec.name) AND city_id = v_city_id);
        END LOOP;
    END IF;

    -- 4. BARRIOS: PUNTA DEL ESTE / MALDONADO
    SELECT c.id INTO v_city_id FROM public.cities c 
    JOIN public.departments d ON c.department_id = d.id 
    WHERE (LOWER(c.name) = 'punta del este' OR LOWER(c.name) = 'maldonado') AND LOWER(d.name) = 'maldonado' LIMIT 1;

    IF v_city_id IS NOT NULL THEN
        FOR row_rec IN SELECT * FROM (VALUES 
            ('Península'),('Pinares'),('Mansa'),('Brava'),('Beverly Hills'),('Cantegril'),('Golf'),
            ('San Rafael'),('Rincón del Indio'),('Punta Ballena'),('Portezuelo'),('La Barra'),
            ('Manantiales'),('El Chorro'),('Balneario Buenos Aires'),('Pueblo Edén'),('El Tesoro')
        ) AS t(name) LOOP
            INSERT INTO public.neighborhoods (name, city_id)
            SELECT row_rec.name, v_city_id
            WHERE NOT EXISTS (SELECT 1 FROM public.neighborhoods WHERE LOWER(name) = LOWER(row_rec.name) AND city_id = v_city_id);
        END LOOP;
    END IF;

    -- 5. BARRIOS: CIUDAD DE LA COSTA
    SELECT c.id INTO v_city_id FROM public.cities c 
    JOIN public.departments d ON c.department_id = d.id 
    WHERE LOWER(c.name) = 'ciudad de la costa' AND LOWER(d.name) = 'canelones' LIMIT 1;

    IF v_city_id IS NOT NULL THEN
        FOR row_rec IN SELECT * FROM (VALUES 
            ('Shangrilá'),('Lagomar'),('Solymar'),('El Pinar'),('Lomas de Solymar'),('Colinas de Solymar'),
            ('Parque de Carrasco'),('Barra de Carrasco'),('Paso de Carrasco'),('San José de Carrasco')
        ) AS t(name) LOOP
            INSERT INTO public.neighborhoods (name, city_id)
            SELECT row_rec.name, v_city_id
            WHERE NOT EXISTS (SELECT 1 FROM public.neighborhoods WHERE LOWER(name) = LOWER(row_rec.name) AND city_id = v_city_id);
        END LOOP;
    END IF;

    -- 6. BARRIOS: MELO (CERRO LARGO)
    SELECT c.id INTO v_city_id FROM public.cities c 
    JOIN public.departments d ON c.department_id = d.id
    WHERE LOWER(c.name) = 'melo' AND LOWER(d.name) = 'cerro largo' LIMIT 1;

    IF v_city_id IS NOT NULL THEN
        FOR row_rec IN SELECT * FROM (VALUES 
            ('Centro'),('Sóñora'),('Anido'),('Murguía'),('Collazo'),('García'),('Ruiz'),('Calixto'),
            ('Dársena'),('Arpí'),('Castro'),('Cencelli'),('Villa Andueza'),('Falcon'),('Leone'),
            ('Mendoza'),('Tiririca'),('San Antonio'),('Santa Cruz'),('Artigas')
        ) AS t(name) LOOP
            INSERT INTO public.neighborhoods (name, city_id)
            SELECT row_rec.name, v_city_id
            WHERE NOT EXISTS (SELECT 1 FROM public.neighborhoods WHERE LOWER(name) = LOWER(row_rec.name) AND city_id = v_city_id);
        END LOOP;
    END IF;

    -- 7. BARRIOS: COLONIA DEL SACRAMENTO
    SELECT c.id INTO v_city_id FROM public.cities c 
    JOIN public.departments d ON c.department_id = d.id
    WHERE LOWER(c.name) = 'colonia del sacramento' AND LOWER(d.name) = 'colonia' LIMIT 1;

    IF v_city_id IS NOT NULL THEN
        FOR row_rec IN SELECT * FROM (VALUES 
            ('Barrio Histórico'),('Centro'),('Real de San Carlos'),('Pueblo Nuevo'),('El General'),
            ('San Benito'),('Treinta y Tres'),('Reserva Territorial')
        ) AS t(name) LOOP
            INSERT INTO public.neighborhoods (name, city_id)
            SELECT row_rec.name, v_city_id
            WHERE NOT EXISTS (SELECT 1 FROM public.neighborhoods WHERE LOWER(name) = LOWER(row_rec.name) AND city_id = v_city_id);
        END LOOP;
    END IF;

    -- 8. BARRIOS: FLORIDA (CAPITAL)
    SELECT c.id INTO v_city_id FROM public.cities c 
    JOIN public.departments d ON c.department_id = d.id
    WHERE LOWER(c.name) = 'florida' AND LOWER(d.name) = 'florida' LIMIT 1;

    IF v_city_id IS NOT NULL THEN
        FOR row_rec IN SELECT * FROM (VALUES 
            ('Centro'),('Piedra Alta'),('Prado Español'),('Corralón del Tigre'),('San Fernando'),
            ('San Cono'),('Santarcieri'),('Curuchet'),('Villa María'),('La Calera'),('Burastero')
        ) AS t(name) LOOP
            INSERT INTO public.neighborhoods (name, city_id)
            SELECT row_rec.name, v_city_id
            WHERE NOT EXISTS (SELECT 1 FROM public.neighborhoods WHERE LOWER(name) = LOWER(row_rec.name) AND city_id = v_city_id);
        END LOOP;
    END IF;

    -- 9. BARRIOS: TRINIDAD (FLORES)
    SELECT c.id INTO v_city_id FROM public.cities c 
    JOIN public.departments d ON c.department_id = d.id
    WHERE LOWER(c.name) = 'trinidad' AND LOWER(d.name) = 'flores' LIMIT 1;

    IF v_city_id IS NOT NULL THEN
        FOR row_rec IN SELECT * FROM (VALUES 
            ('Centro'),('Independencia'),('Unión'),('Artigas'),('Centenario'),('Los Gorriones'),
            ('Barrio Nuevo'),('Plaza Flores'),('Progreso'),('Primavera'),('Hipódromo')
        ) AS t(name) LOOP
            INSERT INTO public.neighborhoods (name, city_id)
            SELECT row_rec.name, v_city_id
            WHERE NOT EXISTS (SELECT 1 FROM public.neighborhoods WHERE LOWER(name) = LOWER(row_rec.name) AND city_id = v_city_id);
        END LOOP;
    END IF;

    -- 10. BARRIOS: MINAS (LAVALLEJA)
    SELECT c.id INTO v_city_id FROM public.cities c 
    JOIN public.departments d ON c.department_id = d.id
    WHERE LOWER(c.name) = 'minas' AND LOWER(d.name) = 'lavalleja' LIMIT 1;

    IF v_city_id IS NOT NULL THEN
        FOR row_rec IN SELECT * FROM (VALUES 
            ('Centro'),('Artigas'),('San Francisco'),('Verdun'),('Roma'),('Estación'),('Jardín'),
            ('Barrio Olimar'),('Barrio Filarmónica')
        ) AS t(name) LOOP
            INSERT INTO public.neighborhoods (name, city_id)
            SELECT row_rec.name, v_city_id
            WHERE NOT EXISTS (SELECT 1 FROM public.neighborhoods WHERE LOWER(name) = LOWER(row_rec.name) AND city_id = v_city_id);
        END LOOP;
    END IF;

END $$;
