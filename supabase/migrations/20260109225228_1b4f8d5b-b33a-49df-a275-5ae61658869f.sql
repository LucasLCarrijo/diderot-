-- Fix profiles_user_id_exposure: Create a public-safe view without user_id
-- and restrict direct table access for anonymous users

-- Create a public-safe view that excludes user_id
CREATE OR REPLACE VIEW public.creator_profiles_public AS
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

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Profiles are publicly readable" ON profiles;

-- Create policy for authenticated users to view all profiles
CREATE POLICY "Authenticated users can view profiles"
ON profiles FOR SELECT TO authenticated
USING (true);

-- Create policy to prevent anonymous users from directly accessing profiles table
-- They should use the creator_profiles_public view instead
CREATE POLICY "Anonymous cannot directly view profiles"
ON profiles FOR SELECT TO anon
USING (false);

-- Grant access to the safe view for both anon and authenticated users
GRANT SELECT ON public.creator_profiles_public TO anon;
GRANT SELECT ON public.creator_profiles_public TO authenticated;