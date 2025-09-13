import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Declare Deno global for TypeScript
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content, hasImage } = await req.json();

    console.log('Generating captions and hashtags for:', { content: content?.slice(0, 100), hasImage });

    const prompt = hasImage 
      ? `Generate engaging captions and hashtags for social media post with image. Current content: "${content || 'Image post'}"`
      : `Generate engaging captions and hashtags for social media post: "${content}"`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a social media expert. Generate engaging captions and relevant hashtags.
            
            Respond with valid JSON only:
            {
              "captions": [
                "🌟 Caption suggestion 1",
                "💫 Caption suggestion 2", 
                "✨ Caption suggestion 3"
              ],
              "hashtags": [
                "#trending",
                "#socialmedia",
                "#inspiration"
              ],
              "summary": "Brief summary of the content"
            }`
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.8
      }),
    });

    const response = await openAIResponse.json();
    const suggestions = JSON.parse(response.choices[0].message.content);

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating captions and hashtags:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});