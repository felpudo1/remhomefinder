
-- =============================================
-- Migración: Agregar nivel "departamentos" a la jerarquía geográfica
-- Jerarquía resultante: País (campo) → Departamento (tabla) → Ciudad → Barrio
-- =============================================

-- 1. Crear tabla departments
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL DEFAULT 'UY',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índice único para evitar duplicados por país + nombre normalizado
CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_country_name
  ON public.departments (country, LOWER(name));

-- 2. Habilitar RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS: lectura pública, escritura solo admins
CREATE POLICY "Public can read departments"
  ON public.departments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage departments"
  ON public.departments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4. Agregar department_id a cities (NO se elimina cities.country por seguridad)
ALTER TABLE public.cities
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cities_department_id ON public.cities(department_id);

-- 5. Agregar department (texto libre) y department_id a properties
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT '';

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_properties_department_id ON public.properties(department_id);

-- 6. Seed: 19 departamentos de Uruguay
INSERT INTO public.departments (name, country) VALUES
  ('Artigas', 'UY'),
  ('Canelones', 'UY'),
  ('Cerro Largo', 'UY'),
  ('Colonia', 'UY'),
  ('Durazno', 'UY'),
  ('Flores', 'UY'),
  ('Florida', 'UY'),
  ('Lavalleja', 'UY'),
  ('Maldonado', 'UY'),
  ('Montevideo', 'UY'),
  ('Paysandú', 'UY'),
  ('Río Negro', 'UY'),
  ('Rivera', 'UY'),
  ('Rocha', 'UY'),
  ('Salto', 'UY'),
  ('San José', 'UY'),
  ('Soriano', 'UY'),
  ('Tacuarembó', 'UY'),
  ('Treinta y Tres', 'UY')
ON CONFLICT DO NOTHING;

-- 7. Seed: 24 provincias de Argentina (23 + CABA)
INSERT INTO public.departments (name, country) VALUES
  ('Buenos Aires', 'AR'),
  ('CABA', 'AR'),
  ('Catamarca', 'AR'),
  ('Chaco', 'AR'),
  ('Chubut', 'AR'),
  ('Córdoba', 'AR'),
  ('Corrientes', 'AR'),
  ('Entre Ríos', 'AR'),
  ('Formosa', 'AR'),
  ('Jujuy', 'AR'),
  ('La Pampa', 'AR'),
  ('La Rioja', 'AR'),
  ('Mendoza', 'AR'),
  ('Misiones', 'AR'),
  ('Neuquén', 'AR'),
  ('Río Negro', 'AR'),
  ('Salta', 'AR'),
  ('San Juan', 'AR'),
  ('San Luis', 'AR'),
  ('Santa Cruz', 'AR'),
  ('Santa Fe', 'AR'),
  ('Santiago del Estero', 'AR'),
  ('Tierra del Fuego', 'AR'),
  ('Tucumán', 'AR')
ON CONFLICT DO NOTHING;
