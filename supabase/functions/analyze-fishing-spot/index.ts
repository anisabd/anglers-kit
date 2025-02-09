
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, placeId } = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if we already have analysis for this place
    const { data: existingAnalysis } = await supabaseClient
      .from('fishing_spots')
      .select('fish_analysis')
      .eq('google_place_id', placeId)
      .single();

    if (existingAnalysis?.fish_analysis) {
      return new Response(
        JSON.stringify({ fishAnalysis: existingAnalysis.fish_analysis }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get OpenAI key from secrets
    const { data: secretData, error: secretError } = await supabaseClient
      .from('secrets')
      .select('key_value')
      .eq('key_name', 'OPENAI_API_KEY')
      .single();

    if (secretError) {
      throw new Error("Could not retrieve OpenAI API key");
    }

    const openAIKey = secretData?.key_value;

    // Generate fish species analysis using GPT-4
    const prompt = `Based on this fishing location's name and geographical position (${location}), 
    list exactly 3 types of fish that anglers are most likely to catch here. 
    Format the response as a JSON array with each fish having a name and brief description. 
    Keep descriptions under 100 characters.`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a local fishing expert. Be specific about fish species." },
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
    const fishAnalysis = openAIData.choices[0].message.content;

    // Store the analysis in the database
    await supabaseClient
      .from('fishing_spots')
      .upsert({
        google_place_id: placeId,
        fish_analysis: fishAnalysis,
        last_updated: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({ fishAnalysis }),
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
