-- Create admin_settings table for system configuration
CREATE TABLE public.admin_settings (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create featured_content table for homepage highlights
CREATE TABLE public.featured_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('creator', 'product', 'collection')),
  content_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create feature_flags table for feature management
CREATE TABLE public.feature_flags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  audience TEXT DEFAULT 'all' CHECK (audience IN ('all', 'pro', 'whitelist')),
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create admin_audit_log table for tracking admin actions
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_settings
CREATE POLICY "Admins can manage settings"
ON public.admin_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for featured_content
CREATE POLICY "Featured content is publicly readable"
ON public.featured_content FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage featured content"
ON public.featured_content FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for feature_flags
CREATE POLICY "Feature flags are publicly readable"
ON public.feature_flags FOR SELECT
USING (true);

CREATE POLICY "Admins can manage feature flags"
ON public.feature_flags FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for admin_audit_log
CREATE POLICY "Admins can read audit log"
ON public.admin_audit_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert audit log"
ON public.admin_audit_log FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default feature flags
INSERT INTO public.feature_flags (id, name, description, enabled, rollout_percentage, audience) VALUES
('dark_mode', 'Dark Mode', 'Enable dark mode across the platform', true, 100, 'all'),
('ai_recommendations', 'AI Recommendations', 'AI-powered product recommendations in feed', false, 0, 'pro'),
('video_posts', 'Video Posts', 'Allow creators to upload video posts', false, 25, 'pro'),
('advanced_analytics', 'Advanced Analytics', 'Extended analytics dashboard for creators', true, 100, 'pro'),
('brand_campaigns', 'Brand Campaigns', 'Enable brand campaign features', true, 100, 'all');

-- Insert default admin settings
INSERT INTO public.admin_settings (id, category, key, value) VALUES
('rate_limits_api', 'rate_limits', 'api_requests_per_hour', '{"free": 1000, "pro": 5000}'),
('rate_limits_uploads', 'rate_limits', 'uploads_per_hour', '{"value": 20}'),
('rate_limits_products', 'rate_limits', 'products_per_hour', '{"value": 50}'),
('storage_limits_avatar', 'storage_limits', 'avatar_max_size_mb', '{"value": 5}'),
('storage_limits_product', 'storage_limits', 'product_image_max_size_mb', '{"value": 10}'),
('storage_limits_post', 'storage_limits', 'post_image_max_size_mb', '{"value": 10}'),
('algorithm_trending', 'algorithm_weights', 'trending', '{"clicks": 40, "favorites": 30, "recency": 30}'),
('algorithm_for_you', 'algorithm_weights', 'for_you', '{"clicks": 35, "favorites": 25, "recency": 25, "following": 15}');