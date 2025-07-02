
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
  const titlesString = titles.join("|");
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
