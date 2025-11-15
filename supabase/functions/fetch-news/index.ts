import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.4.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple in-memory rate limiting (kept from previous version)
const rateLimitStore = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userRequests = rateLimitStore.get(userId) || []
  const recentRequests = userRequests.filter((t) => now - t < RATE_LIMIT_WINDOW)
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
    const body = await req.json().catch(() => ({}))
    const source = body?.source || 'nyt'

    // Only NYT is supported; remove NewsAPI to avoid key errors
    if (source !== 'nyt') {
      return new Response(
        JSON.stringify({ error: 'Only NYT source is supported' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
      // enclosure url
      if (item?.enclosure?.url) return item.enclosure.url
      // media:content or media:thumbnail (after removeNSPrefix: true => content/thumbnail)
      const contents = item?.content
      if (Array.isArray(contents)) {
        const found = contents.find((c) => c?.url)
        if (found?.url) return found.url
      } else if (contents?.url) {
        return contents.url
      }
      const thumb = item?.thumbnail
      if (Array.isArray(thumb)) {
        const found = thumb.find((t) => t?.url)
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
          ? [
              {
                url: imageUrl,
                format: 'mediumThreeByTwo440',
                height: 293,
                width: 440,
                type: 'image',
                subtype: 'photo',
                caption: '',
              },
            ]
          : [],
        byline: item?.creator || 'NYT',
        section: 'World',
      }
    })

    return new Response(JSON.stringify(articles), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Error fetching news:', error)
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})