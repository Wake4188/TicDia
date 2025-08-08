
import { useEffect } from "react";
import { useTextAnimation } from "../hooks/useTextAnimation";
import { useArticleIntersection } from "../hooks/useArticleIntersection";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { useMobileDetection } from "../hooks/useMobileDetection";
import { useArticleManagement } from "../hooks/useArticleManagement";
import ArticleItem from "./ArticleItem";
import ArticleLoadingState from "./ArticleLoadingState";

const ArticleViewer = ({ articles: initialArticles, onArticleChange, onArticleView }) => {
  const userPreferences = useUserPreferences();
  const isMobile = useMobileDetection();
  
  const {
    articles,
    currentIndex,
    currentArticle,
    isLoading,
    loadMoreArticles,
    handleCurrentIndexChange
  } = useArticleManagement(initialArticles, onArticleChange);

  const { displayedText, progress } = useTextAnimation(currentArticle?.content || '', true, 80);

  const containerRef = useArticleIntersection({
    articles,
    onVisibilityChange: () => {},
    onCurrentIndexChange: (index) => {
      handleCurrentIndexChange(index);
      // Track article view when it becomes current
      const article = articles[index];
      if (article && onArticleView) {
        onArticleView(article.tags || []);
      }
    },
    onLoadMore: loadMoreArticles
  });

  useEffect(() => {
    if (articles.length > 0 && currentIndex === 0) {
      onArticleChange(articles[0]);
    }
  }, [articles, onArticleChange]);

  return (
    <main ref={containerRef} className="h-screen w-screen overflow-y-auto snap-y snap-mandatory">
      {articles.map((article, index) => (
        <ArticleItem
          key={`${article.id}-${index}`}
          article={article}
          index={index}
          isCurrent={currentIndex === index}
          displayedText={currentIndex === index ? displayedText : ''}
          progress={currentIndex === index ? progress : 0}
          userPreferences={userPreferences.userPreferences}
          isMobile={isMobile}
        />
      ))}
      {isLoading && <ArticleLoadingState />}
    </main>
  );
};

export default ArticleViewer;
