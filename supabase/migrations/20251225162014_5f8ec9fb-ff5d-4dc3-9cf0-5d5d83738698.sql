-- Create favorites table for users to save products
CREATE TABLE public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for favorites
CREATE POLICY "Users can view their own favorites"
ON public.favorites
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
ON public.favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their favorites"
ON public.favorites
FOR DELETE
USING (auth.uid() = user_id);

-- Create clicks table for tracking affiliate link clicks
CREATE TABLE public.clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referrer text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clicks - anyone can insert (for tracking)
CREATE POLICY "Anyone can track clicks"
ON public.clicks
FOR INSERT
WITH CHECK (true);

-- Creators can view clicks on their products
CREATE POLICY "Creators can view clicks on their products"
ON public.clicks
FOR SELECT
USING (
  product_id IN (
    SELECT p.id FROM products p
    JOIN profiles pr ON p.creator_id = pr.id
    WHERE pr.user_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_product_id ON public.favorites(product_id);
CREATE INDEX idx_clicks_product_id ON public.clicks(product_id);
CREATE INDEX idx_clicks_created_at ON public.clicks(created_at);

-- Add favorite_count to products for display (will be updated via trigger)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS favorite_count integer DEFAULT 0;

-- Create function to update favorite count
CREATE OR REPLACE FUNCTION public.update_product_favorite_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET favorite_count = favorite_count + 1 WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products SET favorite_count = favorite_count - 1 WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for favorite count
CREATE TRIGGER on_favorite_change
  AFTER INSERT OR DELETE ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION public.update_product_favorite_count();