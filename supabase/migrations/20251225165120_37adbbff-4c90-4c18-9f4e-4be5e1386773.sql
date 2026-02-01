-- Add slug column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Add store/brand column
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS store text;

-- Add monetization type column
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS monetization_type text DEFAULT 'affiliate' CHECK (monetization_type IN ('affiliate', 'coupon', 'recommendation'));

-- Add coupon code column
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS coupon_code text;

-- Add status column for soft delete
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status text DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived'));

-- Add additional images column
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS additional_images text[] DEFAULT '{}';

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_product_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  new_slug text;
  counter integer := 0;
BEGIN
  -- Generate base slug from title
  base_slug := lower(regexp_replace(
    regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  ));
  
  -- Remove consecutive dashes and trim
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  new_slug := base_slug;
  
  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM products WHERE slug = new_slug AND id != COALESCE(NEW.id, gen_random_uuid())) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := new_slug;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate slug
DROP TRIGGER IF EXISTS generate_product_slug_trigger ON public.products;
CREATE TRIGGER generate_product_slug_trigger
  BEFORE INSERT OR UPDATE OF title ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_product_slug();

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Users can update their own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Users can delete their own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Update existing products to have slugs
UPDATE products SET slug = id WHERE slug IS NULL;