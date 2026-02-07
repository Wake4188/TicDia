import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, Lightbulb, Star, Cake, Skull, PartyPopper, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  fetchOnThisDay, 
  fetchRandomFacts,
  type OnThisDayResponse,
  type OnThisDayEvent,
  type RandomFact 
} from "@/services/onThisDayService";

type Tab = 'events' | 'births' | 'deaths' | 'holidays' | 'didyouknow';

const tabConfig = [
  { id: 'events' as Tab, label: 'Events', icon: Calendar },
  { id: 'births' as Tab, label: 'Births', icon: Cake },
  { id: 'deaths' as Tab, label: 'Deaths', icon: Skull },
  { id: 'holidays' as Tab, label: 'Holidays', icon: PartyPopper },
  { id: 'didyouknow' as Tab, label: 'Did You Know?', icon: Lightbulb },
];

const EventCard = ({ event, index }: { event: OnThisDayEvent; index: number }) => {
  const page = event.pages?.[0];
  const url = page?.content_urls?.desktop?.page;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
      <div className="flex gap-4">
        {page?.thumbnail && (
          <img 
            src={page.thumbnail.source} 
            alt={page.title} 
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
            loading="lazy"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-primary">{event.year}</span>
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <p className="text-foreground leading-relaxed">{event.text}</p>
          {page?.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{page.description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const FactCard = ({ fact, index }: { fact: RandomFact; index: number }) => {
  const url = fact.content_urls?.desktop?.page;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
      {fact.thumbnail && (
        <img 
          src={fact.thumbnail.source} 
          alt={fact.title}
          className="w-full h-40 object-cover"
          loading="lazy"
        />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-lg text-foreground leading-tight">{fact.title}</h3>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0 mt-1">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
        {fact.description && (
          <p className="text-sm text-primary font-medium mb-2">{fact.description}</p>
        )}
        <p className="text-muted-foreground leading-relaxed line-clamp-4">{fact.extract}</p>
      </div>
    </motion.div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="bg-card/50 rounded-2xl p-5">
        <div className="flex gap-4">
          <Skeleton className="w-16 h-16 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Explore = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [onThisDay, setOnThisDay] = useState<OnThisDayResponse | null>(null);
  const [randomFacts, setRandomFacts] = useState<RandomFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [factsLoading, setFactsLoading] = useState(false);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  useEffect(() => {
    loadOnThisDay();
  }, []);

  const loadOnThisDay = async () => {
    setLoading(true);
    const data = await fetchOnThisDay();
    setOnThisDay(data);
    setLoading(false);
  };

  const loadRandomFacts = async () => {
    if (randomFacts.length > 0 && !factsLoading) return;
    setFactsLoading(true);
    const facts = await fetchRandomFacts(8);
    setRandomFacts(facts);
    setFactsLoading(false);
  };

  const refreshFacts = async () => {
    setFactsLoading(true);
    setRandomFacts([]);
    const facts = await fetchRandomFacts(8);
    setRandomFacts(facts);
    setFactsLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'didyouknow') {
      loadRandomFacts();
    }
  }, [activeTab]);

  const getTabContent = () => {
    if (activeTab === 'didyouknow') {
      return randomFacts;
    }
    if (!onThisDay) return [];
    switch (activeTab) {
      case 'events': return onThisDay.events;
      case 'births': return onThisDay.births;
      case 'deaths': return onThisDay.deaths;
      case 'holidays': return onThisDay.holidays;
      default: return [];
    }
  };

  const content = getTabContent();

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-lg font-semibold">Explore</h1>
              <p className="text-xs text-muted-foreground">{dateStr}</p>
            </div>
            <div className="w-10" />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
            {tabConfig.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-3xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {loading && activeTab !== 'didyouknow' ? (
            <LoadingSkeleton />
          ) : factsLoading && activeTab === 'didyouknow' ? (
            <LoadingSkeleton />
          ) : content.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No content available</p>
            </motion.div>
          ) : activeTab === 'didyouknow' ? (
            <motion.div key="facts" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm" onClick={refreshFacts} disabled={factsLoading} className="gap-2">
                  <RefreshCw className={`w-4 h-4 ${factsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {randomFacts.map((fact, i) => (
                  <FactCard key={`${fact.title}-${i}`} fact={fact} index={i} />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {(content as OnThisDayEvent[]).map((event, i) => (
                <EventCard key={`${event.year}-${i}`} event={event} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Explore;
