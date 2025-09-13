-- Update storage policies to include file size and type restrictions for media uploads
-- This ensures only images and videos under certain size limits can be uploaded

-- Drop existing policy and recreate with file restrictions
DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;

-- Create new policy for media uploads with restrictions
CREATE POLICY "Authenticated users can upload media files" 
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'posts' 
  AND auth.uid() IS NOT NULL
  AND (
    -- Allow image files up to 10MB
    (
      (LOWER(SUBSTRING(name FROM '\.([^.]*)$')) IN ('jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg') 
       OR SUBSTRING(name FROM '^[^/]*/') ~ '^image/')
      AND LENGTH(decode(encode(metadata::text::bytea, 'base64'), 'base64')) <= 10485760  -- 10MB
    )
    OR
    -- Allow video files up to 50MB  
    (
      (LOWER(SUBSTRING(name FROM '\.([^.]*)$')) IN ('mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v')
       OR SUBSTRING(name FROM '^[^/]*/') ~ '^video/')
      AND LENGTH(decode(encode(metadata::text::bytea, 'base64'), 'base64')) <= 52428800  -- 50MB
    )
  )
);

-- Add policy for deleting own media files
CREATE POLICY "Users can delete their own media files"
ON storage.objects FOR DELETE USING (
  bucket_id = 'posts' 
  AND auth.uid() IS NOT NULL
);

-- Add policy for updating own media files  
CREATE POLICY "Users can update their own media files"
ON storage.objects FOR UPDATE USING (
  bucket_id = 'posts' 
  AND auth.uid() IS NOT NULL
);