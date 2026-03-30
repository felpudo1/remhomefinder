-- Drop obsolete view and tables
-- property_insights_summary depends on attribute_scores, drop it first

DROP VIEW IF EXISTS public.property_insights_summary;
DROP TABLE IF EXISTS public.attribute_scores;
DROP TABLE IF EXISTS public.feedback_attributes;