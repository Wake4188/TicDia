import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.4.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting with cleanup
const rateLimitStore = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60000
const MAX_REQUESTS_PER_WINDOW = 10
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
  const recentRequests = userRequests.filter((t) => now - t < RATE_LIMIT_WINDOW)
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) return false
  recentRequests.push(now)
  rateLimitStore.set(userId, recentRequests)
  return true
}

// Response cache to prevent hammering upstream under traffic spikes
let newsCache: { data: any; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const source = body?.source || 'nyt'

    if (source !== 'nyt') {
      return new Response(
        JSON.stringify({ error: 'Only NYT source is supported' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return cached response if fresh
    if (newsCache && Date.now() - newsCache.timestamp < CACHE_TTL) {
      return new Response(JSON.stringify(newsCache.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const response = await fetch('https://rss.nytimes.com/services/xml/rss/nyt/World.xml')
    if (!response.ok) throw new Error(`NYT RSS Error: ${response.status}`)

    const xmlText = await response.text()
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      removeNSPrefix: true,
      trimValues: true,
    })

    const parsed = parser.parse(xmlText)
    const itemsRaw = parsed?.rss?.channel?.item ?? []
    const items = Array.isArray(itemsRaw) ? itemsRaw : [itemsRaw]

    const pickImage = (item: any): string | null => {
      if (item?.enclosure?.url) return item.enclosure.url
      const contents = item?.content
      if (Array.isArray(contents)) {
        const found = contents.find((c: any) => c?.url)
        if (found?.url) return found.url
      } else if (contents?.url) {
        return contents.url
      }
      const thumb = item?.thumbnail
      if (Array.isArray(thumb)) {
        const found = thumb.find((t: any) => t?.url)
        if (found?.url) return found.url
      } else if (thumb?.url) {
        return thumb.url
      }
      return null
    }

    const stripTags = (html: string) => {
      if (!html || typeof html !== 'string') return ''
      return html.replace(/<[^>]+>/g, '').trim()
    }

    const articles = items.slice(0, 8).map((item: any) => {
      const imageUrl = pickImage(item)
      return {
        title: item?.title || 'Untitled',
        abstract: stripTags(item?.description || ''),
        url: item?.link || '#',
        published_date: item?.pubDate || new Date().toISOString(),
        multimedia: imageUrl
          ? [{ url: imageUrl, format: 'mediumThreeByTwo440', height: 293, width: 440, type: 'image', subtype: 'photo', caption: '' }]
          : [],
        byline: item?.creator || 'NYT',
        section: 'World',
      }
    })

    // Cache the result
    newsCache = { data: articles, timestamp: Date.now() }

    return new Response(JSON.stringify(articles), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Failed to fetch news' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})