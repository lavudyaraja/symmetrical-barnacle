-- Fix stories table schema to ensure all required columns exist
-- This migration ensures the stories table has all the enhanced features columns

-- Add missing columns if they don't exist
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS text_overlays JSONB;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS stickers JSONB;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS filters JSONB;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS music JSONB;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS poll JSONB;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Ensure media_type column allows text stories
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_media_type_check;
ALTER TABLE public.stories ADD CONSTRAINT stories_media_type_check 
  CHECK (media_type IN ('image', 'video', 'text'));

-- Add helpful comments
COMMENT ON COLUMN public.stories.text_overlays IS 'JSON array of text overlay objects with position, style, and content';
COMMENT ON COLUMN public.stories.stickers IS 'JSON array of sticker objects including emojis, locations, mentions';
COMMENT ON COLUMN public.stories.filters IS 'JSON object containing filter configuration and effects';
COMMENT ON COLUMN public.stories.music IS 'JSON object with music track information';
COMMENT ON COLUMN public.stories.poll IS 'JSON object containing poll question and options';
COMMENT ON COLUMN public.stories.scheduled_for IS 'Timestamp when story should be published (null for immediate)';
COMMENT ON COLUMN public.stories.views_count IS 'Cached count of story views for performance';
COMMENT ON COLUMN public.stories.media_type IS 'Type of story media: image, video, or text';

-- Create an index on expires_at for performance
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);

-- Create an index on scheduled_for for scheduled stories
CREATE INDEX IF NOT EXISTS idx_stories_scheduled_for ON public.stories(scheduled_for);