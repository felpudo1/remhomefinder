
-- Create enum type for property status
CREATE TYPE public.property_status AS ENUM ('contacted', 'coordinated', 'visited', 'discarded');

-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  price_rent NUMERIC NOT NULL DEFAULT 0,
  price_expenses NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  neighborhood TEXT NOT NULL DEFAULT '',
  sq_meters NUMERIC NOT NULL DEFAULT 0,
  rooms INTEGER NOT NULL DEFAULT 1,
  status property_status NOT NULL DEFAULT 'contacted',
  images TEXT[] NOT NULL DEFAULT '{}',
  ai_summary TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create property comments table
CREATE TABLE public.property_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_comments ENABLE ROW LEVEL SECURITY;

-- Properties RLS: users can only CRUD their own properties
CREATE POLICY "Users can view their own properties"
  ON public.properties FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own properties"
  ON public.properties FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties"
  ON public.properties FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties"
  ON public.properties FOR DELETE USING (auth.uid() = user_id);

-- Comments RLS: users can view comments on their properties, and create comments
CREATE POLICY "Users can view comments on their properties"
  ON public.property_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create comments on their properties"
  ON public.property_comments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own comments"
  ON public.property_comments FOR DELETE
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
