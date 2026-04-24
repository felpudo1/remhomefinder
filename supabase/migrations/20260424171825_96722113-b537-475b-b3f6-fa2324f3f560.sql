-- Tabla para compartir visitas a agencias dentro de la organización (familia/equipo)
CREATE TABLE public.org_agency_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL,
  agency_id uuid NOT NULL,
  agency_type text NOT NULL,
  visited_by uuid NOT NULL,
  visited_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT org_agency_visits_unique UNIQUE (org_id, agency_type, agency_id)
);

CREATE INDEX idx_org_agency_visits_org ON public.org_agency_visits(org_id);
CREATE INDEX idx_org_agency_visits_lookup ON public.org_agency_visits(org_id, agency_type, agency_id);

ALTER TABLE public.org_agency_visits ENABLE ROW LEVEL SECURITY;

-- Cualquier miembro de la org puede ver las visitas compartidas del grupo
CREATE POLICY "Org members can view org agency visits"
ON public.org_agency_visits
FOR SELECT
TO authenticated
USING (public.is_org_member(auth.uid(), org_id));

-- Solo miembros pueden insertar visitas (y debe ser el propio usuario el que marca)
CREATE POLICY "Org members can insert org agency visits"
ON public.org_agency_visits
FOR INSERT
TO authenticated
WITH CHECK (public.is_org_member(auth.uid(), org_id) AND visited_by = auth.uid());

-- Permitir actualizar visited_at si ya existe (upsert por unique constraint)
CREATE POLICY "Org members can update org agency visits"
ON public.org_agency_visits
FOR UPDATE
TO authenticated
USING (public.is_org_member(auth.uid(), org_id))
WITH CHECK (public.is_org_member(auth.uid(), org_id));
