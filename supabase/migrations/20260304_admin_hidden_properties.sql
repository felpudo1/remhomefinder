-- Eliminación lógica (soft delete) de propiedades de usuarios por el administrador.
-- El admin puede ocultar una propiedad sin borrarla físicamente de la BD.
-- admin_hidden = true → la propiedad no aparece en el listado del usuario.
-- admin_hidden_at = timestamp de cuándo fue ocultada.
-- admin_hidden_by = email del admin que la ocultó (para auditoría).

ALTER TABLE public.properties
  ADD COLUMN admin_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN admin_hidden_at timestamptz NULL,
  ADD COLUMN admin_hidden_by text NULL;
