
// @ts-ignore - Deno imports
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-ignore - Deno imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// @ts-ignore - Deno env
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
// @ts-ignore - Deno env
const geocodingApiKey = Deno.env.get('OPENCAGE_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { lat, lng } = await req.json();

    if (!geocodingApiKey) {
      throw new Error('OpenCage API key not configured');
    }

    console.log('Fetching location data for coordinates:', { lat, lng });

    // Get location info using reverse geocoding
    const geocodingResponse = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${geocodingApiKey}`
    );
    
    if (!geocodingResponse.ok) {
      console.error('Geocoding API error:', await geocodingResponse.text());
      throw new Error('Failed to fetch location data');
    }
    
    const geocodingData = await geocodingResponse.json();
    console.log('Geocoding response:', geocodingData);

    if (!geocodingData.results || geocodingData.results.length === 0) {
      throw new Error('No location data found for these coordinates');
    }

    const region = geocodingData.results[0].formatted;
    console.log('Identified region:', region);

    // Use OpenAI to get fishing regulations for the region
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4', // Using the standard GPT-4 model for reliable JSON responses
        messages: [
          {
            role: 'system',
            content: `You are a fishing regulations expert. For every request, you MUST return a valid JSON object in this exact format:
            {
              "catchLimits": ["limit 1", "limit 2", ...],
              "seasonDates": ["season 1", "season 2", ...],
              "region": "location name"
            }`
          },
          {
            role: 'user',
            content: `What are the current fishing regulations for ${region}?`
          }
        ],
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error('Failed to fetch fishing regulations');
    }

    const data = await response.json();
    console.log('OpenAI raw response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response structure from OpenAI');
    }

    try {
      const regulations = JSON.parse(data.choices[0].message.content.trim());
      
      // Validate the response structure
      if (!regulations.catchLimits || !regulations.seasonDates || !regulations.region) {
        throw new Error('Response missing required fields');
      }
      
      if (!Array.isArray(regulations.catchLimits) || !Array.isArray(regulations.seasonDates)) {
        throw new Error('Invalid data types in response');
      }

      return new Response(JSON.stringify(regulations), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.log('Raw content:', data.choices[0].message.content);
      throw new Error('Invalid response format from OpenAI');
    }
  } catch (error) {
    console.error('Error in get-fishing-regulations function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
