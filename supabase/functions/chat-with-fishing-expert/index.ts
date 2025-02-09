
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
            content: `You are a helpful and knowledgeable fishing regulations expert. You have extensive knowledge about fishing laws, regulations, and best practices. Provide concise, direct answers using plain text only (no markdown, no formatting, no bullet points). Keep responses brief and to the point, typically 2-3 short sentences. Focus on:
            - Quick facts about fishing regulations
            - Simple explanations of limits and seasons
            - Clear yes/no answers when possible
            - Direct advice on compliance
            
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
