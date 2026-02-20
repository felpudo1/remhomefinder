UPDATE public.properties p
SET created_by_email = u.email
FROM auth.users u
WHERE p.user_id = u.id
AND p.created_by_email = '';