import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface MerriamWebsterEntry {
  meta?: { id: string };
  fl?: string;
  shortdef?: string[];
  def?: unknown[];
}

interface WordDefinition {
  partOfSpeech: string;
  language: string;
  definitions: {
    definition: string;
    examples?: string[];
  }[];
}

// Rate limiting with cleanup
const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS_PER_WINDOW = 20;
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
  const recentRequests = userRequests.filter(t => now - t < RATE_LIMIT_WINDOW);

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) return false;

  recentRequests.push(now);
  rateLimitStore.set(userId, recentRequests);
  return true;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit per user
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      );
    }

    const url = new URL(req.url);
    const word = url.searchParams.get('word');

    if (!word || word.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Word parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate word length to prevent abuse
    if (word.length > 100) {
      return new Response(
        JSON.stringify({ success: false, error: 'Word too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('MERRIAM_WEBSTER_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Dictionary service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedWord = word.toLowerCase().trim();
    const apiUrl = `https://dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(normalizedWord)}?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: 'Dictionary API error' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    // Check if the response is an array of strings (suggestions for misspelled words)
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Word not found',
          suggestions: data.slice(0, 5)
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No definitions found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform Merriam-Webster format
    const definitions: WordDefinition[] = [];
    const seenPartsOfSpeech = new Set<string>();

    for (const entry of data as MerriamWebsterEntry[]) {
      if (!entry.fl || !entry.shortdef || entry.shortdef.length === 0) continue;

      const partOfSpeech = entry.fl;
      
      if (seenPartsOfSpeech.has(partOfSpeech)) {
        const existingEntry = definitions.find(d => d.partOfSpeech === partOfSpeech);
        if (existingEntry) {
          for (const def of entry.shortdef) {
            if (!existingEntry.definitions.some(d => d.definition === def)) {
              existingEntry.definitions.push({ definition: def, examples: [] });
            }
          }
        }
      } else {
        seenPartsOfSpeech.add(partOfSpeech);
        definitions.push({
          partOfSpeech,
          language: 'en',
          definitions: entry.shortdef.map(def => ({ definition: def, examples: [] }))
        });
      }
    }

    for (const def of definitions) {
      if (def.definitions.length > 5) {
        def.definitions = def.definitions.slice(0, 5);
      }
    }

    if (definitions.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No valid definitions found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, definitions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
