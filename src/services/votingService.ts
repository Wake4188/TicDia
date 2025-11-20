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
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as ArticleVote;
};

export const getArticleVoteCount = async (articleId: string): Promise<number> => {
  // Use secure database function that doesn't expose individual votes
  const { data, error } = await supabase
    .rpc('get_article_vote_count', { p_article_id: articleId });

  if (error) throw error;
  return data || 0;
};

export const getTopVotedArticles = async (limit: number = 3): Promise<any[]> => {
  const today = new Date().toISOString().split('T')[0];

  // Use secure database function that returns aggregated data only
  const { data, error } = await supabase
    .rpc('get_top_voted_articles', {
      p_limit: limit,
      p_date: today
    });

  if (error) throw error;

  // Map to the expected format
  return (data || []).map((article: any) => ({
    id: article.article_id,
    title: article.article_title,
    url: article.article_url,
    votes: Number(article.vote_count)
  }));
};