import { useEffect, useRef, useCallback, useState } from 'react';

interface UseImprovedArticleIntersectionProps {
  articles: any[];
  onVisibilityChange: (visibleIndices: Set<number>) => void;
  onCurrentIndexChange: (index: number) => void;
  onLoadMore: () => void;
  onArticleViewed: (index: number) => void; // New callback for confirmed views
}

export const useImprovedArticleIntersection = ({
  articles,
  onVisibilityChange,
  onCurrentIndexChange,
  onLoadMore,
  onArticleViewed
}: UseImprovedArticleIntersectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const viewedArticles = useRef<Set<number>>(new Set());
  const [ttsPlayingIndex, setTtsPlayingIndex] = useState<number | null>(null);
  
  // Track TTS playing state
  const handleTtsStart = useCallback((index: number) => {
    setTtsPlayingIndex(index);
    // Immediately count as viewed when TTS starts
    if (!viewedArticles.current.has(index)) {
      viewedArticles.current.add(index);
      onArticleViewed(index);
    }
  }, [onArticleViewed]);

  const handleTtsStop = useCallback(() => {
    setTtsPlayingIndex(null);
  }, []);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    let currentIndex = -1;
    let highestRatio = 0;
    const visibleIndices = new Set<number>();

    entries.forEach((entry) => {
      const index = parseInt(entry.target.getAttribute("data-index") || "0");
      
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        visibleIndices.add(index);
        
        // Find the most visible article
        if (entry.intersectionRatio > highestRatio) {
          highestRatio = entry.intersectionRatio;
          currentIndex = index;
        }
        
        // Start timer for view counting (2-3 seconds)
        if (!viewTimers.current.has(index) && !viewedArticles.current.has(index)) {
          const timer = setTimeout(() => {
            if (!viewedArticles.current.has(index)) {
              viewedArticles.current.add(index);
              onArticleViewed(index);
            }
            viewTimers.current.delete(index);
          }, 2500); // 2.5 seconds
          
          viewTimers.current.set(index, timer);
        }
        
        // Load more articles when approaching the end
        if (index >= articles.length - 2) {
          onLoadMore();
        }
      } else {
        // Clear timer if article goes out of view before time threshold
        const timer = viewTimers.current.get(index);
        if (timer) {
          clearTimeout(timer);
          viewTimers.current.delete(index);
        }
      }
    });

    onVisibilityChange(visibleIndices);

    if (currentIndex >= 0) {
      onCurrentIndexChange(currentIndex);
    }
  }, [articles.length, onCurrentIndexChange, onLoadMore, onArticleViewed, onVisibilityChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: [0.5, 0.7, 0.9],
      root: null,
    });

    const articleElements = container.querySelectorAll(".article-section");
    articleElements.forEach((article) => observer.observe(article));

    return () => {
      articleElements.forEach((article) => observer.unobserve(article));
      // Clean up all timers
      viewTimers.current.forEach(timer => clearTimeout(timer));
      viewTimers.current.clear();
    };
  }, [articles, handleIntersection]);

  // Reset viewed articles when articles array changes significantly
  useEffect(() => {
    viewedArticles.current.clear();
  }, [articles.length]);

  return {
    containerRef,
    handleTtsStart,
    handleTtsStop,
    ttsPlayingIndex
  };
};