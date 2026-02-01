-- Add rate limiting for click tracking
-- Uses ip_hash to limit clicks per IP address to 1000/hour

CREATE OR REPLACE FUNCTION public.check_click_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  click_count INTEGER;
BEGIN
  -- Only rate limit if ip_hash is provided
  IF NEW.ip_hash IS NOT NULL AND NEW.ip_hash != '' THEN
    SELECT COUNT(*) INTO click_count
    FROM clicks
    WHERE ip_hash = NEW.ip_hash
      AND created_at > NOW() - INTERVAL '1 hour';
    
    IF click_count >= 1000 THEN
      RAISE EXCEPTION 'Rate limit exceeded: maximum 1000 clicks per hour';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for click rate limiting
DROP TRIGGER IF EXISTS check_click_rate_limit_trigger ON clicks;
CREATE TRIGGER check_click_rate_limit_trigger
  BEFORE INSERT ON clicks
  FOR EACH ROW
  EXECUTE FUNCTION public.check_click_rate_limit();

-- Add index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_clicks_ip_hash_created_at ON clicks(ip_hash, created_at) WHERE ip_hash IS NOT NULL;