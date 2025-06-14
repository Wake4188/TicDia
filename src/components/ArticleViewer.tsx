import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Progress } from "./ui/progress";
import { getRandomArticles, getRelatedArticles } from "../services/wikipediaService";
import { ScrollArea } from "./ui/scroll-area";

const ArticleViewer = ({ articles: initialArticles, onArticleChange }) => {
  const [articles, setArticles] = useState(initialArticles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const currentArticle = articles[currentIndex];

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
      // Get related articles based on the current article
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

    let currentChar = 0;
    const text = currentArticle.content;
    const totalChars = text.length;

    const interval = setInterval(() => {
      if (currentChar <= totalChars) {
        setDisplayedText(text.slice(0, currentChar));
        setProgress((currentChar / totalChars) * 100);
        currentChar++;
      } else {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [isVisible, currentArticle?.content]);

  // Mobile-only touch handling
  useEffect(() => {
    if (!isMobile) return;
    
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let startTime = 0;
    let isContentScrollable = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      startTime = Date.now();
      
      // Check if content is scrollable
      const contentElement = contentRef.current;
      if (contentElement) {
        isContentScrollable = contentElement.scrollHeight > contentElement.clientHeight;
      }
      setIsScrolling(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isContentScrollable) {
        setIsScrolling(true);
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
          // Swipe up - next article
          setCurrentIndex(currentIndex + 1);
        } else if (deltaY < 0 && currentIndex > 0) {
          // Swipe down - previous article
          setCurrentIndex(currentIndex - 1);
        }
      }

      setTimeout(() => setIsScrolling(false), 100);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

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
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70" />
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
            <div className={`${isMobile ? 'bg-black/40 backdrop-blur-sm rounded-lg p-4 max-h-[70vh] overflow-y-auto' : 'text-center'}`}>
              <div className="space-y-4">
                <h1 className="text-2xl sm:text-4xl font-bold">{article.title}</h1>
                {isMobile ? (
                  <div className="text-sm sm:text-lg leading-relaxed">
                    {currentIndex === index ? displayedText : article.content}
                  </div>
                ) : (
                  <div className="max-w-2xl">
                    <p className="text-sm sm:text-lg leading-relaxed">
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
                indicatorClassName="bg-red-500"
              />
            </div>
          )}
          {/* Mobile navigation hint */}
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
