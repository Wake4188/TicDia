
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

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

const NEWS_API_KEY = "ec6c13feca684e75bb63b86dfac170b7";

export const fetchNewsApiHeadlines = async (): Promise<NewsApiArticle[]> => {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&apiKey=${NEWS_API_KEY}&pageSize=8`
    );
    
    if (!response.ok) {
      throw new Error(`NewsAPI Error: ${response.status}`);
    }
    
    const data: NewsApiResponse = await response.json();
    console.log('NewsAPI response:', data);
    return data.articles || [];
  } catch (error) {
    console.error('Error fetching NewsAPI headlines:', error);
    throw error;
  }
};
