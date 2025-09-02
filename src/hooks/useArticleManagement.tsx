
import { useState, useCallback } from "react";
import { getRandomArticles, getRelatedArticles } from "../services/wikipediaService";
import { useImprovedArticleIntersection } from "./useImprovedArticleIntersection";

export const useArticleManagement = (
  initialArticles: any[], 
  onArticleChange: (article: any) => void,
  onArticleViewed?: (articleTags?: string[]) => void
) => {
  const [articles, setArticles] = useState(initialArticles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const currentArticle = articles[currentIndex];

  const loadMoreArticles = useCallback(async () => {
    if (isLoading) return;
    
    try {
      console.log('Loading more articles...');
      setIsLoading(true);
      const newArticles = currentArticle 
        ? await getRelatedArticles(currentArticle)
        : await getRandomArticles(3);
      console.log('Loaded new articles:', newArticles.length);
      setArticles(prev => [...prev, ...newArticles]);
    } catch (error) {
      console.error("Failed to load more articles", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentArticle]);

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
    onVisibilityChange: () => {}, // Not used in current implementation
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
