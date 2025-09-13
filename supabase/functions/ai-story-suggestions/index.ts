// Supabase Edge Function for AI Story Suggestions
// @ts-ignore - Deno imports work in runtime
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-ignore - Deno imports work in runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Declare Deno global for TypeScript
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StoryAIRequest {
  content?: string;
  mediaType?: 'image' | 'video' | 'text';
  hasMedia?: boolean;
  imageData?: string; // base64 encoded image for analysis
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content, mediaType, hasMedia, imageData }: StoryAIRequest = await req.json();

    // Initialize Supabase client
    const supabase = createClient(
      // @ts-ignore - Deno runtime environment
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore - Deno runtime environment
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get OpenAI API key
    // @ts-ignore - Deno runtime environment
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const suggestions: any = {
      captions: [],
      hashtags: [],
      filters: [],
      bestTime: null,
      musicSuggestions: [],
      stickers: [],
      locations: [],
      engagementPrediction: null
    };

    // Generate captions based on content type
    if (content || imageData) {
      let prompt = '';
      
      if (imageData) {
        // Analyze image content (simplified - in production would use vision API)
        prompt = `Based on this social media story content: "${content || 'Visual content'}", generate 3 engaging captions that are:
        - Short and catchy (under 100 characters)
        - Include relevant emojis
        - Encourage engagement
        - Match current social media trends`;
      } else if (content) {
        prompt = `Enhance this story content: "${content}" by providing 3 alternative captions that are more engaging and social media optimized.`;
      }

      const captionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a social media expert specializing in creating engaging story content. Provide suggestions in a JSON array format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.8,
        }),
      });

      if (captionResponse.ok) {
        const captionData = await captionResponse.json();
        const captionText = captionData.choices[0]?.message?.content || '';
        
        // Parse captions (assuming AI returns them in a structured format)
        try {
          const parsedCaptions = JSON.parse(captionText);
          suggestions.captions = Array.isArray(parsedCaptions) ? parsedCaptions : [captionText];
        } catch {
          // If not JSON, split by newlines
          suggestions.captions = captionText.split('\n').filter(line => line.trim()).slice(0, 3);
        }
      }
    }

    // Generate hashtag suggestions
    if (content || hasMedia) {
      const hashtagPrompt = `Generate 10 relevant hashtags for this story content: "${content || 'Visual story content'}". 
      Focus on:
      - Trending hashtags
      - Niche-specific tags
      - Location-based tags if relevant
      - Community hashtags
      Return as a JSON array of hashtag strings without the # symbol.`;

      const hashtagResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a hashtag expert. Return only a JSON array of hashtag strings.'
            },
            {
              role: 'user',
              content: hashtagPrompt
            }
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (hashtagResponse.ok) {
        const hashtagData = await hashtagResponse.json();
        const hashtagText = hashtagData.choices[0]?.message?.content || '';
        
        try {
          const parsedHashtags = JSON.parse(hashtagText);
          suggestions.hashtags = Array.isArray(parsedHashtags) 
            ? parsedHashtags.map(tag => `#${tag.replace('#', '')}`)
            : [];
        } catch {
          // Fallback parsing
          suggestions.hashtags = hashtagText
            .split(/[,\n]/)
            .map(tag => `#${tag.trim().replace('#', '')}`)
            .filter(tag => tag.length > 1)
            .slice(0, 10);
        }
      }
    }

    // Suggest filters based on content
    const filterSuggestions = {
      'beach': ['warm', 'bright', 'vintage'],
      'food': ['warm', 'vibrant', 'moody'],
      'selfie': ['soft', 'bright', 'beauty'],
      'nature': ['vibrant', 'dramatic', 'cinematic'],
      'party': ['bright', 'dramatic', 'neon'],
      'workout': ['dramatic', 'high-contrast', 'energetic'],
      'travel': ['vintage', 'cinematic', 'warm'],
      'night': ['moody', 'dramatic', 'noir'],
      'default': ['none', 'bright', 'warm']
    };

    const contentLower = (content || '').toLowerCase();
    let suggestedFilters = filterSuggestions.default;

    for (const [keyword, filters] of Object.entries(filterSuggestions)) {
      if (contentLower.includes(keyword)) {
        suggestedFilters = filters;
        break;
      }
    }

    suggestions.filters = suggestedFilters;

    // Predict best posting time based on content and current time
    const currentHour = new Date().getHours();
    let bestTime = '';

    if (mediaType === 'text' || contentLower.includes('motivation') || contentLower.includes('quote')) {
      bestTime = '7:00 AM - 9:00 AM (Morning motivation)';
    } else if (contentLower.includes('food') || contentLower.includes('lunch') || contentLower.includes('dinner')) {
      bestTime = '12:00 PM - 1:00 PM or 6:00 PM - 8:00 PM (Meal times)';
    } else if (contentLower.includes('party') || contentLower.includes('night') || contentLower.includes('weekend')) {
      bestTime = '7:00 PM - 10:00 PM (Evening social hours)';
    } else if (contentLower.includes('work') || contentLower.includes('office') || contentLower.includes('meeting')) {
      bestTime = '5:00 PM - 7:00 PM (After work hours)';
    } else {
      // General best times
      if (currentHour < 12) {
        bestTime = '12:00 PM - 2:00 PM (Lunch break)';
      } else if (currentHour < 17) {
        bestTime = '7:00 PM - 9:00 PM (Evening peak)';
      } else {
        bestTime = '8:00 AM - 10:00 AM (Morning peak)';
      }
    }

    suggestions.bestTime = bestTime;

    // Suggest music based on content mood
    const musicSuggestions = {
      'happy': ['Upbeat Pop', 'Feel Good', 'Summer Vibes'],
      'sad': ['Chill', 'Acoustic', 'Emotional'],
      'party': ['Dance', 'Electronic', 'Hip Hop'],
      'calm': ['Ambient', 'Lo-Fi', 'Nature Sounds'],
      'workout': ['Energetic', 'Rock', 'Electronic'],
      'romantic': ['Love Songs', 'Acoustic', 'Classical'],
      'travel': ['Adventure', 'World Music', 'Upbeat'],
      'default': ['Popular', 'Trending', 'Chill']
    };

    let musicMood = 'default';
    for (const [mood, tracks] of Object.entries(musicSuggestions)) {
      if (contentLower.includes(mood) || 
          (mood === 'happy' && (contentLower.includes('fun') || contentLower.includes('joy'))) ||
          (mood === 'party' && (contentLower.includes('dance') || contentLower.includes('celebration'))) ||
          (mood === 'workout' && (contentLower.includes('gym') || contentLower.includes('fitness')))) {
        musicMood = mood;
        break;
      }
    }

    suggestions.musicSuggestions = musicSuggestions[musicMood];

    // Suggest relevant stickers/emojis
    const stickerSuggestions: string[] = [];
    const emojiMap: { [key: string]: string[] } = {
      'food': ['🍕', '🍔', '🍟', '🥗', '🍰'],
      'travel': ['✈️', '🌍', '📍', '🗺️', '🎒'],
      'party': ['🎉', '🎊', '🥳', '🍾', '🎵'],
      'love': ['❤️', '💕', '😍', '🥰', '💖'],
      'work': ['💼', '💻', '📊', '☕', '📝'],
      'fitness': ['💪', '🏃‍♂️', '🏋️‍♀️', '🔥', '💦'],
      'nature': ['🌲', '🏔️', '🌸', '🦋', '🌅'],
      'selfie': ['📸', '😎', '💄', '👑', '✨']
    };

    for (const [category, emojis] of Object.entries(emojiMap)) {
      if (contentLower.includes(category)) {
        stickerSuggestions.push(...emojis);
      }
    }

    if (stickerSuggestions.length === 0) {
      stickerSuggestions.push('😊', '❤️', '🔥', '💯', '✨');
    }

    suggestions.stickers = stickerSuggestions.slice(0, 8);

    // Simple engagement prediction (in production, this would use ML models)
    let engagementScore = 50; // Base score

    // Adjust based on content factors
    if (content && content.length > 0) {
      engagementScore += 10; // Has content
      if (content.length > 20 && content.length < 150) {
        engagementScore += 10; // Optimal length
      }
    }

    if (hasMedia) {
      engagementScore += 20; // Has visual content
    }

    if (suggestions.hashtags.length > 5) {
      engagementScore += 15; // Good hashtag usage
    }

    if (mediaType === 'video') {
      engagementScore += 25; // Videos typically perform better
    }

    // Cap at 100
    engagementScore = Math.min(engagementScore, 100);

    suggestions.engagementPrediction = {
      score: engagementScore,
      level: engagementScore > 80 ? 'High' : engagementScore > 60 ? 'Medium' : 'Low',
      tips: [
        engagementScore < 70 ? 'Consider adding more visual content' : null,
        suggestions.hashtags.length < 5 ? 'Use more relevant hashtags' : null,
        !content || content.length < 20 ? 'Add a compelling caption' : null,
        mediaType === 'text' ? 'Visual content typically performs better' : null
      ].filter(Boolean)
    };

    // Log analytics for improvement
    try {
      await supabase.from('ai_suggestion_analytics').insert({
        request_type: 'story_suggestions',
        content_type: mediaType,
        has_content: !!content,
        has_media: hasMedia,
        suggestions_generated: Object.keys(suggestions).length,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log analytics:', error);
    }

    return new Response(
      JSON.stringify(suggestions),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Story AI suggestions error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate suggestions',
        details: error.message 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500,
      }
    );
  }
});