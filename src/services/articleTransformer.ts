
import { WikipediaPage, WikipediaArticle } from './types';
import { getPageViews } from './wikipediaApi';
import { getArticleImage } from './imageService';
import { Language } from './languageConfig';

export const transformToArticle = async (page: WikipediaPage, language: Language): Promise<WikipediaArticle> => {
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
