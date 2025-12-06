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

// Rate limiting
const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitStore.get(userId) || [];
  const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitStore.set(userId, recentRequests);
  return true;
}

let cache = new Map<string, { data: RSSArticle[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// SECURITY: Whitelist allowed RSS feed domains to prevent SSRF attacks
const ALLOWED_DOMAINS = [
  'rss.nytimes.com',
  'feeds.bbci.co.uk',
  'www.france24.com',
  'feeds.skynews.com',
  'feeds.reuters.com',
  'feeds.cnn.com',
  'feeds.theguardian.com',
  'rss.cbc.ca',
  'rss.app',
  'www.franceinfo.fr'
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
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

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Validate source parameter
    if (typeof source !== 'string' || source.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid source parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const urlObj = new URL(feedUrl);

      // Only allow HTTP and HTTPS protocols
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return new Response(
          JSON.stringify({ error: 'Invalid protocol. Only HTTP and HTTPS are allowed.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if domain is in whitelist
      if (!ALLOWED_DOMAINS.includes(urlObj.hostname)) {
        return new Response(
          JSON.stringify({
            error: 'Domain not allowed. Only whitelisted RSS feeds are supported.',
            allowed_domains: ALLOWED_DOMAINS
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Block private IP ranges
      const hostname = urlObj.hostname;
      if (
        hostname.startsWith('127.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('169.254.') ||
        hostname === 'localhost'
      ) {
        return new Response(
          JSON.stringify({ error: 'Access to private IP ranges is not allowed.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (urlError) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache first
    const cacheKey = feedUrl;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new Response(
        JSON.stringify(cached.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(feedUrl, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Ticdia RSS Feed Reader/1.0'
        }
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

        // Clean HTML tags from summary
        summary = summary.replace(/<[^>]*>/g, '').trim();
        if (summary.length > 200) {
          summary = summary.substring(0, 200) + '...';
        }

        const link = item.querySelector('link')?.textContent?.trim() ||
          item.querySelector('link')?.getAttribute('href') || '#';

        // Try multiple ways to get images
        let image: string | undefined;

        // Try enclosure
        const enclosure = item.querySelector('enclosure[type^="image"]');
        if (enclosure) {
          image = enclosure.getAttribute('url') || undefined;
        }

        // Try media:content or media:thumbnail
        if (!image) {
          const mediaContent = item.querySelector('media\\:content[medium="image"], content[medium="image"]');
          if (mediaContent) {
            image = mediaContent.getAttribute('url') || undefined;
          }
        }

        if (!image) {
          const mediaThumbnail = item.querySelector('media\\:thumbnail, thumbnail');
          if (mediaThumbnail) {
            image = mediaThumbnail.getAttribute('url') || undefined;
          }
        }

        // Try to extract image from description/content HTML
        if (!image) {
          const descContent = item.querySelector('description, content')?.textContent || '';
          const imgMatch = descContent.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
          if (imgMatch) {
            image = imgMatch[1];
          }
        }

        const pubDate = item.querySelector('pubDate, published, updated')?.textContent?.trim() ||
          new Date().toISOString();

        if (title && summary) {
          articles.push({
            title,
            summary,
            link,
            image,
            publishedAt: pubDate,
            source
          });
        }
      }

      // Cache the results
      cache.set(cacheKey, { data: articles, timestamp: Date.now() });

      return new Response(
        JSON.stringify(articles),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (fetchError) {
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
