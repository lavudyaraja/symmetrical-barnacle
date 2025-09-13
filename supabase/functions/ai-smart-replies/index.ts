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
    const { conversation } = await req.json();

    console.log('Generating smart replies for conversation:', conversation.slice(0, 200));

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
            content: `Generate 3 smart reply suggestions for a social media conversation. 
            Make them:
            1. Contextually appropriate
            2. Friendly and engaging
            3. Different in tone (casual, supportive, curious)
            
            Respond with valid JSON only:
            {
              "replies": [
                "That's amazing! 🎉",
                "Tell me more about that",
                "I love this idea!"
              ]
            }`
          },
          { role: 'user', content: `Conversation: ${conversation}` }
        ],
        max_tokens: 150,
        temperature: 0.7
      }),
    });

    const response = await openAIResponse.json();
    const smartReplies = JSON.parse(response.choices[0].message.content);

    return new Response(JSON.stringify(smartReplies), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating smart replies:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});