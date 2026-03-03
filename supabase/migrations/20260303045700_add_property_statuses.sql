-- Primero, habilitamos la adición de nuevos valores al tipo ENUM marketplace_property_status
-- Ojo: ALTER TYPE ADD VALUE no puede ejecutarse dentro de un bloque de transacción
ALTER TYPE marketplace_property_status ADD VALUE IF NOT EXISTS 'reserved';
ALTER TYPE marketplace_property_status ADD VALUE IF NOT EXISTS 'rented';
ALTER TYPE marketplace_property_status ADD VALUE IF NOT EXISTS 'deleted';
