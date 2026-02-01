-- Fix feature_flags RLS policy to restrict by audience
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view feature flags" ON public.feature_flags;

-- Create a more restrictive policy that respects the audience field
CREATE POLICY "Users can view enabled feature flags for their audience"
ON public.feature_flags FOR SELECT
TO authenticated
USING (
  enabled = true AND
  (
    audience = 'all' OR 
    audience = 'authenticated' OR
    (audience = 'creator' AND has_role(auth.uid(), 'creator')) OR
    (audience = 'admin' AND has_role(auth.uid(), 'admin'))
  )
);