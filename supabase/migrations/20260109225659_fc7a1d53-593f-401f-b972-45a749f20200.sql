-- Fix remaining policies for profiles and clicks

-- Drop existing admin policy to recreate
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR 
  user_id = auth.uid()
);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix clicks policies
DROP POLICY IF EXISTS "Creators can view clicks on own products" ON public.clicks;
DROP POLICY IF EXISTS "Creators can view own product clicks" ON public.clicks;
DROP POLICY IF EXISTS "Admins can view all clicks" ON public.clicks;
DROP POLICY IF EXISTS "Anonymous cannot view clicks" ON public.clicks;
DROP POLICY IF EXISTS "Anyone can insert clicks for tracking" ON public.clicks;
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.clicks;
DROP POLICY IF EXISTS "Public can insert clicks" ON public.clicks;

-- Creators can view clicks ONLY on their own products
CREATE POLICY "Creators can view own product clicks"
ON public.clicks
FOR SELECT
TO authenticated
USING (
  product_id IN (
    SELECT id FROM public.products 
    WHERE creator_id = auth.uid()
  )
);

-- Admins can view all clicks
CREATE POLICY "Admins can view all clicks"
ON public.clicks
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Anonymous cannot view clicks
CREATE POLICY "Anonymous cannot view clicks"
ON public.clicks
FOR SELECT
TO anon
USING (false);

-- Allow click insertion for tracking
CREATE POLICY "Anyone can insert clicks for tracking"
ON public.clicks
FOR INSERT
WITH CHECK (true);