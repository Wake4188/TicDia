import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestId = crypto.randomUUID()
  try {
    const { text, voiceId } = await req.json()

    if (!text) {
      console.error(`[tts-stream:${requestId}] Missing text in request`)
      throw new Error('Text is required')
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
    if (!ELEVENLABS_API_KEY) {
      console.error(`[tts-stream:${requestId}] ELEVENLABS_API_KEY not configured`)
      throw new Error('ElevenLabs API key not configured')
    }

    const voice = voiceId || '9BWtsMINqrJLrRacOk9x' // Default: Aria

    console.log(`[tts-stream:${requestId}] Request received. textLen=${String(text).length}, voice=${voice}`)

    // Proxy ElevenLabs and stream the response
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: String(text).slice(0, 2500),
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      })

    console.log(`[tts-stream:${requestId}] ElevenLabs responded status=${response.status}`)

    if (!response.ok) {
      const error = await response.text()
      console.error(`[tts-stream:${requestId}] ElevenLabs error: ${error}`)
      return new Response(
        JSON.stringify({ error: `ElevenLabs API error: ${error}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Stream audio back to the client
    console.log(`[tts-stream:${requestId}] Streaming audio back to client`)
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error(`[tts-stream:${requestId}] Error:`, error?.message || error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Failed to generate speech' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})