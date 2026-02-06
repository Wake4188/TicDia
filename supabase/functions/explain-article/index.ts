import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW)
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) return false
  
  recentRequests.push(now)
  rateLimitStore.set(userId, recentRequests)
  return true
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const body = await req.json();
    const { articleContent, articleTitle, language } = body;
    
    if (!articleContent || typeof articleContent !== 'string') {
      return new Response(
        JSON.stringify({ error: "Missing or invalid articleContent" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!articleTitle || typeof articleTitle !== 'string') {
      return new Response(
        JSON.stringify({ error: "Missing or invalid articleTitle" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!language || typeof language !== 'string') {
      return new Response(
        JSON.stringify({ error: "Missing or invalid language" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MAX_CONTENT_LENGTH = 50000;
    const MAX_TITLE_LENGTH = 500;
    
    if (articleContent.length > MAX_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Article content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (articleTitle.length > MAX_TITLE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Article title exceeds maximum length of ${MAX_TITLE_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const langCodeRegex = /^[a-z]{2,3}$/i;
    if (!langCodeRegex.test(language)) {
      return new Response(
        JSON.stringify({ error: "Invalid language code format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const languageNames: Record<string, string> = {
      en: "English", es: "Spanish", fr: "French", de: "German",
      it: "Italian", pt: "Portuguese", ru: "Russian", ja: "Japanese",
      zh: "Chinese", ar: "Arabic", hi: "Hindi", ko: "Korean",
      nl: "Dutch", pl: "Polish", tr: "Turkish", vi: "Vietnamese",
      th: "Thai", sv: "Swedish", uk: "Ukrainian", he: "Hebrew"
    };

    const languageName = languageNames[language] || "English";

    const systemPrompt = `You are an expert educator who explains complex topics in simple, clear terms. 
Your task is to explain Wikipedia articles in a way that's easier to understand than the original.
- Make concepts clearer and more accessible
- Use simple language and break down complex ideas
- Keep the explanation concise but comprehensive
- Maintain accuracy while improving clarity
- Respond in ${languageName}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Please explain this Wikipedia article about "${articleTitle}" in simpler terms:\n\n${articleContent}` 
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content;

    if (!explanation) {
      return new Response(
        JSON.stringify({ error: "No explanation generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ explanation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to process article explanation" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});