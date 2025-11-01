
import { WikipediaArticle, WikipediaResponse } from './types';
import { fetchWikipediaContent } from './wikipediaApi';
import { transformToArticle } from './articleTransformer';
import { sortByRelevance } from './searchUtils';
import { Language, DEFAULT_LANGUAGE } from './languageConfig';
import { cache } from '@/utils/performance';

const getWikipediaApiBase = (language: Language) => `https://${language.wikipediaDomain}/w/api.php`;

const getRelatedArticles = async (article: WikipediaArticle, language: Language = DEFAULT_LANGUAGE): Promise<WikipediaArticle[]> => {
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

    const categoryResponse = await fetch(`${getWikipediaApiBase(language)}?${params}`);
    if (!categoryResponse.ok) throw new Error('Failed to fetch category articles');
    
    const categoryData = await categoryResponse.json() as WikipediaResponse;
    const relatedTitles = categoryData.query?.categorymembers
      ?.filter(relatedArticle => relatedArticle.title !== article.title)
      ?.map(relatedArticle => relatedArticle.title)
      ?.slice(0, 10) || [];

    if (relatedTitles.length === 0) {
      return getRandomArticles(3, undefined, language);
    }

    const data = await fetchWikipediaContent(relatedTitles, language) as WikipediaResponse;
    const pages = Object.values(data.query?.pages || {});
    
    const articles = await Promise.all(pages.map(page => transformToArticle(page, language)));
    return articles.filter(Boolean) as WikipediaArticle[];
  } catch (error) {
    console.error('Error fetching related articles:', error);
    return getRandomArticles(3, undefined, language);
  }
};

const fetchArticles = async (titles: string[], language: Language): Promise<WikipediaArticle[]> => {
  const data = await fetchWikipediaContent(titles, language) as WikipediaResponse;
  const pages = Object.values(data.query?.pages || {});
  const articles = await Promise.all(pages.map(page => transformToArticle(page, language)));
  return articles.filter(Boolean) as WikipediaArticle[];
};

const getRandomArticles = async (count: number = 2, category?: string, language: Language = DEFAULT_LANGUAGE): Promise<WikipediaArticle[]> => {
  // Check cache first
  const cacheKey = `random_${language.code}_${count}_${category || 'all'}`;
  const cached = cache.get<WikipediaArticle[]>(cacheKey);
  if (cached) return cached;

  try {
    const multiplier = 2; // Reduced multiplier for faster initial load
    let titles: string[];
    
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

      const response = await fetch(`${getWikipediaApiBase(language)}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch category articles');
      
      const data = await response.json() as WikipediaResponse;
      titles = data.query?.categorymembers?.map(article => article.title) || [];
    } else {
      const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        origin: '*',
        list: 'random',
        rnnamespace: '0',
        rnlimit: (count * multiplier).toString()
      });

      const response = await fetch(`${getWikipediaApiBase(language)}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch random articles');
      
      const data = await response.json() as WikipediaResponse;
      titles = data.query?.random?.map(article => article.title) || [];
    }

    if (!titles.length) throw new Error('No articles found');

    const validArticles = await fetchArticles(titles, language);
    
    if (validArticles.length < count) {
      const moreArticles = await getRandomArticles(count - validArticles.length, category, language);
      // Remove duplicates by ID before merging
      const combined = [...validArticles, ...moreArticles];
      const uniqueArticles = Array.from(new Map(combined.map(a => [a.id, a])).values());
      const result = uniqueArticles.slice(0, count);
      cache.set(cacheKey, result, 300000); // Cache for 5 minutes
      return result;
    }
    
    const result = validArticles.slice(0, count);
    cache.set(cacheKey, result, 300000); // Cache for 5 minutes
    return result;
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }
};

const searchArticles = async (query: string, language: Language = DEFAULT_LANGUAGE): Promise<WikipediaArticle[]> => {
  if (!query || query.length < 3) return [];

  // Check cache first
  const cacheKey = `search_${language.code}_${query.toLowerCase()}`;
  const cached = cache.get<WikipediaArticle[]>(cacheKey);
  if (cached) return cached;

  try {
    // Opensearch for suggestions
    const opensearchParams = new URLSearchParams({
      action: 'opensearch',
      format: 'json',
      origin: '*',
      search: query,
      limit: '10',
      redirects: 'resolve'
    });

    const [opensearchResponse, searchResponse] = await Promise.all([
      fetch(`${getWikipediaApiBase(language)}?${opensearchParams}`),
      fetch(`${getWikipediaApiBase(language)}?${new URLSearchParams({
        action: 'query',
        format: 'json',
        origin: '*',
        list: 'search',
        srsearch: query,
        srlimit: '20',
        srwhat: 'text'
      })}`)
    ]);

    let suggestedTitles: string[] = [];
    if (opensearchResponse.ok) {
      const opensearchData = await opensearchResponse.json();
      suggestedTitles = opensearchData[1] || [];
    }

    if (!searchResponse.ok) throw new Error('Search request failed');
    
    const searchData = await searchResponse.json() as WikipediaResponse;
    const searchTitles = searchData.query?.search?.map(result => result.title) || [];

    const allTitles = [...new Set([...suggestedTitles, ...searchTitles])];
    if (!allTitles.length) return [];

    const validArticles = await fetchArticles(allTitles, language);
    const result = sortByRelevance(validArticles, query);
    cache.set(cacheKey, result, 600000); // Cache for 10 minutes
    return result;
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
