import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface MerriamWebsterEntry {
  meta?: { id: string };
  fl?: string; // part of speech
  shortdef?: string[]; // short definitions
  def?: unknown[]; // detailed definitions
}

interface WordDefinition {
  partOfSpeech: string;
  language: string;
  definitions: {
    definition: string;
    examples?: string[];
  }[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      console.error('MERRIAM_WEBSTER_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Dictionary service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedWord = word.toLowerCase().trim();
    const apiUrl = `https://dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(normalizedWord)}?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(`Merriam-Webster API error: ${response.status}`);
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
          suggestions: data.slice(0, 5) // Return up to 5 spelling suggestions
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if we have valid entries
    if (!Array.isArray(data) || data.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No definitions found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform Merriam-Webster format to our WordDefinition format
    const definitions: WordDefinition[] = [];
    const seenPartsOfSpeech = new Set<string>();

    for (const entry of data as MerriamWebsterEntry[]) {
      // Skip entries without part of speech or definitions
      if (!entry.fl || !entry.shortdef || entry.shortdef.length === 0) {
        continue;
      }

      const partOfSpeech = entry.fl;
      
      // Group definitions by part of speech
      if (seenPartsOfSpeech.has(partOfSpeech)) {
        // Add definitions to existing entry
        const existingEntry = definitions.find(d => d.partOfSpeech === partOfSpeech);
        if (existingEntry) {
          for (const def of entry.shortdef) {
            // Avoid duplicate definitions
            if (!existingEntry.definitions.some(d => d.definition === def)) {
              existingEntry.definitions.push({
                definition: def,
                examples: []
              });
            }
          }
        }
      } else {
        // Create new entry for this part of speech
        seenPartsOfSpeech.add(partOfSpeech);
        definitions.push({
          partOfSpeech,
          language: 'en',
          definitions: entry.shortdef.map(def => ({
            definition: def,
            examples: []
          }))
        });
      }
    }

    // Limit definitions per part of speech to keep response size reasonable
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
    console.error('Dictionary lookup error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
