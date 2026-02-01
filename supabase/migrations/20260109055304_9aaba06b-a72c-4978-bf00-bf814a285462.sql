-- Create brands table for company profiles
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  legal_name text,
  cnpj text UNIQUE NOT NULL,
  website text,
  logo_url text,
  segment text,
  company_size text CHECK (company_size IN ('MEI', 'Pequena', 'Média', 'Grande')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'suspended')),
  verified_at timestamp with time zone,
  verified_by uuid,
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  briefing text,
  budget numeric NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  categories text[] DEFAULT '{}',
  min_followers integer,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  requirements text,
  assets text[] DEFAULT '{}',
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create campaign_applications table
CREATE TABLE public.campaign_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message text,
  proposed_deliverables text,
  proposed_fee numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, creator_id)
);

-- Create campaign_history table for audit trail
CREATE TABLE public.campaign_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  description text NOT NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  amount numeric,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_history ENABLE ROW LEVEL SECURITY;

-- Brands policies
CREATE POLICY "Brands are publicly readable" ON public.brands
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own brand" ON public.brands
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all brands" ON public.brands
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Campaigns policies
CREATE POLICY "Active campaigns are publicly readable" ON public.campaigns
  FOR SELECT USING (status = 'active');

CREATE POLICY "Brands can manage their own campaigns" ON public.campaigns
  FOR ALL USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all campaigns" ON public.campaigns
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Campaign applications policies
CREATE POLICY "Creators can view their own applications" ON public.campaign_applications
  FOR SELECT USING (creator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Creators can create applications" ON public.campaign_applications
  FOR INSERT WITH CHECK (creator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Brands can view applications to their campaigns" ON public.campaign_applications
  FOR SELECT USING (campaign_id IN (
    SELECT c.id FROM campaigns c 
    JOIN brands b ON c.brand_id = b.id 
    WHERE b.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all applications" ON public.campaign_applications
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Campaign history policies
CREATE POLICY "Admins can view all history" ON public.campaign_history
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert history" ON public.campaign_history
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_brands_user_id ON public.brands(user_id);
CREATE INDEX idx_brands_status ON public.brands(status);
CREATE INDEX idx_campaigns_brand_id ON public.campaigns(brand_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaign_applications_campaign_id ON public.campaign_applications(campaign_id);
CREATE INDEX idx_campaign_applications_creator_id ON public.campaign_applications(creator_id);
CREATE INDEX idx_campaign_applications_status ON public.campaign_applications(status);
CREATE INDEX idx_campaign_history_brand_id ON public.campaign_history(brand_id);
CREATE INDEX idx_campaign_history_created_at ON public.campaign_history(created_at DESC);