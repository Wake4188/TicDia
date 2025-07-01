
import { useEffect, useRef, useCallback } from 'react';

interface UseArticleIntersectionProps {
  articles: any[];
  onVisibilityChange: (visibleIndices: Set<number>) => void;
  onCurrentIndexChange: (index: number) => void;
  onLoadMore: () => void;
}

export const useArticleIntersection = ({
  articles,
  onVisibilityChange,
  onCurrentIndexChange,
  onLoadMore
}: UseArticleIntersectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const visibleIndices = new Set<number>();
    let currentIndex = -1;
    let highestRatio = 0;

    entries.forEach((entry) => {
      const index = parseInt(entry.target.getAttribute("data-index") || "0");
      
      if (entry.isIntersecting) {
        visibleIndices.add(index);
        
        // Find the most visible article
        if (entry.intersectionRatio > highestRatio) {
          highestRatio = entry.intersectionRatio;
          currentIndex = index;
        }
        
        // Load more articles when approaching the end
        if (index >= articles.length - 2) {
          onLoadMore();
        }
      }
    });

    onVisibilityChange(visibleIndices);
    
    if (currentIndex >= 0) {
      onCurrentIndexChange(currentIndex);
    }
  }, [articles.length, onVisibilityChange, onCurrentIndexChange, onLoadMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: [0.1, 0.5, 0.7],
      root: null,
    });

    const articleElements = container.querySelectorAll(".article-section");
    articleElements.forEach((article) => observer.observe(article));

    return () => {
      articleElements.forEach((article) => observer.unobserve(article));
    };
  }, [articles, handleIntersection]);

  return containerRef;
};
