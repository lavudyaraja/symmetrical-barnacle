# Video Upload and Display Fix

## Problem Identified
Videos were uploading successfully but not displaying properly in posts. The issue was:

1. **Missing media_type in queries**: The posts table has a `media_type` column (added in migration `20250913000001_add_media_type_to_posts.sql`), but the main posts fetching queries in `Index.tsx`, `Search.tsx`, and `Profile.tsx` were not including this field.

2. **Fallback detection not working**: The `PostContent.tsx` component was trying to detect videos by file extension in the URL, but Supabase Storage URLs often don't have clear file extensions.

## Changes Made

### 1. Updated PostData Interface (`src/pages/Index.tsx`)
```typescript
interface PostData {
  // ... existing fields
  media_type?: 'image' | 'video';  // Added this line
}
```

### 2. Updated PostProps Interface (`src/components/post/types.ts`)
```typescript
export interface PostProps {
  // ... existing fields
  media_type?: 'image' | 'video';  // Added this line
}
```

### 3. Updated PostContent Component (`src/components/post/PostContent.tsx`)
- Now uses `media_type` field as primary detection method
- Falls back to file extension detection if `media_type` is not available
- More reliable video detection logic

### 4. Updated Database Queries
- **Index.tsx**: Main posts feed now includes `media_type` in query
- **Search.tsx**: Post search now includes `media_type` in query  
- **Profile.tsx**: User posts now include `media_type` in query

### 5. Updated Component Props
- **Index.tsx**: Now passes `media_type` to `EnhancedPost` component

## How It Works Now

1. **Video Upload**: When uploading a video in `CreatePost.tsx`, the `media_type` is correctly set to 'video' in the database
2. **Video Display**: When fetching posts, the `media_type` field is included and used to determine if content is a video
3. **Fallback**: If `media_type` is missing (for old posts), falls back to file extension detection

## Testing Steps

1. Upload a video file through the post creation interface
2. Check that the post shows a video player instead of an image
3. Verify video controls work (play/pause, muted by default)
4. Check that existing image posts still display correctly

## Database Schema

The posts table already has the correct structure:
```sql
ALTER TABLE public.posts 
ADD COLUMN media_type TEXT CHECK (media_type IN ('image', 'video')) DEFAULT 'image';
```

This fix ensures that videos uploaded through the application will now display properly as video elements instead of broken images.