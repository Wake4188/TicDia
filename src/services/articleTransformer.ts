
import { WikipediaPage, WikipediaArticle } from './types';
import { getPageViews } from './wikipediaApi';
import { getArticleImage } from './imageService';
import { Language } from './languageConfig';

// Adult content category keywords to filter out
const ADULT_CONTENT_KEYWORDS = [
  'pornography',
  'pornographic',
  'sexual',
  'sexuality',
  'erotic',
  'nudity',
  'nude',
  'adult content',
  'adult film',
  'adult entertainment',
  'sex industry',
  'prostitution',
  'escort',
  'xxx',
  'nsfw',
  'explicit',
  'mature content',
  '18+',
  'adult-only',
  'sexual content',
  'sexual acts',
  'sexual practices',
  'sexual behavior',
  'sexual orientation',
  'sex work',
  'sex worker',
  'adult website',
  'adult magazine',
  'adult video',
  'adult material',
  'sexual material',
  'pornographic material',
  'adult film industry',
  'adult entertainment industry',
];

/**
 * Check if an article contains adult content based on its categories
 */
export const hasAdultContent = (page: WikipediaPage): boolean => {
  if (!page.categories || page.categories.length === 0) {
    return false;
  }

  const categoryTitles = page.categories.map(cat => 
    cat.title.replace("Category:", "").toLowerCase()
  );

  // Check if any category matches adult content keywords
  return categoryTitles.some(categoryTitle => 
    ADULT_CONTENT_KEYWORDS.some(keyword => 
      categoryTitle.includes(keyword.toLowerCase())
    )
  );
};

export const transformToArticle = async (
  page: WikipediaPage, 
  language: Language,
  allowAdultContent: boolean = false
): Promise<WikipediaArticle | null> => {
  // Filter out adult content if not allowed
  if (!allowAdultContent && hasAdultContent(page)) {
    return null;
  }

  const views = await getPageViews(page.title, language);
  const image = await getArticleImage(page);
  
  // Skip articles with placeholder images, no images, or no content
  if (!image || image.includes('data:image/svg') || image.includes('placeholder')) {
    return null;
  }
  
  // Skip articles without proper extract content (minimum 50 characters)
  if (!page.extract || page.extract.trim().length < 50) {
    return null;
  }
  
  return {
    id: page.pageid,
    title: page.title,
    content: page.extract,
    image,
    citations: Math.floor(Math.random() * 300) + 50,
    readTime: Math.ceil((page.extract.split(" ").length || 100) / 200),
    views,
    tags: page.categories?.slice(0, 4).map(cat => cat.title.replace("Category:", "")) || [],
    relatedArticles: [],
    language: language.code,
  };
};
