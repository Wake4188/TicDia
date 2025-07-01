import { useState, useEffect, useCallback } from "react";
import { getRandomArticles, getRelatedArticles } from "../services/wikipediaService";
import { useAuth } from "@/contexts/AuthContext";
import { loadUserPreferences, getDefaultPreferences, UserPreferences } from "@/services/userPreferencesService";
import { useTextAnimation } from "../hooks/useTextAnimation";
import { useArticleIntersection } from "../hooks/useArticleIntersection";
import ArticleItem from "./ArticleItem";

const ArticleViewer = ({ articles: initialArticles, onArticleChange }) => {
  const { user } = useAuth();
  const [articles, setArticles] = useState(initialArticles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(getDefaultPreferences());
  const [visibleArticles, setVisibleArticles] = useState(new Set<number>([0]));

  const currentArticle = articles[currentIndex];
  const isCurrentVisible = visibleArticles.has(currentIndex);
  
  const { displayedText, progress } = useTextAnimation(
    currentArticle?.content || '',
    isCurrentVisible,
    80
  );

  // Load user preferences
  useEffect(() => {
    const loadPrefs = async () => {
      if (user) {
        try {
          const prefs = await loadUserPreferences(user.id);
          setUserPreferences(prefs);
          document.documentElement.style.setProperty('--progress-bar-color', prefs.highlightColor);
          document.documentElement.style.setProperty('--highlight-color', prefs.highlightColor);
        } catch (error) {
          console.error('Error loading user preferences:', error);
          const savedPrefs = localStorage.getItem('userPreferences');
          if (savedPrefs) {
            const prefs = JSON.parse(savedPrefs);
            if (prefs.progressBarColor && !prefs.highlightColor) {
              prefs.highlightColor = prefs.progressBarColor;
            }
            setUserPreferences({
              fontFamily: prefs.fontFamily || 'Inter',
              backgroundOpacity: prefs.backgroundOpacity || 70,
              highlightColor: prefs.highlightColor || '#FE2C55'
            });
            document.documentElement.style.setProperty('--progress-bar-color', prefs.highlightColor || '#FE2C55');
            document.documentElement.style.setProperty('--highlight-color', prefs.highlightColor || '#FE2C55');
          }
        }
      } else {
        const savedPrefs = localStorage.getItem('userPreferences');
        if (savedPrefs) {
          const prefs = JSON.parse(savedPrefs);
          if (prefs.progressBarColor && !prefs.highlightColor) {
            prefs.highlightColor = prefs.progressBarColor;
          }
          setUserPreferences({
            fontFamily: prefs.fontFamily || 'Inter',
            backgroundOpacity: prefs.backgroundOpacity || 70,
            highlightColor: prefs.highlightColor || '#FE2C55'
          });
          document.documentElement.style.setProperty('--progress-bar-color', prefs.highlightColor || '#FE2C55');
          document.documentElement.style.setProperty('--highlight-color', prefs.highlightColor || '#FE2C55');
        }
      }
    };

    loadPrefs();
  }, [user]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleVisibilityChange = useCallback((newVisibleArticles: Set<number>) => {
    setVisibleArticles(newVisibleArticles);
  }, []);

  const handleCurrentIndexChange = useCallback((newIndex: number) => {
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      onArticleChange(articles[newIndex]);
    }
  }, [currentIndex, articles, onArticleChange]);

  const containerRef = useArticleIntersection({
    articles,
    onVisibilityChange: handleVisibilityChange,
    onCurrentIndexChange: handleCurrentIndexChange,
    onLoadMore: loadMoreArticles
  });

  // Initialize first article as visible
  useEffect(() => {
    if (articles.length > 0) {
      setVisibleArticles(new Set([0]));
      setCurrentIndex(0);
      onArticleChange(articles[0]);
    }
  }, [articles, onArticleChange]);

  return (
    <main 
      ref={containerRef} 
      className="h-screen w-screen overflow-y-auto snap-y snap-mandatory"
    >
      {articles.map((article, index) => (
        <ArticleItem
          key={article.id}
          article={article}
          index={index}
          isVisible={visibleArticles.has(index)}
          isCurrent={currentIndex === index}
          displayedText={displayedText}
          progress={progress}
          userPreferences={userPreferences}
          isMobile={isMobile}
        />
      ))}
      {isLoading && (
        <div className="h-screen w-screen flex items-center justify-center">
          <div className="text-white">Loading more articles...</div>
        </div>
      )}
    </main>
  );
};

export default ArticleViewer;
