import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    // Create client with anon key to verify JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify user is authenticated and has admin role
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has admin role
    const { data: hasAdminRole, error: roleError } = await supabaseAuth.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    })

    if (roleError || !hasAdminRole) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create service role client for data operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Idempotency check - only run once per day
    const today = new Date().toISOString().split('T')[0]
    const lastRunKey = `last_article_selection_run`
    
    // Check if we've already run today by looking at created_at of today_articles
    const { data: existingArticles } = await supabase
      .from('today_articles')
      .select('created_at')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .limit(1)

    if (existingArticles && existingArticles.length > 0) {
      console.log('Daily article selection already ran today')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Daily article selection already completed for today',
          alreadyRan: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get top 3 voted articles from yesterday (since this runs at 5 PM, we want yesterday's votes)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const startDate = `${yesterday.toISOString().split('T')[0]}T00:00:00.000Z`
    const endDate = `${yesterday.toISOString().split('T')[0]}T23:59:59.999Z`

    console.log(`Getting top voted articles from ${startDate} to ${endDate}`)

    const { data: votes, error: votesError } = await supabase
      .from('article_votes')
      .select('article_id, article_title, article_url')
      .eq('vote_type', 'upvote')
      .gte('voted_at', startDate)
      .lt('voted_at', endDate)

    if (votesError) {
      console.error('Error fetching votes:', votesError)
      throw votesError
    }

    // Group by article and count votes
    const voteCounts = votes.reduce((acc: any, vote) => {
      if (!acc[vote.article_id]) {
        acc[vote.article_id] = {
          id: vote.article_id,
          title: vote.article_title,
          url: vote.article_url,
          votes: 0
        }
      }
      acc[vote.article_id].votes++
      return acc
    }, {})

    // Sort by vote count and get top 3
    const topArticles = Object.values(voteCounts)
      .sort((a: any, b: any) => b.votes - a.votes)
      .slice(0, 3)

    console.log(`Found ${topArticles.length} top articles:`, topArticles)

    // Clear existing today articles
    const { error: deleteError } = await supabase
      .from('today_articles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      console.error('Error clearing today articles:', deleteError)
    }

    // Insert new today articles
    const todayArticles = topArticles.map((article: any) => ({
      title: article.title,
      content: `This article received ${article.votes} votes yesterday and was selected as one of today's featured articles.`,
      url: article.url,
      is_admin_added: false
    }))

    if (todayArticles.length > 0) {
      const { error: insertError } = await supabase
        .from('today_articles')
        .insert(todayArticles)

      if (insertError) {
        console.error('Error inserting today articles:', insertError)
        throw insertError
      }

      console.log(`Successfully added ${todayArticles.length} articles to today's selection`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        articlesAdded: todayArticles.length,
        articles: topArticles 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Daily article selection error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})