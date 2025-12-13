import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, X, BookOpen } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface SmartLinksProps {
  articleContent: string;
  articleTitle: string;
  onClose: () => void;
  onNavigateToArticle: (title: string) => void;
}

// Extract potential Wikipedia-worthy words from text
function extractPotentialWikiWords(text: string, title: string): string[] {
  // Split into words and filter
  const words = text.split(/\s+/);
  const seen = new Set<string>();
  const results: string[] = [];
  
  // Add the current title's words to exclusion
  const titleWords = new Set(title.toLowerCase().split(/\s+/));
  
  for (const word of words) {
    // Clean the word
    const cleaned = word.replace(/[^a-zA-ZÀ-ÿ\s-]/g, '').trim();
    const lower = cleaned.toLowerCase();
    
    // Skip if too short, already seen, or part of title
    if (cleaned.length < 4 || seen.has(lower) || titleWords.has(lower)) {
      continue;
    }
    
    seen.add(lower);
    
    // Check if it looks like a proper noun (capitalized) or is long enough to be interesting
    const isProperNoun = cleaned[0] === cleaned[0].toUpperCase() && 
                         cleaned[0] !== cleaned[0].toLowerCase();
    
    if (isProperNoun || cleaned.length >= 6) {
      results.push(cleaned);
    }
  }
  
  // Limit to top 30 most interesting words
  return results.slice(0, 30);
}

const SmartLinks = ({ articleContent, articleTitle, onClose, onNavigateToArticle }: SmartLinksProps) => {
  const [loadingLink, setLoadingLink] = useState<string | null>(null);
  
  const potentialLinks = useMemo(() => {
    return extractPotentialWikiWords(articleContent, articleTitle);
  }, [articleContent, articleTitle]);

  const handleLinkClick = async (word: string) => {
    setLoadingLink(word);
    // Navigate to the word's article in TicDia
    onNavigateToArticle(word);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="absolute inset-0 z-30 bg-background/95 backdrop-blur-xl flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Smart Links</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <p className="px-4 py-2 text-sm text-muted-foreground">
        Tap any word to explore its Wikipedia article
      </p>
      
      <ScrollArea className="flex-1 px-4">
        <div className="flex flex-wrap gap-2 py-4">
          {potentialLinks.length === 0 ? (
            <p className="text-muted-foreground text-center w-full py-8">
              No interesting links found in this article
            </p>
          ) : (
            potentialLinks.map((word, index) => (
              <motion.button
                key={`${word}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => handleLinkClick(word)}
                disabled={loadingLink === word}
                className="group relative px-3 py-2 bg-muted/50 hover:bg-primary/20 border border-border hover:border-primary/50 rounded-lg text-sm font-medium text-foreground transition-all duration-200 flex items-center gap-1.5"
              >
                {word}
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                {loadingLink === word && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </motion.button>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Swipe left or tap X to close
        </p>
      </div>
    </motion.div>
  );
};

export default SmartLinks;
