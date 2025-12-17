
import { Language } from './languageConfig';

const getWikipediaApiBase = (language: Language) => `https://${language.wikipediaDomain}/w/api.php`;
const getPageviewsApiBase = (language: Language) => `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${language.wikipediaDomain}/all-access/all-agents`;

export const getPageViews = async (title: string, language: Language): Promise<number> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const formatDate = (date: Date) => date.toISOString().slice(0, 10).replace(/-/g, '');

    const response = await fetch(
      `${getPageviewsApiBase(language)}/${encodeURIComponent(title)}/daily/${formatDate(startDate)}/${formatDate(endDate)}`
    );
    
    if (!response.ok) {
      console.warn(`Failed to fetch pageviews for ${title} in ${language.name}`);
      return 0;
    }

    const data = await response.json();
    return data.items?.reduce((sum: number, item: any) => sum + item.views, 0) || 0;
  } catch (error) {
    console.warn(`Failed to fetch pageviews for ${title} in ${language.name}:`, error);
    return 0;
  }
};

export const fetchWikipediaContent = async (titles: string[], language: Language) => {
  // Wikipedia API has a limit of 50 titles per request
  const BATCH_SIZE = 50;
  const batches: string[][] = [];
  
  for (let i = 0; i < titles.length; i += BATCH_SIZE) {
    batches.push(titles.slice(i, i + BATCH_SIZE));
  }

  const fetchBatch = async (batchTitles: string[]) => {
    const titlesString = batchTitles.join("|");
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      prop: 'extracts|pageimages|categories|links|images|info',
      titles: titlesString,
      exintro: '1',
      explaintext: '1',
      pithumbsize: '1000',
      imlimit: '5',
      inprop: 'protection'
    });

    const response = await fetch(`${getWikipediaApiBase(language)}?${params}`);
    if (!response.ok) throw new Error(`Failed to fetch Wikipedia content in ${language.name}`);
    
    return response.json();
  };

  // Fetch all batches in parallel
  const results = await Promise.all(batches.map(fetchBatch));
  
  // Merge all pages into a single response object
  const mergedPages: Record<string, any> = {};
  for (const result of results) {
    if (result.query?.pages) {
      Object.assign(mergedPages, result.query.pages);
    }
  }

  return {
    query: {
      pages: mergedPages
    }
  };
};
