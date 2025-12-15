import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, BookOpen, ArrowRight, Shuffle, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface SmartLinksProps {
  articleContent: string;
  articleTitle: string;
  onClose: () => void;
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
    border: 'border-amber-500/30 hover:border-amber-400',
    text: 'text-amber-300'
  },
  'concept': { 
    label: 'Concepts', 
    icon: Sparkles,
    gradient: 'from-purple-500/20 to-pink-500/20',
    border: 'border-purple-500/30 hover:border-purple-400',
    text: 'text-purple-300'
  },
  'term': { 
    label: 'Terms', 
    icon: BookOpen,
    gradient: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/30 hover:border-blue-400',
    text: 'text-blue-300'
  }
};

const SmartLinks = ({ articleContent, articleTitle, onClose, onNavigateToArticle }: SmartLinksProps) => {
  const [loadingLink, setLoadingLink] = useState<string | null>(null);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  
  const potentialLinks = useMemo(() => {
    return extractPotentialWikiWords(articleContent, articleTitle);
  }, [articleContent, articleTitle]);

  const handleLinkClick = useCallback((word: string) => {
    setLoadingLink(word);
    onNavigateToArticle(word);
  }, [onNavigateToArticle]);

  const shuffledLinks = useMemo(() => {
    return [...potentialLinks].sort(() => Math.random() - 0.5);
  }, [potentialLinks]);

  const [displayedLinks, setDisplayedLinks] = useState(potentialLinks);
  
  const handleShuffle = useCallback(() => {
    setDisplayedLinks([...potentialLinks].sort(() => Math.random() - 0.5));
  }, [potentialLinks]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex flex-col overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: '110%',
              opacity: 0 
            }}
            animate={{ 
              y: '-10%',
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative flex items-center justify-between p-4 border-b border-border/50 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Explore More</h2>
            <p className="text-xs text-muted-foreground">{displayedLinks.length} topics to discover</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShuffle}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">Shuffle</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-destructive/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>
      
      {/* Content */}
      <ScrollArea className="flex-1 relative">
        <div className="p-4 pb-8">
          {displayedLinks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No related topics found</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Try another article</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {displayedLinks.map((item, index) => {
                  const config = typeConfig[item.type];
                  const isHovered = hoveredWord === item.word;
                  const isLoading = loadingLink === item.word;
                  
                  return (
                    <motion.button
                      key={item.word}
                      layout
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ 
                        delay: index * 0.03,
                        type: "spring",
                        stiffness: 400,
                        damping: 25
                      }}
                      onClick={() => handleLinkClick(item.word)}
                      onMouseEnter={() => setHoveredWord(item.word)}
                      onMouseLeave={() => setHoveredWord(null)}
                      disabled={isLoading}
                      className={`
                        relative group p-4 rounded-xl border transition-all duration-300
                        bg-gradient-to-br ${config.gradient} ${config.border}
                        hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5
                        active:scale-[0.98] disabled:opacity-50
                      `}
                    >
                      {/* Glow effect on hover */}
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ filter: 'blur(20px)' }}
                      />
                      
                      <div className="relative z-10 flex flex-col items-start gap-2">
                        <div className="flex items-center gap-2 w-full">
                          <config.icon className={`w-3.5 h-3.5 ${config.text} opacity-70`} />
                          <span className={`text-[10px] uppercase tracking-wider ${config.text} opacity-70`}>
                            {item.type.replace('-', ' ')}
                          </span>
                        </div>
                        
                        <span className="text-sm font-medium text-foreground text-left line-clamp-2 leading-tight">
                          {item.word}
                        </span>
                        
                        <motion.div
                          className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                          initial={false}
                          animate={{ x: isHovered ? 4 : 0 }}
                        >
                          <span>Explore</span>
                          <ArrowRight className="w-3 h-3" />
                        </motion.div>
                      </div>
                      
                      {/* Loading state */}
                      {isLoading && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl backdrop-blur-sm"
                        >
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Footer */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative p-4 border-t border-border/50 backdrop-blur-sm"
      >
        <p className="text-xs text-muted-foreground text-center">
          Tap any topic to start a new discovery journey
        </p>
      </motion.div>
    </motion.div>
  );
};

export default SmartLinks;