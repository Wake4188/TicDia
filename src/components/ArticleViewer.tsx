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

  const currentArticle = articles[currentIndex];
  
  const { displayedText, progress } = useTextAnimation(
    currentArticle?.content || '',
    true, // Always active to prevent flashing
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

  const handleCurrentIndexChange = useCallback((newIndex: number) => {
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < articles.length) {
      console.log('Article changed to index:', newIndex, 'Article:', articles[newIndex]?.title);
      setCurrentIndex(newIndex);
      onArticleChange(articles[newIndex]);
    }
  }, [currentIndex, articles, onArticleChange]);

  const containerRef = useArticleIntersection({
    articles,
    onVisibilityChange: () => {},
    onCurrentIndexChange: handleCurrentIndexChange,
    onLoadMore: loadMoreArticles
  });

  // Initialize first article
  useEffect(() => {
    if (articles.length > 0 && currentIndex === 0) {
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
          key={`${article.id}-${index}`}
          article={article}
          index={index}
          isCurrent={currentIndex === index}
          displayedText={currentIndex === index ? displayedText : ''}
          progress={currentIndex === index ? progress : 0}
          userPreferences={userPreferences}
          isMobile={isMobile}
        />
      ))}
      {isLoading && (
        <div className="h-screen w-screen flex items-center justify-center bg-black">
          <div className="text-white">Loading more articles...</div>
        </div>
      )}
    </main>
  );
};

export default ArticleViewer;
