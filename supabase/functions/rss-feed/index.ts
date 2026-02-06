import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RSSArticle {
  title: string;
  summary: string;
  link: string;
  image?: string;
  publishedAt: string;
  source: string;
}

// Rate limiting with cleanup
const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS_PER_WINDOW = 15;
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 300000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [key, timestamps] of rateLimitStore) {
      const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
      if (recent.length === 0) rateLimitStore.delete(key);
      else rateLimitStore.set(key, recent);
    }
    lastCleanup = now;
  }

  const userRequests = rateLimitStore.get(userId) || [];
  const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) return false;
  
  recentRequests.push(now);
  rateLimitStore.set(userId, recentRequests);
  return true;
}

// Response cache to reduce upstream load under high traffic
const cache = new Map<string, { data: RSSArticle[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

const ALLOWED_DOMAINS = [
  'rss.nytimes.com', 'feeds.bbci.co.uk', 'www.france24.com',
  'feeds.skynews.com', 'feeds.reuters.com', 'feeds.cnn.com',
  'feeds.theguardian.com', 'rss.cbc.ca', 'rss.app', 'www.franceinfo.fr'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      );
    }

    let feedUrl: string | null = null;
    let source = 'RSS';

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      feedUrl = body.url;
      if (body.source) source = body.source;
    } else {
      const url = new URL(req.url);
      feedUrl = url.searchParams.get('url');
      source = url.searchParams.get('source') || 'RSS';
    }

    if (!feedUrl || typeof feedUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid url parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof source !== 'string' || source.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid source parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const urlObj = new URL(feedUrl);

      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return new Response(
          JSON.stringify({ error: 'Invalid protocol. Only HTTP and HTTPS are allowed.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!ALLOWED_DOMAINS.includes(urlObj.hostname)) {
        return new Response(
          JSON.stringify({ error: 'Domain not allowed. Only whitelisted RSS feeds are supported.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const hostname = urlObj.hostname;
      if (hostname.startsWith('127.') || hostname.startsWith('10.') || hostname.startsWith('192.168.') || hostname.startsWith('169.254.') || hostname === 'localhost') {
        return new Response(
          JSON.stringify({ error: 'Access to private IP ranges is not allowed.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache
    const cacheKey = feedUrl;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new Response(
        JSON.stringify(cached.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(feedUrl, {
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'Ticdia RSS Feed Reader/1.0' }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch RSS feed' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

      const items = Array.from(xmlDoc.querySelectorAll('item, entry')).slice(0, 15);
      const articles: RSSArticle[] = [];

      for (const item of items) {
        const title = item.querySelector('title')?.textContent?.trim() || 'Untitled';
        let summary = item.querySelector('description, summary, content')?.textContent?.trim() || '';

        summary = summary.replace(/<[^>]*>/g, '').trim();
        if (summary.length > 200) summary = summary.substring(0, 200) + '...';

        const link = item.querySelector('link')?.textContent?.trim() ||
          item.querySelector('link')?.getAttribute('href') || '#';

        let image: string | undefined;

        const enclosure = item.querySelector('enclosure[type^="image"]');
        if (enclosure) image = enclosure.getAttribute('url') || undefined;

        if (!image) {
          const mediaContent = item.querySelector('media\\:content[medium="image"], content[medium="image"]');
          if (mediaContent) image = mediaContent.getAttribute('url') || undefined;
        }

        if (!image) {
          const mediaThumbnail = item.querySelector('media\\:thumbnail, thumbnail');
          if (mediaThumbnail) image = mediaThumbnail.getAttribute('url') || undefined;
        }

        if (!image) {
          const descContent = item.querySelector('description, content')?.textContent || '';
          const imgMatch = descContent.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
          if (imgMatch) image = imgMatch[1];
        }

        const pubDate = item.querySelector('pubDate, published, updated')?.textContent?.trim() || new Date().toISOString();

        if (title && summary) {
          articles.push({ title, summary, link, image, publishedAt: pubDate, source });
        }
      }

      // Cache results - prevents thundering herd under high traffic
      cache.set(cacheKey, { data: articles, timestamp: Date.now() });

      // Cap cache size to prevent memory issues
      if (cache.size > 50) {
        const oldest = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < oldest.length - 50; i++) cache.delete(oldest[i][0]);
      }

      return new Response(
        JSON.stringify(articles),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Request timeout while fetching RSS feed' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw fetchError;
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch RSS feed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});