import { supabase } from "@/integrations/supabase/client";

export interface NewsApiArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: {
    name: string;
  };
  author?: string;
}

export const fetchNewsApiHeadlines = async (): Promise<NewsApiArticle[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('User not authenticated, cannot fetch news');
      return [];
    }

    const { data, error } = await supabase.functions.invoke('fetch-news', {
      body: { source: 'newsapi' },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    if (error) {
      console.error('Error fetching NewsAPI headlines:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching NewsAPI headlines:', error);
    throw error;
  }
};
