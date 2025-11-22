
import { useState, useCallback, useRef } from "react";
import { getRandomArticles, getRelatedArticles } from "../services/wikipediaService";
import { useImprovedArticleIntersection } from "./useImprovedArticleIntersection";
import { useLanguage } from "../contexts/LanguageContext";

export const useArticleManagement = (
  initialArticles: any[],
  onArticleChange: (article: any) => void,
  onArticleViewed?: (articleTags?: string[]) => void
) => {
  const [articles, setArticles] = useState(initialArticles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { currentLanguage } = useLanguage();

  const currentArticle = articles[currentIndex];

  // Track seen article IDs to prevent duplicates
  // Initialize with IDs from initialArticles
  const seenIds = useRef<Set<number>>(new Set(initialArticles.map(a => a.id)));

  const loadMoreArticles = useCallback(async () => {
    if (isLoading) return;

    try {
      console.log('Loading more articles...');
      setIsLoading(true);

      // Fetch more articles than needed to account for duplicates
      const newArticles = currentArticle
        ? await getRelatedArticles(currentArticle, currentLanguage)
        : await getRandomArticles(5, undefined, currentLanguage);

      // Filter out articles we've already seen
      const uniqueNewArticles = newArticles.filter(article => {
        if (seenIds.current.has(article.id)) {
          return false;
        }
        seenIds.current.add(article.id);
        return true;
      });

      console.log(`Loaded ${newArticles.length} articles, ${uniqueNewArticles.length} unique`);

      if (uniqueNewArticles.length > 0) {
        setArticles(prev => [...prev, ...uniqueNewArticles]);
      } else {
        // If all were duplicates, try fetching again (recursive but limited)
        // For now, just log it - the user can scroll to trigger another load
        console.log('All loaded articles were duplicates');
      }
    } catch (error) {
      console.error("Failed to load more articles", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentArticle, currentLanguage]);

  const handleCurrentIndexChange = useCallback((newIndex: number) => {
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < articles.length) {
      console.log('Article changed to index:', newIndex, 'Article:', articles[newIndex]?.title);
      setCurrentIndex(newIndex);
      onArticleChange(articles[newIndex]);
    }
  }, [currentIndex, articles, onArticleChange]);

  const handleArticleViewed = useCallback((index: number) => {
    const article = articles[index];
    if (article && onArticleViewed) {
      // Extract tags from article for analytics
      const tags = article.tags || [];
      onArticleViewed(tags);
    }
  }, [articles, onArticleViewed]);

  const {
    containerRef,
    handleTtsStart,
    handleTtsStop,
    ttsPlayingIndex
  } = useImprovedArticleIntersection({
    articles,
    onVisibilityChange: () => { }, // Not used in current implementation
    onCurrentIndexChange: handleCurrentIndexChange,
    onLoadMore: loadMoreArticles,
    onArticleViewed: handleArticleViewed
  });

  return {
    articles,
    currentIndex,
    currentArticle,
    isLoading,
    loadMoreArticles,
    handleCurrentIndexChange,
    containerRef,
    handleTtsStart,
    handleTtsStop,
    ttsPlayingIndex
  };
};
