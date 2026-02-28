
-- Enum for marketplace property status
CREATE TYPE public.marketplace_property_status AS ENUM ('active', 'paused', 'sold');

-- Marketplace properties table
CREATE TABLE public.marketplace_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  price_rent numeric NOT NULL DEFAULT 0,
  price_expenses numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  neighborhood text NOT NULL DEFAULT '',
  sq_meters numeric NOT NULL DEFAULT 0,
  rooms integer NOT NULL DEFAULT 1,
  images text[] NOT NULL DEFAULT '{}',
  status marketplace_property_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add source_marketplace_id to properties
ALTER TABLE public.properties
  ADD COLUMN source_marketplace_id uuid REFERENCES public.marketplace_properties(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.marketplace_properties ENABLE ROW LEVEL SECURITY;

-- RLS: All authenticated users can read active marketplace properties
CREATE POLICY "Anyone can view active marketplace properties"
  ON public.marketplace_properties
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- RLS: Agency members can view all their agency's properties (including paused/sold)
CREATE POLICY "Agency members can view own agency properties"
  ON public.marketplace_properties
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_members.agency_id = marketplace_properties.agency_id
        AND agency_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.agencies
      WHERE agencies.id = marketplace_properties.agency_id
        AND agencies.created_by = auth.uid()
    )
  );

-- RLS: Agency members can insert
CREATE POLICY "Agency members can insert marketplace properties"
  ON public.marketplace_properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_members.agency_id = marketplace_properties.agency_id
        AND agency_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.agencies
      WHERE agencies.id = marketplace_properties.agency_id
        AND agencies.created_by = auth.uid()
    )
  );

-- RLS: Agency members can update their properties
CREATE POLICY "Agency members can update marketplace properties"
  ON public.marketplace_properties
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_members.agency_id = marketplace_properties.agency_id
        AND agency_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.agencies
      WHERE agencies.id = marketplace_properties.agency_id
        AND agencies.created_by = auth.uid()
    )
  );

-- RLS: Agency members can delete their properties
CREATE POLICY "Agency members can delete marketplace properties"
  ON public.marketplace_properties
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_members.agency_id = marketplace_properties.agency_id
        AND agency_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.agencies
      WHERE agencies.id = marketplace_properties.agency_id
        AND agencies.created_by = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_marketplace_properties_updated_at
  BEFORE UPDATE ON public.marketplace_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
