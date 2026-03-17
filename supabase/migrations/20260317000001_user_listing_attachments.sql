-- Fotos privadas por familia: visibles solo para la org, no en properties
CREATE TABLE IF NOT EXISTS public.user_listing_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_listing_id uuid NOT NULL REFERENCES public.user_listings(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  added_by uuid NOT NULL REFERENCES public.profiles(user_id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_listing_attachments_listing
  ON public.user_listing_attachments(user_listing_id);

ALTER TABLE public.user_listing_attachments ENABLE ROW LEVEL SECURITY;

-- Solo miembros de la org pueden ver los attachments de sus listings
CREATE POLICY "Org members can view attachments"
  ON public.user_listing_attachments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_listings ul
      WHERE ul.id = user_listing_id
      AND (public.is_org_member(auth.uid(), ul.org_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Solo miembros de la org pueden insertar (cualquier miembro de la familia)
CREATE POLICY "Org members can insert attachments"
  ON public.user_listing_attachments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_listings ul
      WHERE ul.id = user_listing_id
      AND public.is_org_member(auth.uid(), ul.org_id)
    )
  );

-- Solo quien agregó puede borrar (o admin)
CREATE POLICY "Added by or admin can delete attachments"
  ON public.user_listing_attachments FOR DELETE TO authenticated
  USING (added_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
