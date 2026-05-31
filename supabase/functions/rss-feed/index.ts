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

// Block requests to private / loopback / link-local / reserved IP ranges.
// Used as the only network-egress guard now that users can supply arbitrary RSS URLs.
function isPrivateHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')) return true;
  if (h === '0.0.0.0' || h === '::' || h === '::1' || h.startsWith('[::1') || h.startsWith('[fc') || h.startsWith('[fd')) return true;
  // IPv4 literal checks
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true; // multicast / reserved
  }
  return false;
}

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

      if (isPrivateHostname(urlObj.hostname)) {
        return new Response(
          JSON.stringify({ error: 'Access to private or reserved hosts is not allowed.' }),
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
        redirect: 'manual',
        headers: { 'User-Agent': 'Ticdia RSS Feed Reader/1.0' }
      });

      // If the upstream returned a redirect, validate the target hostname
      // before following it. This prevents SSRF via public→internal redirects
      // (e.g. AWS metadata at 169.254.169.254).
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) {
          return new Response(
            JSON.stringify({ error: 'Redirect response missing Location header' }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        try {
          const redirectUrl = new URL(location, feedUrl);
          if (redirectUrl.protocol !== 'http:' && redirectUrl.protocol !== 'https:') {
            return new Response(
              JSON.stringify({ error: 'Redirect to non-HTTP(S) protocol blocked' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          if (isPrivateHostname(redirectUrl.hostname)) {
            return new Response(
              JSON.stringify({ error: 'Redirect to private or reserved host blocked' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          // Re-fetch the validated redirect target without following further redirects.
          const redirectResponse = await fetch(redirectUrl.toString(), {
            signal: controller.signal,
            redirect: 'error',
            headers: { 'User-Agent': 'Ticdia RSS Feed Reader/1.0' }
          });
          clearTimeout(timeoutId);
          if (!redirectResponse.ok) {
            return new Response(
              JSON.stringify({ error: 'Failed to fetch RSS feed after redirect' }),
              { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          // Replace response variable scope by re-assigning via processing below.
          return await processFeedResponse(redirectResponse, source, cacheKey);
        } catch {
          return new Response(
            JSON.stringify({ error: 'Invalid redirect target' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
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
        const el = item as Element;
        const title = el.querySelector('title')?.textContent?.trim() || 'Untitled';
        let summary = el.querySelector('description, summary, content')?.textContent?.trim() || '';

        summary = summary.replace(/<[^>]*>/g, '').trim();
        if (summary.length > 200) summary = summary.substring(0, 200) + '...';

        const link = el.querySelector('link')?.textContent?.trim() ||
          el.querySelector('link')?.getAttribute('href') || '#';

        let image: string | undefined;

        const enclosure = el.querySelector('enclosure[type^="image"]');
        if (enclosure) image = enclosure.getAttribute('url') || undefined;

        if (!image) {
          const mediaContent = el.querySelector('media\\:content[medium="image"], content[medium="image"]');
          if (mediaContent) image = mediaContent.getAttribute('url') || undefined;
        }

        if (!image) {
          const mediaThumbnail = el.querySelector('media\\:thumbnail, thumbnail');
          if (mediaThumbnail) image = mediaThumbnail.getAttribute('url') || undefined;
        }

        if (!image) {
          const descContent = el.querySelector('description, content')?.textContent || '';
          const imgMatch = descContent.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
          if (imgMatch) image = imgMatch[1];
        }

        const pubDate = el.querySelector('pubDate, published, updated')?.textContent?.trim() || new Date().toISOString();

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