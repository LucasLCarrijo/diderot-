-- Fix the SECURITY DEFINER view issue by dropping and recreating as SECURITY INVOKER
DROP VIEW IF EXISTS public.creator_follower_counts;

-- Create view without SECURITY DEFINER (uses invoker's permissions by default)
CREATE VIEW public.creator_follower_counts 
WITH (security_invoker = true)
AS
SELECT 
  creator_id,
  COUNT(*) as follower_count
FROM follows
GROUP BY creator_id;