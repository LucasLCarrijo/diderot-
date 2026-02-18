-- =============================================================
-- Migration: role column on profiles + subscription columns
--            + subscription RLS + products RLS fix
-- =============================================================

-- 1. Add role column to profiles (idempotent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'follower'
  CHECK (role IN ('creator', 'follower'));

-- 2. Index for fast role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. Add missing columns to subscriptions (idempotent)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan TEXT
    CHECK (plan IN ('monthly', 'annual'))
    DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;

-- 4. updated_at auto-maintenance function (shared)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 5. RLS for subscriptions (already enabled in base schema, but policies need to be right)
DROP POLICY IF EXISTS "Users can read own subscription" ON public.subscriptions;
CREATE POLICY "Users can read own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages subscriptions" ON public.subscriptions;
CREATE POLICY "Service role manages subscriptions" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- 6. Fix products RLS
--    Public can only see published products from creators with active/trialing subscription.
--    Creators can always read their own products (dashboard needs this regardless of sub status).

DROP POLICY IF EXISTS "Products are viewable by everyone." ON public.products;

CREATE POLICY "Public can read active creator products" ON public.products
  FOR SELECT
  USING (
    -- Creator always sees their own products
    auth.uid() = creator_id
    OR
    -- Public sees published products only when creator subscription is active/trialing
    (
      is_published = true
      AND EXISTS (
        SELECT 1 FROM public.subscriptions s
        WHERE s.user_id = products.creator_id
          AND s.status IN ('active', 'trialing')
      )
    )
  );
