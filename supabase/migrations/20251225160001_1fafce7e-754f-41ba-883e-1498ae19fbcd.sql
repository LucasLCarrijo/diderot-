-- Make user_id nullable in profiles to allow demo data
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policy to also allow reading profiles without user_id
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (user_id IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);