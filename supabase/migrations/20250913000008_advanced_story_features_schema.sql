-- Migration: Enhanced Stories Schema for Advanced Features
-- This migration adds all the advanced story features to the database

-- Add new columns to stories table for advanced features
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS ai_captions JSONB,
ADD COLUMN IF NOT EXISTS ai_hashtags TEXT[],
ADD COLUMN IF NOT EXISTS ai_mood_filters JSONB,
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS voice_transcription TEXT,
ADD COLUMN IF NOT EXISTS engagement_prediction JSONB,
ADD COLUMN IF NOT EXISTS smart_suggestions JSONB,
ADD COLUMN IF NOT EXISTS remix_versions JSONB,
ADD COLUMN IF NOT EXISTS multi_view_data JSONB,
ADD COLUMN IF NOT EXISTS ar_elements JSONB,
ADD COLUMN IF NOT EXISTS location_data JSONB,
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS private_circle_id UUID REFERENCES public.story_circles(id),
ADD COLUMN IF NOT NOT EXISTS unlock_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS time_capsule BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS interactive_elements JSONB,
ADD COLUMN IF NOT EXISTS live_session_id UUID,
ADD COLUMN IF NOT EXISTS analytics_data JSONB;

-- Create table for private story circles
CREATE TABLE IF NOT EXISTS public.story_circles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  members UUID[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for story time capsules
CREATE TABLE IF NOT EXISTS public.story_time_capsules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  unlock_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_unlocked BOOLEAN DEFAULT false
);

-- Create table for scheduled stories
CREATE TABLE IF NOT EXISTS public.scheduled_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_data JSONB NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'cancelled'))
);

-- Create table for story remixes
CREATE TABLE IF NOT EXISTS public.story_remixes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  remixed_story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  remix_style TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for multi-view stories
CREATE TABLE IF NOT EXISTS public.multi_view_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  view_data JSONB NOT NULL,
  positions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for live interactive stories
CREATE TABLE IF NOT EXISTS public.live_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  viewers_count INTEGER DEFAULT 0,
  reactions JSONB,
  voice_messages JSONB,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Create table for location-aware stickers
CREATE TABLE IF NOT EXISTS public.location_stickers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  location_data JSONB NOT NULL,
  sticker_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for story analytics
CREATE TABLE IF NOT EXISTS public.story_analytics_advanced (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  views_data JSONB,
  reactions_data JSONB,
  replies_data JSONB,
  shares_data JSONB,
  demographics_data JSONB,
  engagement_data JSONB,
  heatmap_data JSONB,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for top fans ranking
CREATE TABLE IF NOT EXISTS public.top_fans_ranking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  engagement_score INTEGER NOT NULL,
  views_count INTEGER NOT NULL DEFAULT 0,
  reactions_count INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ranked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_scheduled ON public.stories(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stories_private ON public.stories(is_private) WHERE is_private = true;
CREATE INDEX IF NOT EXISTS idx_stories_time_capsule ON public.stories(time_capsule) WHERE time_capsule = true;
CREATE INDEX IF NOT EXISTS idx_stories_unlock_date ON public.stories(unlock_date) WHERE unlock_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_story_circles_creator ON public.story_circles(creator_id);
CREATE INDEX IF NOT EXISTS idx_story_time_capsules_unlock ON public.story_time_capsules(unlock_date, is_unlocked);
CREATE INDEX IF NOT EXISTS idx_scheduled_stories_user_time ON public.scheduled_stories(user_id, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_stories_status ON public.scheduled_stories(status);
CREATE INDEX IF NOT EXISTS idx_live_stories_session ON public.live_stories(session_id);
CREATE INDEX IF NOT EXISTS idx_live_stories_active ON public.live_stories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_top_fans_story ON public.top_fans_ranking(story_id);
CREATE INDEX IF NOT EXISTS idx_top_fans_score ON public.top_fans_ranking(engagement_score DESC);

-- Enable RLS on new tables
ALTER TABLE public.story_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_time_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_remixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_view_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_analytics_advanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.top_fans_ranking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for story_circles
CREATE POLICY "Users can view their own circles"
ON public.story_circles FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "Users can create circles"
ON public.story_circles FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own circles"
ON public.story_circles FOR UPDATE
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own circles"
ON public.story_circles FOR DELETE
USING (auth.uid() = creator_id);

-- RLS Policies for story_time_capsules
CREATE POLICY "Users can view their own time capsules"
ON public.story_time_capsules FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_time_capsules.story_id 
    AND stories.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create time capsules"
ON public.story_time_capsules FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_time_capsules.story_id 
    AND stories.user_id = auth.uid()
  )
);

-- RLS Policies for scheduled_stories
CREATE POLICY "Users can view their own scheduled stories"
ON public.scheduled_stories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create scheduled stories"
ON public.scheduled_stories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled stories"
ON public.scheduled_stories FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for story_remixes
CREATE POLICY "Users can view remixes of their stories"
ON public.story_remixes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stories s1
    JOIN public.stories s2 ON s2.id = story_remixes.remixed_story_id
    WHERE s1.id = story_remixes.original_story_id
    AND (s1.user_id = auth.uid() OR s2.user_id = auth.uid())
  )
);

