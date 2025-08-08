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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})