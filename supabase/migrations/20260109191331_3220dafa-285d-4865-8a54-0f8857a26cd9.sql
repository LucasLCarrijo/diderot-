-- Enable realtime for tables needed in admin dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.clicks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;