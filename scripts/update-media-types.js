// Script to update existing posts with correct media_type
// Run this script to fix video posts that don't have proper media_type set

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMediaTypes() {
  console.log('Starting media type update...');

  try {
    // First, get all posts with media but no media_type or incorrect media_type
    const { data: posts, error: fetchError } = await supabase
      .from('posts')
      .select('id, image_url, media_type')
      .not('image_url', 'is', null);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${posts.length} posts with media`);

    let videoUpdates = 0;
    let imageUpdates = 0;

    for (const post of posts) {
      if (!post.image_url) continue;

      const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v'];
      const isVideo = videoExtensions.some(ext => 
        post.image_url.toLowerCase().includes(ext)
      );

      const shouldBeVideo = isVideo && post.media_type !== 'video';
      const shouldBeImage = !isVideo && (post.media_type === null || post.media_type !== 'image');

      if (shouldBeVideo) {
        const { error } = await supabase
          .from('posts')
          .update({ media_type: 'video' })
          .eq('id', post.id);

        if (error) {
          console.error(`Failed to update post ${post.id}:`, error);
        } else {
          videoUpdates++;
          console.log(`Updated post ${post.id} to video`);
        }
      } else if (shouldBeImage) {
        const { error } = await supabase
          .from('posts')
          .update({ media_type: 'image' })
          .eq('id', post.id);

        if (error) {
          console.error(`Failed to update post ${post.id}:`, error);
        } else {
          imageUpdates++;
          console.log(`Updated post ${post.id} to image`);
        }
      }
    }

    console.log(`\nUpdate complete!`);
    console.log(`Videos updated: ${videoUpdates}`);
    console.log(`Images updated: ${imageUpdates}`);

  } catch (error) {
    console.error('Error updating media types:', error);
  }
}

updateMediaTypes();