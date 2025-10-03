import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting: Store request timestamps per user
const rateLimitStore = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userRequests = rateLimitStore.get(userId) || []
  
  // Filter out old requests
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

  try {
    const { source } = await req.json()

    if (source === 'newsapi') {
      const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY')
      if (!NEWS_API_KEY) {
        throw new Error('NEWS_API_KEY not configured')
      }

      const response = await fetch(
        `https://newsapi.org/v2/top-headlines?country=us&pageSize=8`,
        {
          headers: {
            'X-Api-Key': NEWS_API_KEY
          }
        }
      )

      if (!response.ok) {
        throw new Error(`NewsAPI Error: ${response.status}`)
      }

      const data = await response.json()
      return new Response(
        JSON.stringify(data.articles || []),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (source === 'nyt') {
      const response = await fetch('https://rss.nytimes.com/services/xml/rss/nyt/World.xml')

      if (!response.ok) {
        throw new Error(`NYT RSS Error: ${response.status}`)
      }

      const text = await response.text()
      const xml = new DOMParser().parseFromString(text, 'text/xml')
      const items = Array.from(xml.querySelectorAll('item'))

      const articles = items.slice(0, 8).map((item) => {
        const getImage = () => {
          const mediaContent = item.querySelector('media\\:content')
          if (mediaContent?.getAttribute('url')) return mediaContent.getAttribute('url')
          const mediaThumbnail = item.querySelector('media\\:thumbnail')
          if (mediaThumbnail?.getAttribute('url')) return mediaThumbnail.getAttribute('url')
          return null
        }

        const imageUrl = getImage()
        
        return {
          title: item.querySelector('title')?.textContent || 'Untitled',
          abstract: item.querySelector('description')?.textContent?.replace(/<[^>]+>/g, '').trim() || '',
          url: item.querySelector('link')?.textContent || '#',
          published_date: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
          multimedia: imageUrl ? [{
            url: imageUrl,
            format: 'mediumThreeByTwo440',
            height: 293,
            width: 440,
            type: 'image',
            subtype: 'photo',
            caption: ''
          }] : [],
          byline: item.querySelector('dc\\:creator')?.textContent || 'NYT',
          section: 'World'
        }
      })

      return new Response(
        JSON.stringify(articles),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid source' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error fetching news:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
