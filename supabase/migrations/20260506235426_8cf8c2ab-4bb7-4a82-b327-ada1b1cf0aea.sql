
CREATE TABLE public.org_agency_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  agency_type text NOT NULL,
  agency_id uuid NOT NULL,
  note text NOT NULL DEFAULT '',
  edited_by uuid NOT NULL,
  edited_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, agency_type, agency_id)
);

CREATE INDEX idx_org_agency_notes_org ON public.org_agency_notes(org_id);

ALTER TABLE public.org_agency_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view org agency notes"
ON public.org_agency_notes FOR SELECT TO authenticated
USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can insert org agency notes"
ON public.org_agency_notes FOR INSERT TO authenticated
WITH CHECK (is_org_member(auth.uid(), org_id) AND edited_by = auth.uid());

CREATE POLICY "Org members can update org agency notes"
ON public.org_agency_notes FOR UPDATE TO authenticated
USING (is_org_member(auth.uid(), org_id))
WITH CHECK (is_org_member(auth.uid(), org_id) AND edited_by = auth.uid());

CREATE POLICY "Org members can delete org agency notes"
ON public.org_agency_notes FOR DELETE TO authenticated
USING (is_org_member(auth.uid(), org_id));
