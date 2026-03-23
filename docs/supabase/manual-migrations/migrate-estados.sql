-- DOCUMENTACIÓN / REFERENCIA (no es migración CLI)
-- El esquema oficial vive en supabase/migrations/. Este archivo queda por si hace falta
-- ejecutar a mano en el SQL Editor (p. ej. entorno sin migraciones o tipo ausente).
--
-- Migración: agregar firme_candidato y posible_interes al enum user_listing_status
-- Ejecutá este script en Supabase Dashboard → SQL Editor → New query
--
-- Si el tipo no existe (ej. Lovable), lo crea. Si ya existe, solo agrega los valores nuevos.

-- Paso 1: Crear el tipo si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'user_listing_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.user_listing_status AS ENUM (
      'ingresado', 'contactado', 'visita_coordinada', 'visitado', 'a_analizar', 'descartado',
      'firme_candidato', 'posible_interes'
    );
  END IF;
END $$;

-- Paso 2: Agregar valores nuevos (si el tipo ya existía)
ALTER TYPE public.user_listing_status ADD VALUE IF NOT EXISTS 'firme_candidato';
ALTER TYPE public.user_listing_status ADD VALUE IF NOT EXISTS 'posible_interes';
