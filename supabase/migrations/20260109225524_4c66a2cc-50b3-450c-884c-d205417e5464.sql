-- Continue fixing security issues (skipping already created policies)

-- 2. FIX: subscriptions - add admin and anonymous policies
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Anonymous cannot view subscriptions" ON public.subscriptions;

CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anonymous cannot view subscriptions"
ON public.subscriptions
FOR SELECT
TO anon
USING (false);

-- 3. FIX: clicks table - restrict to creator's product clicks + admins
DROP POLICY IF EXISTS "Clicks are publicly readable" ON public.clicks;
DROP POLICY IF EXISTS "Public can view clicks" ON public.clicks;
DROP POLICY IF EXISTS "Anyone can view clicks" ON public.clicks;
DROP POLICY IF EXISTS "Creators can view clicks on own products" ON public.clicks;
DROP POLICY IF EXISTS "Admins can view all clicks" ON public.clicks;
DROP POLICY IF EXISTS "Anonymous cannot view clicks" ON public.clicks;

CREATE POLICY "Creators can view clicks on own products"
ON public.clicks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = clicks.product_id
    AND p.creator_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all clicks"
ON public.clicks
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anonymous cannot view clicks"
ON public.clicks
FOR SELECT
TO anon
USING (false);

-- 4. FIX: campaign_applications table - restrict access properly
DROP POLICY IF EXISTS "Campaign applications are publicly readable" ON public.campaign_applications;
DROP POLICY IF EXISTS "Public can view campaign applications" ON public.campaign_applications;
DROP POLICY IF EXISTS "Anyone can view campaign applications" ON public.campaign_applications;
DROP POLICY IF EXISTS "Creators can view own applications" ON public.campaign_applications;
DROP POLICY IF EXISTS "Brands can view applications to their campaigns" ON public.campaign_applications;
DROP POLICY IF EXISTS "Admins can view all campaign applications" ON public.campaign_applications;
DROP POLICY IF EXISTS "Anonymous cannot view campaign applications" ON public.campaign_applications;

CREATE POLICY "Creators can view own applications"
ON public.campaign_applications
FOR SELECT
TO authenticated
USING (creator_id = auth.uid());

CREATE POLICY "Brands can view applications to their campaigns"
ON public.campaign_applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    JOIN public.brands b ON c.brand_id = b.id
    WHERE c.id = campaign_applications.campaign_id
    AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all campaign applications"
ON public.campaign_applications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anonymous cannot view campaign applications"
ON public.campaign_applications
FOR SELECT
TO anon
USING (false);

-- 5. FIX: feature_flags - restrict to authenticated users only
DROP POLICY IF EXISTS "Feature flags are publicly readable" ON public.feature_flags;
DROP POLICY IF EXISTS "Public can view feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Anyone can view feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Authenticated users can view feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Anonymous cannot view feature flags" ON public.feature_flags;

CREATE POLICY "Authenticated users can view feature flags"
ON public.feature_flags
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anonymous cannot view feature flags"
ON public.feature_flags
FOR SELECT
TO anon
USING (false);

-- 6. FIX: admin_settings - restrict to admins only
DROP POLICY IF EXISTS "Admin settings are publicly readable" ON public.admin_settings;
DROP POLICY IF EXISTS "Public can view admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Anyone can view admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can view admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Anonymous cannot view admin settings" ON public.admin_settings;

CREATE POLICY "Admins can view admin settings"
ON public.admin_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anonymous cannot view admin settings"
ON public.admin_settings
FOR SELECT
TO anon
USING (false);

-- 7. FIX: admin_audit_log - restrict to admins only
DROP POLICY IF EXISTS "Admin audit log is publicly readable" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Public can view admin audit log" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Anyone can view admin audit log" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Admins can view admin audit log" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Anonymous cannot view admin audit log" ON public.admin_audit_log;

CREATE POLICY "Admins can view admin audit log"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anonymous cannot view admin audit log"
ON public.admin_audit_log
FOR SELECT
TO anon
USING (false);

-- 8. FIX: campaign_history - restrict to brand owners + admins
DROP POLICY IF EXISTS "Campaign history is publicly readable" ON public.campaign_history;
DROP POLICY IF EXISTS "Public can view campaign history" ON public.campaign_history;
DROP POLICY IF EXISTS "Anyone can view campaign history" ON public.campaign_history;
DROP POLICY IF EXISTS "Brands can view own campaign history" ON public.campaign_history;
DROP POLICY IF EXISTS "Admins can view all campaign history" ON public.campaign_history;
DROP POLICY IF EXISTS "Anonymous cannot view campaign history" ON public.campaign_history;

CREATE POLICY "Brands can view own campaign history"
ON public.campaign_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.brands b
    WHERE b.id = campaign_history.brand_id
    AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all campaign history"
ON public.campaign_history
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anonymous cannot view campaign history"
ON public.campaign_history
FOR SELECT
TO anon
USING (false);

-- 9. FIX: featured_content - restrict properly
DROP POLICY IF EXISTS "Featured content is publicly readable" ON public.featured_content;
DROP POLICY IF EXISTS "Public can view featured content" ON public.featured_content;
DROP POLICY IF EXISTS "Authenticated users can view active featured content" ON public.featured_content;
DROP POLICY IF EXISTS "Anonymous can view active featured content" ON public.featured_content;
DROP POLICY IF EXISTS "Admins can view all featured content" ON public.featured_content;

CREATE POLICY "Authenticated users can view active featured content"
ON public.featured_content
FOR SELECT
TO authenticated
USING (active = true);

CREATE POLICY "Anonymous can view active featured content"
ON public.featured_content
FOR SELECT
TO anon
USING (active = true);

CREATE POLICY "Admins can view all featured content"
ON public.featured_content
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));