-- Update existing posts to set correct media_type based on file extensions
-- This fixes posts that were uploaded before the media_type column was added

UPDATE public.posts 
SET media_type = 'video'
WHERE image_url IS NOT NULL 
AND (media_type IS NULL OR media_type = 'image')
AND (
  LOWER(image_url) LIKE '%.mp4%' OR
  LOWER(image_url) LIKE '%.webm%' OR
  LOWER(image_url) LIKE '%.mov%' OR
  LOWER(image_url) LIKE '%.avi%' OR
  LOWER(image_url) LIKE '%.mkv%' OR
  LOWER(image_url) LIKE '%.flv%' OR
  LOWER(image_url) LIKE '%.wmv%' OR
  LOWER(image_url) LIKE '%.m4v%'
);

-- Ensure all posts with media have a media_type set
UPDATE public.posts 
SET media_type = 'image'
WHERE image_url IS NOT NULL 
AND media_type IS NULL;

-- Add an index for better performance on media_type queries
CREATE INDEX IF NOT EXISTS idx_posts_media_type ON public.posts(media_type) WHERE media_type IS NOT NULL;