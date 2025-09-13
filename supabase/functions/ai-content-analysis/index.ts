// Supabase Edge Function for AI Content Analysis
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

const supabase = createClient(
  // @ts-ignore - Deno runtime environment
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore - Deno runtime environment
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content, contentId, contentType } = await req.json();

    console.log('Analyzing content:', { contentId, contentType, content: content.slice(0, 100) });

    // Analyze content with OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        // @ts-ignore - Deno runtime environment
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI content moderator. Analyze the following content for:
            1. Toxicity (hate speech, harassment, bullying) - score 0-1
            2. Sentiment (negative to positive) - score -1 to 1
            3. Overall safety - return an array of issues if any
            
            Respond with valid JSON only:
            {
              "toxicity_score": 0.1,
              "sentiment_score": 0.7,
              "confidence_score": 0.9,
              "moderation_status": "approved",
              "flagged_reasons": []
            }`
          },
          { role: 'user', content }
        ],
        max_tokens: 200,
        temperature: 0.1
      }),
    });

    const analysis = await openAIResponse.json();
    const aiResult = JSON.parse(analysis.choices[0].message.content);

    console.log('AI analysis result:', aiResult);

    // Store moderation result
    const { error: moderationError } = await supabase
      .from('content_moderation')
      .insert({
        content_id: contentId,
        content_type: contentType,
        moderation_status: aiResult.moderation_status,
        toxicity_score: aiResult.toxicity_score,
        sentiment_score: aiResult.sentiment_score,
        confidence_score: aiResult.confidence_score,
        flagged_reasons: aiResult.flagged_reasons
      });

    if (moderationError) {
      console.error('Error storing moderation result:', moderationError);
    }

    return new Response(JSON.stringify(aiResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI content analysis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});