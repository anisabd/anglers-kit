
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng } = await req.json();

    // Get location info using reverse geocoding
    const geocodingResponse = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=YOUR_OPENCAGE_API_KEY`
    );
    const geocodingData = await geocodingResponse.json();
    const region = geocodingData.results[0].formatted;

    // Use OpenAI to get fishing regulations for the region
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
            content: 'You are a fishing regulations expert. Provide accurate information about fishing regulations, catch limits, and season dates for specific regions.'
          },
          {
            role: 'user',
            content: `What are the current fishing regulations for ${region}? Please provide:
            1. Catch limits per person
            2. Fishing season dates
            Format the response as a JSON object with the following structure:
            {
              "catchLimits": ["limit 1", "limit 2", ...],
              "seasonDates": ["season 1", "season 2", ...],
              "region": "location name"
            }`
          }
        ],
      }),
    });

    const data = await response.json();
    const regulations = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(regulations), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-fishing-regulations function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
