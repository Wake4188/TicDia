import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, ArrowRight, Shuffle, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";

interface SmartLinksProps {
  articleContent: string;
  articleTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToArticle: (title: string) => void;
}

interface ExtractedWord {
  word: string;
  type: 'proper-noun' | 'concept' | 'term';
  relevance: number;
}

// Enhanced extraction with better categorization
function extractPotentialWikiWords(text: string, title: string): ExtractedWord[] {
  const words = text.split(/\s+/);
  const seen = new Set<string>();
  const results: ExtractedWord[] = [];

  const titleWords = new Set(title.toLowerCase().split(/\s+/));
  const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'were', 'they', 'their', 'what', 'when', 'where', 'which', 'while', 'with', 'this', 'that', 'from', 'also', 'more', 'some', 'such', 'than', 'them', 'then', 'there', 'these', 'those', 'into', 'over', 'after', 'before', 'being', 'between', 'about', 'through']);

  for (const word of words) {
    const cleaned = word.replace(/[^a-zA-ZÀ-ÿ\s-]/g, '').trim();
    const lower = cleaned.toLowerCase();

    if (cleaned.length < 4 || seen.has(lower) || titleWords.has(lower) || stopWords.has(lower)) {
      continue;
    }

    seen.add(lower);

    const isProperNoun = cleaned[0] === cleaned[0].toUpperCase() &&
                         cleaned[0] !== cleaned[0].toLowerCase();

    if (isProperNoun) {
      results.push({ word: cleaned, type: 'proper-noun', relevance: 0.9 });
    } else if (cleaned.length >= 8) {
      results.push({ word: cleaned, type: 'concept', relevance: 0.7 });
    } else if (cleaned.length >= 5) {
      results.push({ word: cleaned, type: 'term', relevance: 0.5 });
    }
  }

  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 24);
}

const typeConfig = {
  'proper-noun': {
    label: 'People & Places',
    icon: TrendingUp,
    gradient: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/30 hover:border-amber-400/60',
    text: 'text-amber-400'
  },
  'concept': {
    label: 'Concepts',
    icon: Sparkles,
    gradient: 'from-purple-500/20 to-pink-500/20',
    border: 'border-purple-500/30 hover:border-purple-400/60',
    text: 'text-purple-400'
  },
  'term': {
    label: 'Terms',
    icon: BookOpen,
    gradient: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/30 hover:border-blue-400/60',
    text: 'text-blue-400'
  }
};

const SmartLinks = ({ articleContent, articleTitle, open, onOpenChange, onNavigateToArticle }: SmartLinksProps) => {
  const [loadingLink, setLoadingLink] = useState<string | null>(null);

  const potentialLinks = useMemo(
    () => extractPotentialWikiWords(articleContent, articleTitle),
    [articleContent, articleTitle]
  );

  const [displayedLinks, setDisplayedLinks] = useState(potentialLinks);

  // Reset displayed links when article changes
  React.useEffect(() => {
    setDisplayedLinks(potentialLinks);
  }, [potentialLinks]);

  const handleLinkClick = useCallback((word: string) => {
    setLoadingLink(word);
    onNavigateToArticle(word);
  }, [onNavigateToArticle]);

  const handleShuffle = useCallback(() => {
    setDisplayedLinks([...potentialLinks].sort(() => Math.random() - 0.5));
  }, [potentialLinks]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-background/95 backdrop-blur-xl border-l border-border/50"
      >
        {/* Decorative gradient backdrop */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        </div>

        <SheetHeader className="p-5 pb-3 border-b border-border/40 space-y-0 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-base font-bold text-foreground">Explore More</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  {displayedLinks.length} topics to discover
                </SheetDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShuffle}
              className="text-muted-foreground hover:text-foreground gap-1.5 flex-shrink-0"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="text-xs">Shuffle</span>
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {displayedLinks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No related topics found</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Try another article</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {displayedLinks.map((item, index) => {
                    const config = typeConfig[item.type];
                    const isLoading = loadingLink === item.word;

                    return (
                      <motion.button
                        key={item.word}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: index * 0.015, duration: 0.18, ease: "easeOut" }}
                        onClick={() => handleLinkClick(item.word)}
                        disabled={isLoading}
                        className={`relative group p-3 rounded-xl border transition-all duration-200 bg-gradient-to-br ${config.gradient} ${config.border} hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-left`}
                      >
                        <div className="relative z-10 flex flex-col items-start gap-1.5">
                          <div className="flex items-center gap-1.5 w-full">
                            <config.icon className={`w-3 h-3 ${config.text} opacity-70`} />
                            <span className={`text-[9px] uppercase tracking-wider ${config.text} opacity-70 font-semibold`}>
                              {item.type.replace('-', ' ')}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                            {item.word}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Open</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </div>
                        </div>

                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl backdrop-blur-sm">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground text-center">
            Tap any topic to start a new discovery
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SmartLinks;
