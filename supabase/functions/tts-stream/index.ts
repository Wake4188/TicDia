import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Rate limiting
const rateLimitStore = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60000
const MAX_REQUESTS_PER_WINDOW = 20

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userRequests = rateLimitStore.get(userId) || []
  const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW)
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false
  }
  
  recentRequests.push(now)
  rateLimitStore.set(userId, recentRequests)
  return true
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestId = crypto.randomUUID()
  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error(`[tts-stream:${requestId}] No auth header`)
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error(`[tts-stream:${requestId}] Auth error:`, authError)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      console.error(`[tts-stream:${requestId}] Rate limit exceeded for user ${user.id}`)
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { text, voiceId } = await req.json()

    // Input validation
    if (!text || typeof text !== 'string') {
      console.error(`[tts-stream:${requestId}] Invalid or missing text parameter`)
      return new Response(
        JSON.stringify({ error: 'Text is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Text length validation - prevent excessive API costs
    const MAX_TEXT_LENGTH = 2500
    const trimmedText = text.trim()
    if (trimmedText.length === 0) {
      console.error(`[tts-stream:${requestId}] Empty text after trimming`)
      return new Response(
        JSON.stringify({ error: 'Text cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (trimmedText.length > MAX_TEXT_LENGTH) {
      console.error(`[tts-stream:${requestId}] Text too long: ${trimmedText.length} chars`)
      return new Response(
        JSON.stringify({ error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Voice ID validation - whitelist allowed voices
    const ALLOWED_VOICES = [
      '9BWtsMINqrJLrRacOk9x', // Aria (default)
      '21m00Tcm4TlvDq8ikWAM', // Rachel
      'EXAVITQu4vr4xnSDxMaL', // Bella
      'MF3mGyEYCl7XYWbV9V6O', // Elli
      'TxGEqnHWrfWFTfGW9XjX', // Josh
      'VR6AewLTigWG4xSOukaG', // Arnold
      'pNInz6obpgDQGcFmaJgB', // Adam
      'yoZ06aMxZJJ28mfd3POQ'  // Sam
    ]
    
    const voice = voiceId && ALLOWED_VOICES.includes(voiceId) ? voiceId : '9BWtsMINqrJLrRacOk9x'
    if (voiceId && !ALLOWED_VOICES.includes(voiceId)) {
      console.warn(`[tts-stream:${requestId}] Invalid voiceId "${voiceId}", using default`)
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
    if (!ELEVENLABS_API_KEY) {
      console.error(`[tts-stream:${requestId}] ELEVENLABS_API_KEY not configured`)
      throw new Error('ElevenLabs API key not configured')
    }

    console.log(`[tts-stream:${requestId}] Request received. textLen=${trimmedText.length}, voice=${voice}`)

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
          text: trimmedText,
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