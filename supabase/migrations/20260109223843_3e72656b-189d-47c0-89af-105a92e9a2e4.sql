-- =====================================================
-- SECURITY FIX 1: Fix user_roles privilege escalation
-- =====================================================

-- Drop the vulnerable policy that allows any role assignment
DROP POLICY IF EXISTS "Users can add their own roles" ON public.user_roles;

-- Create policy that only allows 'follower' and 'creator' role self-assignment
-- Admin role can NEVER be self-assigned via RLS
CREATE POLICY "Users can add follower or creator roles only"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND 
  role IN ('follower', 'creator')
);

-- Admins can assign any role (including admin to others)
CREATE POLICY "Admins can assign any role"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

-- Update the validation trigger to be more robust
CREATE OR REPLACE FUNCTION public.validate_user_role_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Block admin role unless inserted by existing admin
  IF NEW.role = 'admin' AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role cannot be self-assigned';
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS validate_user_role_insert ON public.user_roles;
CREATE TRIGGER validate_user_role_insert
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_role_insert();

-- =====================================================
-- SECURITY FIX 2: Fix storage bucket ownership policies
-- =====================================================

-- Drop old vulnerable policies for product-images
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own product images" ON storage.objects;

-- Drop old vulnerable policies for avatars
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Drop old vulnerable policies for post-images
DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;

-- =====================================================
-- NEW SECURE POLICIES: product-images bucket
-- Users can only upload/update/delete in their own folder
-- =====================================================

CREATE POLICY "Users can upload to their product-images folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own product images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own product images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- NEW SECURE POLICIES: avatars bucket
-- =====================================================

CREATE POLICY "Users can upload to their avatars folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- NEW SECURE POLICIES: post-images bucket
-- =====================================================

CREATE POLICY "Users can upload to their post-images folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'post-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own post images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'post-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own post images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'post-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);