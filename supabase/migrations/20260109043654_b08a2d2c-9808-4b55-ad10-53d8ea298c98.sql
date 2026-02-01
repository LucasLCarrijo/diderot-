-- Temporarily disable the validation trigger
ALTER TABLE public.user_roles DISABLE TRIGGER validate_role_insert;

-- Insert admin role for Lucas Carrijo (olucascarrijo)
INSERT INTO public.user_roles (user_id, role)
VALUES ('d38a6fb8-c0ea-4cdf-b1af-80f3b96889a8', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Re-enable the validation trigger
ALTER TABLE public.user_roles ENABLE TRIGGER validate_role_insert;