
-- Fix existing agency creators: assign 'agency' role to users who created agencies but only have 'user' role
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT a.created_by, 'agency'::app_role
FROM public.agencies a
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = a.created_by AND ur.role = 'agency'
)
ON CONFLICT (user_id, role) DO NOTHING;
