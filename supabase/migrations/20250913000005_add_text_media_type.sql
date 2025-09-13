-- Add 'text' as a valid media_type option for stories
-- This fixes TypeScript type compatibility issues

-- Drop the existing CHECK constraint
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_media_type_check;

-- Add new CHECK constraint that includes 'text'
ALTER TABLE public.stories ADD CONSTRAINT stories_media_type_check 
  CHECK (media_type IN ('image', 'video', 'text'));

-- Add comment for clarity
COMMENT ON COLUMN public.stories.media_type IS 'Type of story media: image, video, or text';