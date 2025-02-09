
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })
    const openai = new OpenAIApi(configuration)

    // Get all fishing spots with null descriptions
    const { data: spots, error: spotsError } = await supabaseClient
      .from('fishing_spots')
      .select('*')
      .is('description', null)
    
    if (spotsError) throw spotsError
    
    for (const spot of spots) {
      // Generate description using ChatGPT
      const prompt = `Based on this fish analysis data: "${spot.fish_analysis}", generate a concise and informative description of this fishing spot. The description should be about 2-3 sentences long and focus on the key aspects that would interest anglers.`
      
      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {"role": "user", "content": prompt}
        ],
      })

      const description = completion.data.choices[0]?.message?.content

      if (description) {
        // Update the spot with the new description
        const { error: updateError } = await supabaseClient
          .from('fishing_spots')
          .update({ description })
          .eq('id', spot.id)
        
        if (updateError) throw updateError
      }

      // Add a small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return new Response(
      JSON.stringify({ message: 'Successfully updated fishing spot descriptions' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
