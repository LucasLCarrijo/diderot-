-- Add missing columns to clicks table for UTM tracking and device info
ALTER TABLE public.clicks
ADD COLUMN IF NOT EXISTS post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS device text,
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text,
ADD COLUMN IF NOT EXISTS utm_campaign text,
ADD COLUMN IF NOT EXISTS utm_content text,
ADD COLUMN IF NOT EXISTS utm_term text,
ADD COLUMN IF NOT EXISTS ip_hash text;

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_clicks_product_created ON public.clicks(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON public.clicks(created_at DESC);

-- Update RLS policy to allow inserting with new columns
DROP POLICY IF EXISTS "Anyone can track clicks" ON public.clicks;
CREATE POLICY "Anyone can track clicks" ON public.clicks
FOR INSERT WITH CHECK (true);