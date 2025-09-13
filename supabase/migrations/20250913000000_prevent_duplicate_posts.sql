-- Add unique constraint to prevent exact duplicate posts
-- This prevents the same user from posting identical content within a short timeframe

-- First, clean up any existing duplicates
WITH duplicate_posts AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY user_id, content, EXTRACT(EPOCH FROM created_at)::bigint / 300 
           ORDER BY created_at
         ) as rn
  FROM posts
  WHERE content IS NOT NULL AND content != ''
)
DELETE FROM posts 
WHERE id IN (
  SELECT id FROM duplicate_posts WHERE rn > 1
);

-- Add a partial unique index to prevent duplicate posts from the same user with identical content within 5 minutes
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_user_content_time_unique 
ON posts (user_id, content, (EXTRACT(EPOCH FROM created_at)::bigint / 300))
WHERE content IS NOT NULL AND content != '';

-- Add a comment explaining the constraint
COMMENT ON INDEX idx_posts_user_content_time_unique IS 
'Prevents duplicate posts from the same user with identical content within 5-minute windows';