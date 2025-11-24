
import { useState, useCallback, useRef, useEffect } from "react";
import { getRandomArticles, getRelatedArticles } from "../services/wikipediaService";
import { useImprovedArticleIntersection } from "./useImprovedArticleIntersection";
import { useLanguage } from "../contexts/LanguageContext";

const SEEN_IDS_STORAGE_KEY = 'ticdia_seen_article_ids';
const MAX_SEEN_IDS = 500; // Store last 500 seen article IDs

// Load seen IDs from localStorage
function loadSeenIds(): Set<number> {
  try {
    const stored = localStorage.getItem(SEEN_IDS_STORAGE_KEY);
    if (stored) {
      const idsArray = JSON.parse(stored) as number[];
      return new Set(idsArray);
    }
  } catch (error) {
    console.error('Error loading seen article IDs:', error);
  }
  return new Set();
}

// Save seen IDs to localStorage (keep only last MAX_SEEN_IDS)
function saveSeenIds(seenIds: Set<number>): void {
  try {
    const idsArray = Array.from(seenIds);
    // Keep only the most recent IDs
    const recentIds = idsArray.slice(-MAX_SEEN_IDS);
    localStorage.setItem(SEEN_IDS_STORAGE_KEY, JSON.stringify(recentIds));
  } catch (error) {
    console.error('Error saving seen article IDs:', error);
  }
}

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
  // Load from localStorage on mount, then merge with initialArticles
  const seenIds = useRef<Set<number>>(loadSeenIds());

  // Add initial article IDs to seen set
  useEffect(() => {
    initialArticles.forEach(a => seenIds.current.add(a.id));
    saveSeenIds(seenIds.current);
  }, []); // Only run once on mount


  // Track consecutive failed loads to prevent infinite loops
  const failedLoadCount = useRef(0);

  const loadMoreArticles = useCallback(async () => {
    if (isLoading) return;

    // Stop trying if we've failed too many times
    if (failedLoadCount.current >= 2) {
      return;
    }

    try {
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

      if (uniqueNewArticles.length > 0) {
        setArticles(prev => [...prev, ...uniqueNewArticles]);
        saveSeenIds(seenIds.current); // Persist to localStorage
        failedLoadCount.current = 0; // Reset counter on success
      } else {
        // If all were duplicates, fetch random articles instead
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
          saveSeenIds(seenIds.current); // Persist to localStorage
          failedLoadCount.current = 0; // Reset counter on success
        } else {
          failedLoadCount.current++;
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
