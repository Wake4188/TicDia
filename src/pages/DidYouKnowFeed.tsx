import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, ChevronDown, ExternalLink, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fetchRandomFacts, type RandomFact } from "@/services/onThisDayService";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import Navigation from "@/components/Navigation";

const DidYouKnowFeed = () => {
  const navigate = useNavigate();
  const { userPreferences } = useUserPreferences();
  const [facts, setFacts] = useState<RandomFact[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeightRef = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const updateItemHeight = () => {
      itemHeightRef.current = window.innerHeight;
    };
    updateItemHeight();
    window.addEventListener('resize', updateItemHeight);
    window.addEventListener('orientationchange', updateItemHeight);
    return () => {
      window.removeEventListener('resize', updateItemHeight);
      window.removeEventListener('orientationchange', updateItemHeight);
    };
  }, []);

  const loadFacts = useCallback(async (refresh = false) => {
    setIsLoading(true);
    if (refresh) {
      // Clear cache by fetching with a unique count
      const newFacts = await fetchRandomFacts(15);
      setFacts(newFacts);
    } else {
      const newFacts = await fetchRandomFacts(15);
      setFacts(newFacts);
    }
    setCurrentIndex(0);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadFacts();
  }, [loadFacts]);

  const loadMoreFacts = useCallback(async () => {
    const moreFacts = await fetchRandomFacts(10);
    setFacts(prev => [...prev, ...moreFacts]);
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const itemHeight = itemHeightRef.current || window.innerHeight;

    if (scrollTimeoutRef.current !== null) {
      cancelAnimationFrame(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = requestAnimationFrame(() => {
      const newIndex = Math.round(scrollTop / itemHeight);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < facts.length) {
        setCurrentIndex(newIndex);
      }
      // Load more when nearing end
      if (newIndex >= facts.length - 3) {
        loadMoreFacts();
      }
    });
  }, [currentIndex, facts.length, loadMoreFacts]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current !== null) cancelAnimationFrame(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <div className="h-screen h-[100dvh] w-screen relative overflow-hidden bg-background">
      <Navigation />

      <div className="fixed top-20 left-4 z-50 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => loadFacts(true)}
          className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
          disabled={isLoading}
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading && facts.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Lightbulb className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Discovering interesting facts...</p>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="h-full w-full overflow-y-scroll snap-y snap-mandatory"
          onScroll={handleScroll}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'none',
          }}
        >
          {facts.map((fact, index) => {
            const url = fact.content_urls?.desktop?.page;

            return (
              <div
                key={`${fact.title}-${index}`}
                className="h-[100dvh] w-full snap-start snap-always relative flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, 
                    hsl(${(index * 41 + 30) % 360}, 60%, 13%), 
                    hsl(${(index * 41 + 90) % 360}, 50%, 8%))`,
                }}
              >
                {/* Background thumbnail */}
                {fact.thumbnail && (
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={fact.thumbnail.source}
                      alt=""
                      className="w-full h-full object-cover opacity-15 blur-sm scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
                  </div>
                )}

                <div className="relative z-10 text-foreground p-8 max-w-2xl mx-auto text-center">
                  <div className="space-y-6">
                    {index === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 text-sm font-medium inline-flex items-center gap-2"
                      >
                        <Lightbulb className="w-4 h-4" />
                        Did You Know?
                      </motion.div>
                    )}

                    <h1
                      className="text-4xl sm:text-6xl font-bold text-white"
                      style={{ fontFamily: userPreferences.fontFamily }}
                    >
                      {fact.title}
                    </h1>

                    {fact.description && (
                      <p className="text-lg text-white/60 italic">{fact.description}</p>
                    )}

                    <p
                      className="text-lg sm:text-xl text-white/90 leading-relaxed"
                      style={{
                        fontFamily: userPreferences.fontFamily,
                        fontSize: `${userPreferences.fontSize}px`,
                      }}
                    >
                      {fact.extract}
                    </p>

                    {/* Why it's interesting */}
                    {fact.description && fact.extract && (
                      <div className="mt-2 px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-left">
                        <p className="text-xs uppercase tracking-widest text-white/50 mb-2 font-semibold">Why it's interesting</p>
                        <p className="text-sm text-white/70 leading-relaxed">
                          This {fact.description.toLowerCase()} is notable for its significance in its field. Tap "Read more" to explore the full story.
                        </p>
                      </div>
                    )}

                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all text-sm"
                      >
                        Read more <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {index === currentIndex && index < facts.length - 1 && (
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/40">
                    <ChevronDown className="w-8 h-8 animate-bounce" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DidYouKnowFeed;
