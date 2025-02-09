
// @ts-ignore - Deno imports
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-ignore - Deno imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = "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";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, region } = await req.json();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful and knowledgeable fishing regulations expert. You have extensive knowledge about fishing laws, regulations, and best practices. You should:
            - Provide accurate information about fishing regulations
            - Explain the reasoning behind fishing limits and seasons
            - Help users understand complex regulations in simple terms
            - Encourage responsible and sustainable fishing practices
            - When uncertain about specific local regulations, advise checking with local authorities
            
            The user is asking about fishing in: ${region}`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from AI');
    }

    const data = await response.json();
    return new Response(JSON.stringify({
      reply: data.choices[0].message.content
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-with-fishing-expert function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
