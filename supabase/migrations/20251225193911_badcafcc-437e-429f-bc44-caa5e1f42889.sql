-- ===========================================
-- FIX: Make creator_follower_counts view accessible
-- This is public aggregate data (follower counts), not individual relationships
-- ===========================================

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.creator_follower_counts TO anon, authenticated;

-- ===========================================
-- FIX: Restrict click insertion to authenticated users with valid data
-- ===========================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can track clicks" ON clicks;

-- Create a more secure policy that requires authentication
-- and validates user_id matches the authenticated user when provided
CREATE POLICY "Authenticated users can track clicks"
ON clicks
FOR INSERT
TO authenticated
WITH CHECK (
  -- user_id must be NULL or match the authenticated user
  (user_id IS NULL OR user_id = auth.uid())
);

-- Also allow anonymous tracking for unauthenticated users (needed for analytics)
-- but force user_id to be NULL
CREATE POLICY "Anonymous users can track clicks"
ON clicks
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);