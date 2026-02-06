import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting with cleanup
const rateLimitStore = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60000
const MAX_REQUESTS_PER_WINDOW = 20
let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 300000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()

  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [key, timestamps] of rateLimitStore) {
      const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)
      if (recent.length === 0) rateLimitStore.delete(key)
      else rateLimitStore.set(key, recent)
    }
    lastCleanup = now
  }

  const userRequests = rateLimitStore.get(userId) || []
  const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW)

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) return false

  recentRequests.push(now)
  rateLimitStore.set(userId, recentRequests)
  return true
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
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
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      )
    }

    const body = await req.json()
    const { text, voice } = body

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid text parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const MAX_TEXT_LENGTH = 2500
    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ALLOWED_VOICES = ['pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL', '21m00Tcm4TlvDq8ikWAM', 'AZnzlk1XvdvUeBnXmlld']
    if (voice && !ALLOWED_VOICES.includes(voice)) {
      return new Response(
        JSON.stringify({ error: 'Invalid voice parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'TTS service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + (voice || 'pNInz6obpgDQGcFmaJgB'), {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text.slice(0, 2500),
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    })

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'TTS provider rate limited. Please try again shortly.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '30' } }
        )
      }
      return new Response(
        JSON.stringify({ error: 'TTS generation failed' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const arrayBuffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Process in chunks to avoid stack overflow
    let binaryString = ''
    const chunkSize = 8192
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize)
      binaryString += String.fromCharCode(...chunk)
    }
    const base64Audio = btoa(binaryString)

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Text-to-speech processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})