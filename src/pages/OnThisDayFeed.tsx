import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fetchOnThisDay, type OnThisDayEvent } from "@/services/onThisDayService";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import Navigation from "@/components/Navigation";

type TaggedEvent = OnThisDayEvent & { eventType: 'event' | 'birth' | 'death' };

const OnThisDayFeed = () => {
  const navigate = useNavigate();
  const { userPreferences } = useUserPreferences();
  const [events, setEvents] = useState<TaggedEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeightRef = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef(0);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

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

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchOnThisDay();
    if (data) {
      const allEvents: TaggedEvent[] = [
        ...data.events.map(e => ({ ...e, eventType: 'event' as const })),
        ...data.births.map(e => ({ ...e, eventType: 'birth' as const })),
        ...data.deaths.map(e => ({ ...e, eventType: 'death' as const })),
      ].sort((a, b) => (b.year || 0) - (a.year || 0));
      setEvents(allEvents);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const itemHeight = itemHeightRef.current || window.innerHeight;

    if (scrollTimeoutRef.current !== null) {
      cancelAnimationFrame(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = requestAnimationFrame(() => {
      const newIndex = Math.round(scrollTop / itemHeight);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < events.length) {
        setCurrentIndex(newIndex);
      }
      lastScrollTopRef.current = scrollTop;
    });
  }, [currentIndex, events.length]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current !== null) cancelAnimationFrame(scrollTimeoutRef.current);
    };
  }, []);

  const getEventLabel = (event: TaggedEvent) => {
    const yearsAgo = today.getFullYear() - event.year;
    const suffix = yearsAgo === 1 ? 'year' : 'years';
    switch (event.eventType) {
      case 'birth':
        return `Born on this day, ${yearsAgo} ${suffix} ago`;
      case 'death':
        return `Died on this day, ${yearsAgo} ${suffix} ago`;
      default:
        return `${yearsAgo} ${suffix} ago today`;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'birth': return '🎂';
      case 'death': return '✝';
      default: return '📜';
    }
  };

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
          onClick={loadEvents}
          className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
          disabled={isLoading}
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading && events.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading historical events...</p>
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
          {events.map((event, index) => {
            const page = event.pages?.[0];
            const url = page?.content_urls?.desktop?.page
              || (page?.title ? `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}` : null);

            return (
              <div
                key={`${event.year}-${index}`}
                className="h-[100dvh] w-full snap-start snap-always relative flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, 
                    hsl(${(index * 23 + 200) % 360}, 55%, 12%), 
                    hsl(${(index * 23 + 260) % 360}, 45%, 8%))`,
                }}
              >
                {/* Background thumbnail */}
                {page?.thumbnail && (
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={page.thumbnail.source}
                      alt=""
                      className="w-full h-full object-cover opacity-15 blur-sm scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
                  </div>
                )}

                <div className="relative z-10 text-foreground p-8 max-w-2xl mx-auto text-center">
                  <div className="space-y-5">
                    {index === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 text-sm font-medium inline-block"
                      >
                        On This Day · {dateStr}
                      </motion.div>
                    )}

                    {/* Date context badge */}
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl">{getEventIcon(event.eventType)}</span>
                      <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/80 text-sm font-medium">
                        {getEventLabel(event)}
                      </span>
                    </div>

                    <h2 className="text-6xl sm:text-8xl font-bold text-white/30">{event.year}</h2>

                    <p
                      className="text-xl sm:text-2xl text-white/90 leading-relaxed"
                      style={{
                        fontFamily: userPreferences.fontFamily,
                        fontSize: `${userPreferences.fontSize + 2}px`,
                      }}
                    >
                      {event.text}
                    </p>

                    {/* Why it matters */}
                    {page?.extract && (
                      <div className="mt-4 px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-left">
                        <p className="text-xs uppercase tracking-widest text-white/50 mb-2 font-semibold">Why it matters</p>
                        <p className="text-sm sm:text-base text-white/75 leading-relaxed line-clamp-4">
                          {page.extract}
                        </p>
                      </div>
                    )}

                    {page?.description && !page?.extract && (
                      <p className="text-base text-white/50 italic">{page.description}</p>
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

                {index === currentIndex && index < events.length - 1 && (
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

export default OnThisDayFeed;
