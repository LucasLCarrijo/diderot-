-- Add RLS policies for admin access to all relevant tables

-- Products: Admins can view all products
CREATE POLICY "Admins can view all products"
ON public.products FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Posts: Admins can view all posts
CREATE POLICY "Admins can view all posts"
ON public.posts FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Collections: Admins can view all collections
CREATE POLICY "Admins can view all collections"
ON public.collections FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Clicks: Admins can view all clicks
CREATE POLICY "Admins can view all clicks"
ON public.clicks FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Favorites: Admins can view all favorites
CREATE POLICY "Admins can view all favorites"
ON public.favorites FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Follows: Admins can view all follows
CREATE POLICY "Admins can view all follows"
ON public.follows FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Post products: Admins can view all post products (pins)
CREATE POLICY "Admins can view all post products"
ON public.post_products FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Notifications: Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
ON public.notifications FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Entitlements: Admins can view all entitlements
CREATE POLICY "Admins can view all entitlements"
ON public.entitlements FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Subscriptions: Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));