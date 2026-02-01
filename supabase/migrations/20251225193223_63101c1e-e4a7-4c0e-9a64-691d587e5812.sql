-- ===========================================
-- SECURITY FIX: Remove permissive notification INSERT policy
-- Notifications should ONLY be created via SECURITY DEFINER triggers
-- ===========================================
DROP POLICY IF EXISTS "Anyone can insert notifications" ON notifications;

-- ===========================================
-- SECURITY FIX: Prevent admin role self-assignment
-- Users can only assign 'follower' or 'creator' roles to themselves
-- Admin role must be assigned via service role / backend
-- ===========================================

-- Create function to validate role assignment
CREATE OR REPLACE FUNCTION validate_user_role_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow 'follower' and 'creator' roles to be self-assigned
  IF NEW.role = 'admin' THEN
    RAISE EXCEPTION 'Admin role cannot be self-assigned';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce role validation
DROP TRIGGER IF EXISTS validate_role_insert ON user_roles;
CREATE TRIGGER validate_role_insert
  BEFORE INSERT ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_role_insert();

-- ===========================================
-- SECURITY FIX: Restrict follows visibility
-- Users can only see follows they are involved in
-- ===========================================
DROP POLICY IF EXISTS "Follows are publicly readable" ON follows;

CREATE POLICY "Users can view follows they are involved in"
ON follows
FOR SELECT
USING (
  auth.uid() = follower_id 
  OR auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = creator_id
  )
);

-- Allow public to see follow counts via aggregate view (not individual relationships)
-- Create a materialized view for follower counts that can be queried publicly
CREATE OR REPLACE VIEW public.creator_follower_counts AS
SELECT 
  creator_id,
  COUNT(*) as follower_count
FROM follows
GROUP BY creator_id;

-- ===========================================
-- SECURITY FIX: Add click count trigger to prevent race condition
-- ===========================================
CREATE OR REPLACE FUNCTION increment_product_click_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET click_count = COALESCE(click_count, 0) + 1 
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_click_insert ON clicks;
CREATE TRIGGER on_click_insert
  AFTER INSERT ON clicks
  FOR EACH ROW
  EXECUTE FUNCTION increment_product_click_count();

-- ===========================================
-- SECURITY FIX: Fix profiles INSERT policy to require user_id
-- ===========================================
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);