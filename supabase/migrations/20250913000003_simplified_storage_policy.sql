-- Simplified storage policy for testing video uploads
-- This removes complex file size checking that might be causing issues

-- Drop the complex policy and create a simple one for testing
DROP POLICY IF EXISTS "Authenticated users can upload media files" ON storage.objects;

-- Create simple policy that allows all authenticated uploads to posts bucket
CREATE POLICY "Authenticated users can upload to posts" 
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'posts' 
  AND auth.uid() IS NOT NULL
);

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO UPDATE SET public = true;