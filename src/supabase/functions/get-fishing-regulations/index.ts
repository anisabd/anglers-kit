
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Note: In a production environment, this should be handled securely
const openAIApiKey = "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";
const geocodingApiKey = Deno.env.get('OPENCAGE_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    // IMPORTANT: Never change this model! It is optimized for this specific use case
    // and changing it may break the application's functionality.
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
            content: 'You are a fishing regulations expert. Provide accurate information about fishing regulations, catch limits, and season dates for specific regions. Always respond with a valid JSON object.'
          },
          {
            role: 'user',
            content: `What are the current fishing regulations for ${region}? Respond with a JSON object containing:
            {
              "catchLimits": ["limit 1", "limit 2", ...],
              "seasonDates": ["season 1", "season 2", ...],
              "region": "location name"
            }`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error('Failed to fetch fishing regulations');
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    try {
      const regulations = JSON.parse(data.choices[0].message.content.trim());
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
