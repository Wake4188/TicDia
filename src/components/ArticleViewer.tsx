
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Progress } from "./ui/progress";
import { getRandomArticles, getRelatedArticles } from "../services/wikipediaService";
import { useAuth } from "@/contexts/AuthContext";
import { loadUserPreferences, getDefaultPreferences, UserPreferences } from "@/services/userPreferencesService";

const ArticleViewer = ({ articles: initialArticles, onArticleChange }) => {
  const { user } = useAuth();
  const [articles, setArticles] = useState(initialArticles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(getDefaultPreferences());
  const [visibleArticles, setVisibleArticles] = useState(new Set<number>());
  const containerRef = useRef<HTMLDivElement>(null);
  const currentArticle = articles[currentIndex];

  // Load user preferences from database
  useEffect(() => {
    const loadPrefs = async () => {
      if (user) {
        try {
          const prefs = await loadUserPreferences(user.id);
          setUserPreferences(prefs);
          
          // Update CSS variables
          document.documentElement.style.setProperty('--progress-bar-color', prefs.highlightColor);
          document.documentElement.style.setProperty('--highlight-color', prefs.highlightColor);
        } catch (error) {
          console.error('Error loading user preferences:', error);
          // Fallback to localStorage
          const savedPrefs = localStorage.getItem('userPreferences');
          if (savedPrefs) {
            const prefs = JSON.parse(savedPrefs);
            // Migrate old progressBarColor to highlightColor
            if (prefs.progressBarColor && !prefs.highlightColor) {
              prefs.highlightColor = prefs.progressBarColor;
            }
            setUserPreferences({
              fontFamily: prefs.fontFamily || 'Inter',
              backgroundOpacity: prefs.backgroundOpacity || 70,
              highlightColor: prefs.highlightColor || '#FE2C55'
            });
            
            // Update CSS variables
            document.documentElement.style.setProperty('--progress-bar-color', prefs.highlightColor || '#FE2C55');
            document.documentElement.style.setProperty('--highlight-color', prefs.highlightColor || '#FE2C55');
          }
        }
      } else {
        // Not logged in, use localStorage
        const savedPrefs = localStorage.getItem('userPreferences');
        if (savedPrefs) {
          const prefs = JSON.parse(savedPrefs);
          // Migrate old progressBarColor to highlightColor
          if (prefs.progressBarColor && !prefs.highlightColor) {
            prefs.highlightColor = prefs.progressBarColor;
          }
          setUserPreferences({
            fontFamily: prefs.fontFamily || 'Inter',
            backgroundOpacity: prefs.backgroundOpacity || 70,
            highlightColor: prefs.highlightColor || '#FE2C55'
          });
          
          // Update CSS variables
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

  // Handle intersection observer for both mobile and desktop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute("data-index") || "0");
          
          if (entry.isIntersecting) {
            console.log('Article visible:', index);
            setVisibleArticles(prev => new Set([...prev, index]));
            
            // Update current index when article becomes visible
            if (entry.intersectionRatio > 0.7) {
              setCurrentIndex(index);
              onArticleChange(articles[index]);
            }
            
            // Load more articles when approaching the end
            if (index >= articles.length - 2) {
              console.log('Near end, loading more articles...');
              loadMoreArticles();
            }
          } else {
            setVisibleArticles(prev => {
              const newSet = new Set(prev);
              newSet.delete(index);
              return newSet;
            });
          }
        });
      },
      {
        threshold: [0.1, 0.7],
        root: null,
      }
    );

    const articleElements = container.querySelectorAll(".article-section");
    articleElements.forEach((article) => observer.observe(article));

    return () => {
      articleElements.forEach((article) => observer.unobserve(article));
    };
  }, [articles, loadMoreArticles, onArticleChange]);

  // Text animation effect for visible articles
  useEffect(() => {
    visibleArticles.forEach((index) => {
      const article = articles[index];
      if (!article?.content) return;

      const text = article.content;
      const words = text.split(' ');
      let currentWordIndex = 0;

      const interval = setInterval(() => {
        if (currentWordIndex < words.length && visibleArticles.has(index)) {
          const wordsToShow = words.slice(0, currentWordIndex + 1);
          // Update displayedText for the specific article
          if (index === currentIndex) {
            setDisplayedText(wordsToShow.join(' '));
            setProgress(((currentWordIndex + 1) / words.length) * 100);
          }
          currentWordIndex++;
        } else {
          clearInterval(interval);
        }
      }, 80);

      return () => clearInterval(interval);
    });
  }, [visibleArticles, articles, currentIndex]);

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
        <div 
          key={article.id} 
          data-index={index}
          className="article-section h-screen w-screen snap-start snap-always relative flex items-center justify-center"
        >
          <div className="absolute inset-0 w-screen h-screen">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div 
              className="absolute inset-0 bg-black"
              style={{ 
                opacity: userPreferences.backgroundOpacity / 100
              }}
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: visibleArticles.has(index) ? 1 : 0,
              y: visibleArticles.has(index) ? 0 : 20,
            }}
            transition={{ duration: 0.5 }}
            className="relative z-10 text-white p-4 sm:p-8 max-w-3xl mx-auto h-full flex flex-col justify-center"
          >
            <div className={`${isMobile ? 'bg-black/40 backdrop-blur-sm rounded-lg p-4 max-h-[70vh] overflow-y-auto' : 'text-center'}`}>
              <div className="space-y-4">
                <h1 
                  className="text-2xl sm:text-4xl font-bold"
                  style={{ fontFamily: userPreferences.fontFamily }}
                >
                  {article.title}
                </h1>
                <div className="max-w-2xl">
                  <p 
                    className="text-sm sm:text-lg leading-relaxed"
                    style={{ fontFamily: userPreferences.fontFamily }}
                  >
                    {currentIndex === index && displayedText ? displayedText : article.content}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-300 flex-shrink-0 mt-4">
              <span>{article.readTime} min read</span>
              <span>•</span>
              <span>{article.views.toLocaleString()} views</span>
            </div>
          </motion.div>
          {currentIndex === index && (
            <div className="absolute bottom-0 left-0 right-0 z-20">
              <Progress 
                value={progress} 
                className="h-1 bg-black/20"
                indicatorClassName="transition-colors duration-300"
                style={{ 
                  '--progress-bar-color': userPreferences.highlightColor 
                } as React.CSSProperties}
              />
            </div>
          )}
          {isMobile && (
            <div className="absolute bottom-24 right-4 z-20">
              <div className="text-white/60 text-xs bg-black/40 px-2 py-1 rounded">
                Scroll to navigate
              </div>
            </div>
          )}
        </div>
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
