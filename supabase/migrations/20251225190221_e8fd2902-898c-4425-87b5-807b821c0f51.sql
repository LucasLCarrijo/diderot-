-- Create reports table for reporting creators, products, posts
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_type text NOT NULL CHECK (reported_type IN ('user', 'product', 'post')),
  reported_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'fraud', 'copyright', 'impersonation', 'other')),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports (must be authenticated)
CREATE POLICY "Authenticated users can create reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON public.reports
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);

-- Admins can view all reports (using has_role function)
CREATE POLICY "Admins can view all reports"
ON public.reports
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update reports
CREATE POLICY "Admins can update reports"
ON public.reports
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add categories column to profiles table for creator categories
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';

-- Add created_at_formatted for profile about section
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);