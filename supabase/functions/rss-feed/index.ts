import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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

let cache = new Map<string, { data: RSSArticle[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const feedUrl = url.searchParams.get('url');
    const source = url.searchParams.get('source') || 'RSS';

    if (!feedUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache first
    const cacheKey = feedUrl;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached RSS data for:', feedUrl);
      return new Response(
        JSON.stringify(cached.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching RSS feed:', feedUrl);

    const response = await fetch(feedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`);
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

    console.log(`Successfully parsed ${articles.length} articles from RSS feed`);

    return new Response(
      JSON.stringify(articles),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('RSS feed error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch RSS feed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});