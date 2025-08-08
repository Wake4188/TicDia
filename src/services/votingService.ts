import { supabase } from "@/integrations/supabase/client";

export interface ArticleVote {
  id: string;
  user_id: string;
  article_id: string;
  article_title: string;
  article_url?: string;
  vote_type: 'upvote' | 'downvote';
  voted_at: string;
}

export const voteOnArticle = async (
  articleId: string,
  articleTitle: string,
  articleUrl?: string,
  voteType: 'upvote' | 'downvote' = 'upvote'
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('article_votes')
    .upsert({
      user_id: user.id,
      article_id: articleId,
      article_title: articleTitle,
      article_url: articleUrl,
      vote_type: voteType,
    }, {
      onConflict: 'user_id,article_id'
    });

  if (error) throw error;
  return data;
};

export const removeVote = async (articleId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('article_votes')
    .delete()
    .eq('user_id', user.id)
    .eq('article_id', articleId);

  if (error) throw error;
};

export const getUserVote = async (articleId: string): Promise<ArticleVote | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('article_votes')
    .select('*')
    .eq('user_id', user.id)
    .eq('article_id', articleId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as ArticleVote;
};

export const getArticleVoteCount = async (articleId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('article_votes')
    .select('*', { count: 'exact', head: true })
    .eq('article_id', articleId)
    .eq('vote_type', 'upvote');

  if (error) throw error;
  return count || 0;
};

export const getTopVotedArticles = async (limit: number = 3): Promise<any[]> => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('article_votes')
    .select('article_id, article_title, article_url, vote_type')
    .eq('vote_type', 'upvote')
    .gte('voted_at', `${today}T00:00:00.000Z`)
    .lt('voted_at', `${today}T23:59:59.999Z`);

  if (error) throw error;

  // Group by article and count votes
  const voteCounts = data.reduce((acc: any, vote) => {
    if (!acc[vote.article_id]) {
      acc[vote.article_id] = {
        id: vote.article_id,
        title: vote.article_title,
        url: vote.article_url,
        votes: 0
      };
    }
    acc[vote.article_id].votes++;
    return acc;
  }, {});

  // Sort by vote count and return top articles
  return Object.values(voteCounts)
    .sort((a: any, b: any) => b.votes - a.votes)
    .slice(0, limit);
};