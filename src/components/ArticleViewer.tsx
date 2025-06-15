import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Progress } from "./ui/progress";
import { getRandomArticles, getRelatedArticles } from "../services/wikipediaService";

const ArticleViewer = ({ articles: initialArticles, onArticleChange }) => {
  const [articles, setArticles] = useState(initialArticles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    fontFamily: 'Inter',
    backgroundOpacity: 70,
    highlightColor: '#FE2C55'
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const currentArticle = articles[currentIndex];

  // Load user preferences and update CSS variables
  useEffect(() => {
    const savedPrefs = localStorage.getItem('userPreferences');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      // Migrate old progressBarColor to highlightColor
      if (prefs.progressBarColor && !prefs.highlightColor) {
        prefs.highlightColor = prefs.progressBarColor;
        delete prefs.progressBarColor;
      }
      setUserPreferences(prefs);
      
      // Update CSS variables
      document.documentElement.style.setProperty('--progress-bar-color', prefs.highlightColor);
      document.documentElement.style.setProperty('--highlight-color', prefs.highlightColor);
    }
  }, []);

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
    document.documentElement.style.setProperty('--progress-bar-color', userPreferences.highlightColor);
    document.documentElement.style.setProperty('--highlight-color', userPreferences.highlightColor);
  }, [userPreferences]);

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
      setIsLoading(true);
      const newArticles = currentArticle 
        ? await getRelatedArticles(currentArticle)
        : await getRandomArticles(3);
      setArticles(prev => [...prev, ...newArticles]);
    } catch (error) {
      console.error("Failed to load more articles", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentArticle]);

  useEffect(() => {
    setIsVisible(true);
    setDisplayedText("");
    setProgress(0);
    onArticleChange(currentArticle);

    if (currentIndex >= articles.length - 2) {
      loadMoreArticles();
    }
  }, [currentIndex, currentArticle, onArticleChange, articles.length, loadMoreArticles]);

  useEffect(() => {
    if (!isVisible || !currentArticle?.content) return;

    const text = currentArticle.content;
    const words = text.split(' ');
    let currentWordIndex = 0;

    const interval = setInterval(() => {
      if (currentWordIndex < words.length) {
        const wordsToShow = words.slice(0, currentWordIndex + 1);
        setDisplayedText(wordsToShow.join(' '));
        setProgress(((currentWordIndex + 1) / words.length) * 100);
        currentWordIndex++;
      } else {
        clearInterval(interval);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [isVisible, currentArticle?.content]);

  // Mobile-only touch handling with improved scrolling
  useEffect(() => {
    if (!isMobile) return;
    
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let startTime = 0;
    let isContentScrollable = false;
    let initialScrollTop = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      startTime = Date.now();
      
      const contentElement = contentRef.current;
      if (contentElement) {
        isContentScrollable = contentElement.scrollHeight > contentElement.clientHeight;
        initialScrollTop = contentElement.scrollTop;
      }
      setIsScrolling(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const contentElement = contentRef.current;
      if (contentElement && isContentScrollable) {
        const currentY = e.touches[0].clientY;
        const deltaY = startY - currentY;
        
        // Allow content scrolling
        const newScrollTop = initialScrollTop + deltaY;
        const maxScroll = contentElement.scrollHeight - contentElement.clientHeight;
        
        if (newScrollTop >= 0 && newScrollTop <= maxScroll) {
          setIsScrolling(true);
          contentElement.scrollTop = newScrollTop;
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();
      const deltaY = startY - endY;
      const deltaTime = endTime - startTime;
      const velocity = Math.abs(deltaY) / deltaTime;

      // Only navigate if it's a fast swipe and not content scrolling
      if (!isScrolling && velocity > 0.8 && Math.abs(deltaY) > 80) {
        if (deltaY > 0 && currentIndex < articles.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else if (deltaY < 0 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      }

      setTimeout(() => setIsScrolling(false), 100);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, articles.length, isScrolling, isMobile]);

  // Desktop-only scroll handling
  useEffect(() => {
    if (isMobile) return;
    
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute("data-index") || "0");
            setCurrentIndex(index);
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.7,
        root: null,
      }
    );

    const articleElements = container.querySelectorAll(".article-section");
    articleElements.forEach((article) => observer.observe(article));

    return () => {
      articleElements.forEach((article) => observer.unobserve(article));
    };
  }, [articles, isMobile]);

  return (
    <main 
      ref={containerRef} 
      className={`h-screen w-screen ${isMobile ? 'overflow-hidden' : 'overflow-y-scroll'} snap-y snap-mandatory`}
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
              opacity: isVisible && currentIndex === index ? 1 : 0,
              y: isVisible && currentIndex === index ? 0 : 20,
            }}
            transition={{ duration: 0.5 }}
            className={`relative z-10 text-white p-4 sm:p-8 max-w-3xl mx-auto h-full flex flex-col ${isMobile ? 'justify-center' : 'justify-center items-center'}`}
          >
            <div className={`${isMobile ? 'bg-black/40 backdrop-blur-sm rounded-lg p-4 max-h-[70vh]' : 'text-center'}`}>
              <div className="space-y-4">
                <h1 
                  className="text-2xl sm:text-4xl font-bold"
                  style={{ fontFamily: userPreferences.fontFamily }}
                >
                  {article.title}
                </h1>
                {isMobile ? (
                  <div 
                    ref={contentRef}
                    className="text-sm sm:text-lg leading-relaxed overflow-y-auto max-h-[50vh] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
                    style={{ fontFamily: userPreferences.fontFamily }}
                  >
                    {currentIndex === index ? displayedText : article.content}
                  </div>
                ) : (
                  <div className="max-w-2xl">
                    <p 
                      className="text-sm sm:text-lg leading-relaxed"
                      style={{ fontFamily: userPreferences.fontFamily }}
                    >
                      {currentIndex === index ? displayedText : article.content}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className={`flex items-center space-x-2 text-xs sm:text-sm text-gray-300 flex-shrink-0 ${isMobile ? 'mt-4' : 'mt-6'}`}>
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
                Swipe up/down
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
