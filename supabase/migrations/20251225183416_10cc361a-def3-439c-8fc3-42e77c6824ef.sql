-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('follow', 'favorite', 'click', 'comment')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  actor_id UUID, -- who triggered the notification
  resource_id UUID, -- product_id, post_id, etc
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- System can insert notifications (using service role or triggers)
CREATE POLICY "Anyone can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Function to create notification on follow
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_profile profiles%ROWTYPE;
  creator_profile profiles%ROWTYPE;
BEGIN
  -- Get follower profile
  SELECT * INTO follower_profile FROM profiles WHERE id = NEW.follower_id;
  -- Get creator profile to get their user_id
  SELECT * INTO creator_profile FROM profiles WHERE id = NEW.creator_id;
  
  IF creator_profile.user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, actor_id, resource_id)
    VALUES (
      creator_profile.user_id,
      'follow',
      'Novo seguidor',
      COALESCE(follower_profile.name, follower_profile.username) || ' começou a seguir você',
      '/@' || follower_profile.username,
      NEW.follower_id,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for follow notifications
CREATE TRIGGER on_new_follow
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION create_follow_notification();

-- Function to create notification on favorite
CREATE OR REPLACE FUNCTION public.create_favorite_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  product_record products%ROWTYPE;
  creator_profile profiles%ROWTYPE;
  user_profile profiles%ROWTYPE;
BEGIN
  -- Get product
  SELECT * INTO product_record FROM products WHERE id = NEW.product_id;
  -- Get creator profile to get their user_id
  SELECT * INTO creator_profile FROM profiles WHERE id = product_record.creator_id;
  -- Get user profile who favorited
  SELECT * INTO user_profile FROM profiles WHERE user_id = NEW.user_id;
  
  -- Don't notify if user favorited their own product
  IF creator_profile.user_id IS NOT NULL AND creator_profile.user_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, actor_id, resource_id)
    VALUES (
      creator_profile.user_id,
      'favorite',
      'Novo favorito',
      COALESCE(user_profile.name, user_profile.username, 'Alguém') || ' favoritou ' || product_record.title,
      '/p/' || product_record.slug,
      (SELECT id FROM profiles WHERE user_id = NEW.user_id),
      NEW.product_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for favorite notifications
CREATE TRIGGER on_new_favorite
AFTER INSERT ON favorites
FOR EACH ROW
EXECUTE FUNCTION create_favorite_notification();