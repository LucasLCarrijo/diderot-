-- Fix PUBLIC_DATA_EXPOSURE: Restrict brands table access and create public view
-- This migration fixes the critical security vulnerability exposing CNPJ (Brazilian tax IDs) and admin notes

-- Drop the overly permissive policy that allows public access to all brand data
DROP POLICY IF EXISTS "Brands are publicly readable" ON public.brands;

-- Also drop the previously created authenticated-only verified brands policy if it exists
DROP POLICY IF EXISTS "Authenticated can view verified brands" ON public.brands;

-- Keep the existing owner and admin policies (they should already exist from previous migrations)
-- If they don't exist, create them now
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'brands' AND policyname = 'Users can manage their own brand'
  ) THEN
    CREATE POLICY "Users can manage their own brand"
    ON public.brands FOR ALL
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'brands' AND policyname = 'Admins can manage all brands'
  ) THEN
    CREATE POLICY "Admins can manage all brands"
    ON public.brands FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Create a secure public view that exposes ONLY safe, non-sensitive fields
-- This view hides CNPJ, legal_name, admin_notes, and verification details
CREATE OR REPLACE VIEW public.brands_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  company_name,
  website,
  logo_url,
  segment,
  company_size,
  status,
  created_at
FROM public.brands
WHERE status = 'verified';  -- Only show verified brands publicly

-- Grant access to the view for all users
GRANT SELECT ON public.brands_public TO authenticated;
GRANT SELECT ON public.brands_public TO anon;