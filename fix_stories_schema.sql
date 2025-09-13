-- Quick fix script for stories table schema issues
-- Run this in your Supabase SQL editor if you're getting column not found errors

-- Step 1: Check current stories table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stories' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add missing columns (run these one by one)
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS text_overlays JSONB;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS stickers JSONB;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS filters JSONB;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS music JSONB;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS poll JSONB;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Step 3: Update media type constraint
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_media_type_check;
ALTER TABLE public.stories ADD CONSTRAINT stories_media_type_check 
  CHECK (media_type IN ('image', 'video', 'text'));

-- Step 4: Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stories' AND table_schema = 'public'
ORDER BY ordinal_position;