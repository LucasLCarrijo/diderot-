-- Fix SECURITY DEFINER view warning by recreating view with SECURITY INVOKER
-- This ensures the view uses the permissions of the querying user

DROP VIEW IF EXISTS public.creator_profiles_public;

CREATE VIEW public.creator_profiles_public 
WITH (security_invoker = true) AS
SELECT 
  id, 
  username, 
  name, 
  bio, 
  avatar_url,
  instagram_url, 
  tiktok_url, 
  youtube_url, 
  website_url,
  is_verified, 
  categories, 
  created_at, 
  updated_at
FROM profiles;

-- Re-grant access to the safe view
GRANT SELECT ON public.creator_profiles_public TO anon;
GRANT SELECT ON public.creator_profiles_public TO authenticated;