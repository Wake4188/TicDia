
import { WikipediaArticle, WikipediaResponse } from './types';
import { fetchWikipediaContent } from './wikipediaApi';
import { transformToArticle } from './articleTransformer';
import { sortByRelevance } from './searchUtils';

const getRelatedArticles = async (article: WikipediaArticle): Promise<WikipediaArticle[]> => {
  try {
    const categoryTitles = article.tags.map(tag => `Category:${tag}`).join('|');
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      list: 'categorymembers',
      cmtitle: categoryTitles,
      cmlimit: '10',
      cmtype: 'page'
    });

    const categoryResponse = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
    if (!categoryResponse.ok) throw new Error('Failed to fetch category articles');
    
    const categoryData = await categoryResponse.json() as WikipediaResponse;
    const relatedTitles = categoryData.query?.categorymembers
      ?.filter(article => article.title !== article.title)
      ?.map(article => article.title)
      ?.slice(0, 10) || [];

    if (relatedTitles.length === 0) {
      return getRandomArticles(3);
    }

    const data = await fetchWikipediaContent(relatedTitles) as WikipediaResponse;
    const pages = Object.values(data.query?.pages || {});
    
    const articles = await Promise.all(pages.map(transformToArticle));
    return articles.filter(article => article !== null) as WikipediaArticle[];
  } catch (error) {
    console.error('Error fetching related articles:', error);
    return getRandomArticles(3);
  }
};

const getRandomArticles = async (count: number = 3, category?: string): Promise<WikipediaArticle[]> => {
  try {
    let titles: string[];
    const multiplier = 3;
    
    if (category && category !== "All") {
      const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        origin: '*',
        list: 'categorymembers',
        cmtitle: `Category:${category}`,
        cmlimit: (count * multiplier).toString(),
        cmtype: 'page'
      });

      const categoryResponse = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
      if (!categoryResponse.ok) throw new Error('Failed to fetch category articles');
      
      const categoryData = await categoryResponse.json() as WikipediaResponse;
      titles = categoryData.query?.categorymembers?.map(article => article.title) || [];
    } else {
      const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        origin: '*',
        list: 'random',
        rnnamespace: '0',
        rnlimit: (count * multiplier).toString()
      });

      const randomResponse = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
      if (!randomResponse.ok) throw new Error('Failed to fetch random articles');
      
      const randomData = await randomResponse.json() as WikipediaResponse;
      titles = randomData.query?.random?.map(article => article.title) || [];
    }

    if (!titles.length) throw new Error('No articles found');

    const data = await fetchWikipediaContent(titles) as WikipediaResponse;
    const pages = Object.values(data.query?.pages || {});
    
    const articles = await Promise.all(pages.map(transformToArticle));
    const validArticles = articles.filter(article => article !== null) as WikipediaArticle[];
    
    if (validArticles.length < count) {
      const moreArticles = await getRandomArticles(count - validArticles.length, category);
      return [...validArticles, ...moreArticles].slice(0, count);
    }
    
    return validArticles.slice(0, count);
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }
};

const searchArticles = async (query: string): Promise<WikipediaArticle[]> => {
  if (!query || query.length < 3) return [];

  try {
    // First, try opensearch for better suggestions
    const opensearchParams = new URLSearchParams({
      action: 'opensearch',
      format: 'json',
      origin: '*',
      search: query,
      limit: '10',
      redirects: 'resolve'
    });

    const opensearchResponse = await fetch(`https://en.wikipedia.org/w/api.php?${opensearchParams}`);
    let suggestedTitles: string[] = [];
    
    if (opensearchResponse.ok) {
      const opensearchData = await opensearchResponse.json();
      suggestedTitles = opensearchData[1] || [];
    }

    // Then do regular search
    const searchParams = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      list: 'search',
      srsearch: query,
      srlimit: '20',
      srwhat: 'text'
    });

    const searchResponse = await fetch(`https://en.wikipedia.org/w/api.php?${searchParams}`);
    if (!searchResponse.ok) throw new Error('Search request failed');
    
    const searchData = await searchResponse.json() as WikipediaResponse;
    const searchTitles = searchData.query?.search?.map(result => result.title) || [];

    // Combine and deduplicate titles, prioritizing opensearch results
    const allTitles = [...new Set([...suggestedTitles, ...searchTitles])];
    
    if (!allTitles.length) return [];

    const data = await fetchWikipediaContent(allTitles) as WikipediaResponse;
    const pages = Object.values(data.query?.pages || {});
    
    const articles = await Promise.all(pages.map(transformToArticle));
    const validArticles = articles.filter(article => article !== null) as WikipediaArticle[];
    
    // Sort by relevance using our enhanced algorithm
    return sortByRelevance(validArticles, query);
  } catch (error) {
    console.error('Error searching articles:', error);
    throw error;
  }
};

export { 
  getRandomArticles,
  searchArticles,
  getRelatedArticles,
  type WikipediaArticle 
};
