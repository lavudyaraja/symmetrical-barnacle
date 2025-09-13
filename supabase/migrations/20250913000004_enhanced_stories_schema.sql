-- Enhanced Stories Database Schema
-- This migration adds all the advanced story features

-- Extend existing stories table with new columns
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS text_overlays JSONB;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS stickers JSONB;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS filters JSONB;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS music JSONB;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS poll JSONB;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Story Views table
CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Story Reactions table
CREATE TABLE IF NOT EXISTS public.story_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Story Replies table
CREATE TABLE IF NOT EXISTS public.story_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Story Highlights table
CREATE TABLE IF NOT EXISTS public.story_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Highlight',
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Story Poll Votes table
CREATE TABLE IF NOT EXISTS public.story_poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Story Analytics table (for detailed analytics)
CREATE TABLE IF NOT EXISTS public.story_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'reaction', 'reply', 'share', 'screenshot')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Friendships table for close friends feature
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  is_close_friend BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for story_views
CREATE POLICY "Users can view all story views" 
ON public.story_views FOR SELECT 
USING (true);

CREATE POLICY "Users can create story views" 
ON public.story_views FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for story_reactions
CREATE POLICY "Users can view all story reactions" 
ON public.story_reactions FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own reactions" 
ON public.story_reactions FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for story_replies
CREATE POLICY "Users can view story replies" 
ON public.story_replies FOR SELECT 
USING (true);

CREATE POLICY "Users can create story replies" 
ON public.story_replies FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies" 
ON public.story_replies FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for story_highlights
CREATE POLICY "Users can view all highlights" 
ON public.story_highlights FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own highlights" 
ON public.story_highlights FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for story_poll_votes
CREATE POLICY "Story owners can view poll votes" 
ON public.story_poll_votes FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_poll_votes.story_id 
    AND stories.user_id = auth.uid()
  )
);

CREATE POLICY "Users can vote on polls" 
ON public.story_poll_votes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for story_analytics
CREATE POLICY "Story owners can view analytics" 
ON public.story_analytics FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_analytics.story_id 
    AND stories.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create analytics events" 
ON public.story_analytics FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for friendships
CREATE POLICY "Users can view their friendships" 
ON public.friendships FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can manage their friendships" 
ON public.friendships FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Functions and Triggers

-- Function to update views count
CREATE OR REPLACE FUNCTION update_story_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.stories 
  SET views_count = (
    SELECT COUNT(*) 
    FROM public.story_views 
    WHERE story_id = NEW.story_id
  )
  WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for views count
CREATE TRIGGER update_story_views_count_trigger
  AFTER INSERT ON public.story_views
  FOR EACH ROW
  EXECUTE FUNCTION update_story_views_count();

-- Function to create analytics events
CREATE OR REPLACE FUNCTION create_story_analytics_event(
  p_story_id UUID,
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.story_analytics (story_id, event_type, user_id, metadata)
  VALUES (p_story_id, p_event_type, p_user_id, p_metadata)
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get story feed with recommendations
CREATE OR REPLACE FUNCTION get_story_feed_for_user(
  p_user_id UUID,
  p_filter TEXT DEFAULT 'all'
)
RETURNS TABLE (
  story_id UUID,
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  views_count INTEGER,
  is_viewed BOOLEAN,
  reaction_count INTEGER,
  reply_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as story_id,
    s.user_id,
    p.username,
    p.avatar_url,
    s.content,
    s.media_url,
    s.media_type,
    s.created_at,
    s.expires_at,
    s.views_count,
    (sv.user_id IS NOT NULL) as is_viewed,
    (SELECT COUNT(*) FROM story_reactions sr WHERE sr.story_id = s.id)::INTEGER as reaction_count,
    (SELECT COUNT(*) FROM story_replies srp WHERE srp.story_id = s.id)::INTEGER as reply_count
  FROM public.stories s
  LEFT JOIN public.profiles p ON s.user_id = p.id
  LEFT JOIN public.story_views sv ON s.id = sv.story_id AND sv.user_id = p_user_id
  WHERE s.expires_at > NOW()
    AND (
      p_filter = 'all' 
      OR (p_filter = 'close-friends' AND EXISTS (
        SELECT 1 FROM public.friendships f 
        WHERE f.user_id = p_user_id 
        AND f.friend_id = s.user_id 
        AND f.status = 'accepted' 
        AND f.is_close_friend = true
      ))
    )
  ORDER BY 
    CASE WHEN s.user_id = p_user_id THEN 1 ELSE 2 END,
    CASE WHEN sv.user_id IS NULL THEN 1 ELSE 2 END,
    s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_story_views_story_user ON public.story_views(story_id, user_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_story ON public.story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_replies_story ON public.story_replies(story_id);
CREATE INDEX IF NOT EXISTS idx_story_highlights_user ON public.story_highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_story_analytics_story ON public.story_analytics(story_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_friend ON public.friendships(user_id, friend_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_user_created ON public.stories(user_id, created_at);

-- Comments for documentation
COMMENT ON TABLE public.story_views IS 'Tracks which users have viewed which stories';
COMMENT ON TABLE public.story_reactions IS 'Stores emoji reactions to stories';
COMMENT ON TABLE public.story_replies IS 'Stores text replies to stories';
COMMENT ON TABLE public.story_highlights IS 'Stores user story highlights/collections';
COMMENT ON TABLE public.story_poll_votes IS 'Stores votes for story polls';
COMMENT ON TABLE public.story_analytics IS 'Detailed analytics for story interactions';
COMMENT ON TABLE public.friendships IS 'User friendship relationships and close friends';