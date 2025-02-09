
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = "sk-y9IA";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location } = await req.json();

    // Generate fish species analysis using GPT-4o-mini
    const prompt = `Based on this fishing location's name and geographical position (${location}), 
    list exactly 3 types of fish that anglers are most likely to catch here. 
    Return ONLY a JSON array with each fish having a name and brief description. 
    Keep descriptions under 100 characters. Example: [{"name": "Bass", "description": "Common in lakes"}]`;

    console.log('Making OpenAI request for location:', location);
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a fishing expert. Only respond with valid JSON arrays containing fish species." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', {
        status: openAIResponse.status,
        statusText: openAIResponse.statusText,
        body: errorText
      });
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    let fishAnalysis = openAIData.choices[0].message.content;
    
    // Clean up the response if it contains markdown or unnecessary formatting
    fishAnalysis = fishAnalysis.replace(/```json\n|\n```|```/g, '').trim();
    
    // Parse the response to make sure it's valid JSON
    const parsedFishAnalysis = JSON.parse(fishAnalysis);

    return new Response(
      JSON.stringify({ fishAnalysis: parsedFishAnalysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

