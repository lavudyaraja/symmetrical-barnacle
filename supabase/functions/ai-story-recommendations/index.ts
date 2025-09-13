// Supabase Edge Function for AI Story Recommendations
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

interface RecommendationRequest {
  userId: string;
  filter: 'all' | 'close-friends' | 'trending';
  limit?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, filter, limit = 10 }: RecommendationRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's interaction history
    const { data: userInteractions } = await supabase
      .from('story_views')
      .select('story_id, stories(user_id, content, media_type)')
      .eq('user_id', userId)
      .limit(100);

    // Get user's reactions history
    const { data: userReactions } = await supabase
      .from('story_reactions')
      .select('story_id, emoji, stories(user_id, content, media_type)')
      .eq('user_id', userId)
      .limit(50);

    // Get trending stories
    const { data: trendingStories } = await supabase
      .from('stories')
      .select(`
        id, user_id, content, media_type, views_count,
        profiles(username)
      `)
      .gt('expires_at', new Date().toISOString())
      .order('views_count', { ascending: false })
      .limit(20);

    // Analyze user preferences
    const preferences: {
      preferredContentTypes: Record<string, number>;
      preferredCreators: Record<string, number>;
      preferredEmojis: Record<string, number>;
      engagementPatterns: Record<string, number>;
    } = {
      preferredContentTypes: {},
      preferredCreators: {},
      preferredEmojis: {},
      engagementPatterns: {}
    };

    // Analyze interaction patterns
    if (userInteractions) {
      userInteractions.forEach(interaction => {
        if (interaction.stories) {
          const mediaType = interaction.stories.media_type;
          preferences.preferredContentTypes[mediaType] = 
            (preferences.preferredContentTypes[mediaType] || 0) + 1;
            
          const creatorId = interaction.stories.user_id;
          preferences.preferredCreators[creatorId] = 
            (preferences.preferredCreators[creatorId] || 0) + 1;
        }
      });
    }

    // Analyze reaction patterns
    if (userReactions) {
      userReactions.forEach(reaction => {
        preferences.preferredEmojis[reaction.emoji] = 
          (preferences.preferredEmojis[reaction.emoji] || 0) + 1;
      });
    }

    // Generate recommendations based on analysis
    const recommendations: string[] = [];

    // Content type recommendations
    const topContentType = Object.keys(preferences.preferredContentTypes)
      .sort((a, b) => preferences.preferredContentTypes[b] - preferences.preferredContentTypes[a])[0];

    if (topContentType) {
      recommendations.push(`More ${topContentType} stories like you enjoy`);
    }

    // Creator recommendations
    const topCreators = Object.keys(preferences.preferredCreators)
      .sort((a, b) => preferences.preferredCreators[b] - preferences.preferredCreators[a])
      .slice(0, 3);

    if (topCreators.length > 0) {
      recommendations.push(`Stories from your favorite creators`);
    }

    // Trending recommendations
    if (filter === 'trending' && trendingStories) {
      const trendingTopics: string[] = [];
      trendingStories.forEach(story => {
        if (story.content) {
          // Simple keyword extraction
          const words = story.content.toLowerCase().split(' ');
          words.forEach(word => {
            if (word.length > 4 && !['this', 'that', 'with', 'have', 'been'].includes(word)) {
              trendingTopics.push(word);
            }
          });
        }
      });

      const uniqueTopics = [...new Set(trendingTopics)].slice(0, 3);
      if (uniqueTopics.length > 0) {
        recommendations.push(`Trending: ${uniqueTopics.join(', ')}`);
      }
    }

    // Time-based recommendations
    const currentHour = new Date().getHours();
    let timeRecommendation = '';

    if (currentHour >= 6 && currentHour < 12) {
      timeRecommendation = 'Morning motivation and coffee stories';
    } else if (currentHour >= 12 && currentHour < 17) {
      timeRecommendation = 'Lunch break and afternoon content';
    } else if (currentHour >= 17 && currentHour < 22) {
      timeRecommendation = 'Evening entertainment and social stories';
    } else {
      timeRecommendation = 'Late night and international content';
    }

    recommendations.push(timeRecommendation);

    // Personalized content suggestions
    const personalizedSuggestions = [
      'Stories similar to ones you\'ve liked',
      'New creators you might enjoy',
      'Popular in your area',
      'Friend recommendations',
      'Stories matching your interests'
    ];

    // Add some personalized suggestions
    recommendations.push(...personalizedSuggestions.slice(0, 2));

    // Limit recommendations
    const finalRecommendations = recommendations.slice(0, limit);

    // Log for analytics
    try {
      await supabase.from('ai_recommendation_analytics').insert({
        user_id: userId,
        filter_type: filter,
        recommendations_count: finalRecommendations.length,
        user_interactions_count: userInteractions?.length || 0,
        user_reactions_count: userReactions?.length || 0,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log recommendation analytics:', error);
    }

    return new Response(
      JSON.stringify({
        recommendations: finalRecommendations,
        preferences: {
          topContentType,
          topCreators: topCreators.length,
          totalInteractions: userInteractions?.length || 0,
          totalReactions: userReactions?.length || 0
        },
        metadata: {
          filter,
          generatedAt: new Date().toISOString(),
          algorithm: 'collaborative-filtering-v1'
        }
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Story recommendations error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate recommendations',
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