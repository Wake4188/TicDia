
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
      return getRandomArticles(12, undefined, language);
    }

    const data = await fetchWikipediaContent(relatedTitles, language) as WikipediaResponse;
    const pages = Object.values(data.query?.pages || {});

    const articles = await Promise.all(pages.map(page => transformToArticle(page, language)));
    return articles.filter(Boolean) as WikipediaArticle[];
  } catch (error) {
    console.error('Error fetching related articles:', error);
    return getRandomArticles(12, undefined, language);
  }
};

const fetchArticles = async (titles: string[], language: Language): Promise<WikipediaArticle[]> => {
  const data = await fetchWikipediaContent(titles, language) as WikipediaResponse;
  const pages = Object.values(data.query?.pages || {});
  const articles = await Promise.all(pages.map(page => transformToArticle(page, language)));
  return articles.filter(Boolean) as WikipediaArticle[];
};

const getPersonalizedArticles = async (userId: string, count: number = 10, language: Language = DEFAULT_LANGUAGE): Promise<WikipediaArticle[]> => {
  try {
    // Import getUserAnalytics dynamically to avoid circular dependencies
    const { getUserAnalytics } = await import('./analyticsService');
    const analytics = await getUserAnalytics(userId);

    if (!analytics || !analytics.favorite_topics || analytics.favorite_topics.length === 0) {
      // No analytics data yet, fall back to random
      return getRandomArticles(count, undefined, language);
    }

    // Get top 3 favorite topics
    const topTopics = analytics.favorite_topics.slice(0, 3);

    // Calculate split: 70% personalized, 30% discovery
    const personalizedCount = Math.ceil(count * 0.7);
    const discoveryCount = count - personalizedCount;

    // Fetch personalized articles from favorite topics
    const personalizedPromises = topTopics.map(topic =>
      getRandomArticles(Math.ceil(personalizedCount / topTopics.length), topic, language)
        .catch(() => [] as WikipediaArticle[]) // Ignore failures for individual topics
    );

    const [personalizedResults, discoveryResults] = await Promise.all([
      Promise.all(personalizedPromises),
      getRandomArticles(discoveryCount, undefined, language).catch(() => [] as WikipediaArticle[])
    ]);

    // Flatten and combine
    const personalizedArticles = personalizedResults.flat();
    const allArticles = [...personalizedArticles, ...discoveryResults];

    // Remove duplicates by ID
    const uniqueArticles = Array.from(new Map(allArticles.map(a => [a.id, a])).values());

    // Shuffle to mix personalized and discovery
    const shuffled = uniqueArticles.sort(() => Math.random() - 0.5);

    return shuffled.slice(0, count);
  } catch (error) {
    console.error('Error fetching personalized articles:', error);
    // Fallback to random on any error
    return getRandomArticles(count, undefined, language);
  }
};

const getRandomArticles = async (count: number = 2, category?: string, language: Language = DEFAULT_LANGUAGE): Promise<WikipediaArticle[]> => {
  // Don't use cache for random articles to prevent duplicates in infinite scroll

  try {
    const multiplier = 3; // Increased multiplier for more variety
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
      return uniqueArticles.slice(0, count);
    }

    return validArticles.slice(0, count);
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
  getPersonalizedArticles,
  type WikipediaArticle
};
