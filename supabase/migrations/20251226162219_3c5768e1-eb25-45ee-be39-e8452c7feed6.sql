-- Security Fix 1: Add database-level rate limiting triggers
-- This provides a first line of defense against spam

-- Prevent favorite spam (max 100 per hour per user)
CREATE OR REPLACE FUNCTION public.check_favorite_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM favorites
  WHERE user_id = NEW.user_id
  AND created_at > NOW() - INTERVAL '1 hour';
  
  IF recent_count >= 100 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 100 favorites per hour';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_favorite_rate_limit_trigger
BEFORE INSERT ON favorites
FOR EACH ROW
EXECUTE FUNCTION public.check_favorite_rate_limit();

-- Prevent product creation spam (max 50 per hour per creator)
CREATE OR REPLACE FUNCTION public.check_product_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM products
  WHERE creator_id = NEW.creator_id
  AND created_at > NOW() - INTERVAL '1 hour';
  
  IF recent_count >= 50 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 50 products per hour';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_product_rate_limit_trigger
BEFORE INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION public.check_product_rate_limit();

-- Prevent post creation spam (max 50 per hour per creator)
CREATE OR REPLACE FUNCTION public.check_post_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM posts
  WHERE creator_id = NEW.creator_id
  AND created_at > NOW() - INTERVAL '1 hour';
  
  IF recent_count >= 50 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 50 posts per hour';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_post_rate_limit_trigger
BEFORE INSERT ON posts
FOR EACH ROW
EXECUTE FUNCTION public.check_post_rate_limit();

-- Prevent follow spam (max 200 per hour per user)
CREATE OR REPLACE FUNCTION public.check_follow_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM follows
  WHERE follower_id = NEW.follower_id
  AND created_at > NOW() - INTERVAL '1 hour';
  
  IF recent_count >= 200 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 200 follows per hour';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_follow_rate_limit_trigger
BEFORE INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION public.check_follow_rate_limit();

-- Security Fix 2: Drop unprotected analytics view
-- Follower counts should be computed on-demand with proper access control
DROP VIEW IF EXISTS public.creator_follower_counts;

-- Create a secure function to get follower count (only for own profile or public counts)
CREATE OR REPLACE FUNCTION public.get_follower_count(p_creator_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM follows
  WHERE creator_id = p_creator_id
$$;