-- RLS Policies for multi_view_stories
CREATE POLICY "Users can view multi-view data of their stories"
ON public.multi_view_stories FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = multi_view_stories.story_id 
    AND stories.user_id = auth.uid()
  )
);

-- RLS Policies for live_stories
CREATE POLICY "Users can view live story data of their stories"
ON public.live_stories FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = live_stories.story_id 
    AND stories.user_id = auth.uid()
  )
);

-- RLS Policies for location_stickers
CREATE POLICY "Users can view location stickers of their stories"
ON public.location_stickers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = location_stickers.story_id 
    AND stories.user_id = auth.uid()
  )
);

-- RLS Policies for story_analytics_advanced
CREATE POLICY "Users can view analytics of their stories"
ON public.story_analytics_advanced FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_analytics_advanced.story_id 
    AND stories.user_id = auth.uid()
  )
);

-- RLS Policies for top_fans_ranking
CREATE POLICY "Users can view top fans of their stories"
ON public.top_fans_ranking FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = top_fans_ranking.story_id 
    AND stories.user_id = auth.uid()
  )
);

-- Functions and Triggers

-- Function to check if time capsule should be unlocked
CREATE OR REPLACE FUNCTION check_time_capsule_unlock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unlock_date <= NOW() THEN
    NEW.is_unlocked = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for time capsule unlock check
CREATE TRIGGER check_time_capsule_unlock_trigger
  BEFORE INSERT OR UPDATE ON public.story_time_capsules
  FOR EACH ROW
  EXECUTE FUNCTION check_time_capsule_unlock();

-- Function to update story circle timestamp
CREATE OR REPLACE FUNCTION update_story_circle_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for story circle timestamp
CREATE TRIGGER update_story_circle_timestamp_trigger
  BEFORE UPDATE ON public.story_circles
  FOR EACH ROW
  EXECUTE FUNCTION update_story_circle_timestamp();

-- Comments for documentation
COMMENT ON TABLE public.story_circles IS 'Private story circles for sharing with selected groups';
COMMENT ON TABLE public.story_time_capsules IS 'Stories that unlock at a future date';
COMMENT ON TABLE public.scheduled_stories IS 'Stories scheduled to be published at a specific time';
COMMENT ON TABLE public.story_remixes IS 'AI-generated remixes of original stories';
COMMENT ON TABLE public.multi_view_stories IS 'Stories recorded from multiple camera angles';
COMMENT ON TABLE public.live_stories IS 'Live interactive story sessions with viewer data';
COMMENT ON TABLE public.location_stickers IS 'Location-aware dynamic stickers for stories';
COMMENT ON TABLE public.story_analytics_advanced IS 'Advanced analytics data for stories';
COMMENT ON TABLE public.top_fans_ranking IS 'Ranking of top fans based on engagement with stories';