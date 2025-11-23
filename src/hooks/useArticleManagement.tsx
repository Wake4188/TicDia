
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

  // Track consecutive failed loads to prevent infinite loops
  const failedLoadCount = useRef(0);

  const loadMoreArticles = useCallback(async () => {
    if (isLoading) return;

    // Stop trying if we've failed too many times
    if (failedLoadCount.current >= 2) {
      console.log('Reached maximum retry limit for loading articles');
      return;
    }

    try {
      console.log('Loading more articles...');
      setIsLoading(true);

      let newArticles;
      // Try to fetch related articles first
      if (currentArticle) {
        newArticles = await getRelatedArticles(currentArticle, currentLanguage);
      } else {
        newArticles = await getRandomArticles(12, undefined, currentLanguage);
      }

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
        failedLoadCount.current = 0; // Reset counter on success
      } else {
        // If all were duplicates, fetch random articles instead
        console.log('All loaded articles were duplicates, fetching random articles...');
        const randomArticles = await getRandomArticles(12, undefined, currentLanguage);
        const uniqueRandomArticles = randomArticles.filter(article => {
          if (seenIds.current.has(article.id)) {
            return false;
          }
          seenIds.current.add(article.id);
          return true;
        });

        if (uniqueRandomArticles.length > 0) {
          setArticles(prev => [...prev, ...uniqueRandomArticles]);
          console.log(`Added ${uniqueRandomArticles.length} random articles`);
          failedLoadCount.current = 0; // Reset counter on success
        } else {
          failedLoadCount.current++;
          console.log(`Failed to load unique articles. Attempt ${failedLoadCount.current}/2`);
        }
      }
    } catch (error) {
      console.error("Failed to load more articles", error);
      failedLoadCount.current++;
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
