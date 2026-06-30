import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Extract the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Verify the token using the Supabase Anon client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid user token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Extract the body parameters
    const { catId } = await req.json()
    if (!catId) {
      return new Response(JSON.stringify({ error: 'Missing catId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Initialize the Service Role Client to perform database operations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Fetch cat details
    const { data: catData, error: catError } = await supabase
      .from('cats')
      .select('name')
      .eq('id', catId)
      .single()

    if (catError || !catData) {
      throw new Error(catError?.message || 'Cat not found')
    }

    // 2. Fetch recent sightings for this cat
    const { data: sightingsData, error: sightingsError } = await supabase
      .from('sightings')
      .select('created_at, condition, notes')
      .eq('cat_id', catId)
      .order('created_at', { ascending: false })

    if (sightingsError) {
      throw new Error(sightingsError.message)
    }

    // 3. Compile sightings into a bulleted text list
    const sightingsList = (sightingsData || [])
      .map(s => {
        const date = new Date(s.created_at).toLocaleDateString('es-MX')
        return `- Fecha: ${date}, Condición: ${s.condition}, Notas: ${s.notes || 'Sin notas'}`
      })
      .join('\n')

    // 4. Construct the prompt for Gemini (instructing it to write in English as a profile bio)
    const prompt = `You are an assistant helping to document the history of stray cats in a community in Ciudad Lerdo, Durango.
Here is the recent sighting history for a cat named "${catData.name}":
${sightingsList || 'No sightings recorded yet.'}

Based on these sightings, write a warm, brief summary in the third person about ${catData.name} — their current health, behavior, and where they are usually found.
Do not use greetings or address a team. Write a maximum of 3 sentences, in a friendly but informative tone, as if it were a short biography for the cat's profile.
The summary MUST be written in English.`

    // 5. Fetch the Gemini API key from Supabase secrets
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Missing GEMINI_API_KEY secret in Supabase')
    }

    // 6. Call the Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini API error: ${response.statusText} - ${errText}`)
    }

    const responseData = await response.json()
    const summary = responseData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!summary) {
      throw new Error('Failed to generate summary from Gemini response')
    }

    // 7. Update the cat's summary in the database
    const { error: updateError } = await supabase
      .from('cats')
      .update({ summary })
      .eq('id', catId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Error in generate-cat-summary:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
