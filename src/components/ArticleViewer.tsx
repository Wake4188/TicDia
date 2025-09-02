import { useEffect } from "react";
import ArticleItem from "./ArticleItem";
import ArticleLoadingState from "./ArticleLoadingState";
import { useArticleManagement } from "../hooks/useArticleManagement";
import { useTextAnimation } from "../hooks/useTextAnimation";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { useMobileDetection } from "../hooks/useMobileDetection";

interface ArticleViewerProps {
  articles: any[];
  onArticleChange: (article: any) => void;
  onArticleView?: (articleTags?: string[]) => void;
}

const ArticleViewer = ({ articles, onArticleChange, onArticleView }: ArticleViewerProps) => {
  const { userPreferences } = useUserPreferences();
  const isMobile = useMobileDetection();
  
  const {
    articles: managedArticles,
    currentIndex,
    currentArticle,
    isLoading,
    containerRef,
    handleTtsStart,
    handleTtsStop,
    ttsPlayingIndex
  } = useArticleManagement(articles, onArticleChange, onArticleView);

  const { displayedText, progress } = useTextAnimation(
    currentArticle?.content || "",
    true
  );

  // Set up global TTS handlers for ArticleItem to use
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).handleTtsStart = handleTtsStart;
      (window as any).handleTtsStop = handleTtsStop;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).handleTtsStart;
        delete (window as any).handleTtsStop;
      }
    };
  }, [handleTtsStart, handleTtsStop]);

  return (
    <div className="flex-1 relative">
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitScrollbar: { display: 'none' }
        } as any}
      >
        
        {managedArticles.map((article, index) => (
          <ArticleItem
            key={`${article.id}-${index}`}
            article={article}
            index={index}
            isCurrent={index === currentIndex}
            displayedText={displayedText}
            progress={progress}
            userPreferences={userPreferences}
            isMobile={isMobile}
          />
        ))}
        
        {isLoading && <ArticleLoadingState />}
      </div>
    </div>
  );
};

export default ArticleViewer;