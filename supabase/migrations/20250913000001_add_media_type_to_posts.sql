-- Add media_type column to posts table to track if media is image or video
ALTER TABLE public.posts 
ADD COLUMN media_type TEXT CHECK (media_type IN ('image', 'video')) DEFAULT 'image';

-- Update existing posts to have media_type as 'image' (default for existing data)
UPDATE public.posts 
SET media_type = 'image' 
WHERE image_url IS NOT NULL AND media_type IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.posts.media_type IS 'Type of media: image or video';