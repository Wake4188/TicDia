import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, ChevronDown, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { lookupWord, getDefinitions } from "@/services/wiktionaryService";
import { getWordOfTheDay, generateWordOfTheDay } from "@/services/wordOfTheDayService";
import Navigation from "@/components/Navigation";
import SanitizedHtml from "@/components/SanitizedHtml";

interface WordEntry {
  word: string;
  partOfSpeech: string;
  definition: string;
  example?: string;
  pronunciation?: string;
}

// Collection of interesting, unusual, and cool English words
const INTERESTING_WORDS = [
  "ephemeral", "serendipity", "mellifluous", "petrichor", "luminescent",
  "ethereal", "effervescent", "iridescent", "phosphorescent", "quintessential",
  "labyrinthine", "surreptitious", "clandestine", "ineffable", "ubiquitous",
  "enigmatic", "idyllic", "pristine", "resplendent", "incandescent",
  "eloquent", "perennial", "transcendent", "epiphany", "euphoria",
  "sonorous", "nebulous", "seraphic", "halcyon", "gossamer",
  "susurrus", "defenestration", "callipygian", "pulchritudinous", "logorrhea",
  "perspicacious", "magnanimous", "ephemeron", "vellichor", "sonder",
  "kenopsia", "liberosis", "chrysalism", "mauerbauertraurigkeit", "jouska",
  "exulansis", "nodus tollens", "lachesism", "kuebiko", "onism",
  "ambivalent", "cacophony", "dichotomy", "ebullience", "fastidious",
  "gregarious", "harbinger", "iconoclast", "juxtaposition", "kaleidoscope",
  "laconic", "meticulous", "nefarious", "obsequious", "panacea",
  "quixotic", "recalcitrant", "sanguine", "trepidation", "umbrage",
  "venerable", "wistful", "xenial", "yearn", "zealous",
  "amalgamation", "benevolent", "capricious", "delineate", "elucidate",
  "facetious", "garrulous", "hegemony", "indefatigable", "jocular",
  "kinetic", "loquacious", "maelstrom", "nascent", "omniscient",
  "paradigm", "querulous", "reticent", "sagacious", "taciturn",
  "unequivocal", "vicarious", "whimsical", "xeric", "yonder",
  "acquiesce", "bellicose", "calamity", "desultory", "exacerbate",
  "felicitous", "gesticulate", "harangue", "immutable", "juxtapose"
];

const WordFeed = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userPreferences } = useUserPreferences();
  const [words, setWords] = useState<WordEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const fetchWordDefinition = useCallback(async (word: string): Promise<WordEntry | null> => {
    try {
      const response = await lookupWord(word, 'en');
      const definitions = getDefinitions(response, 'en');
      
      if (definitions.length > 0) {
        const firstDef = definitions[0];
        return {
          word,
          partOfSpeech: firstDef.partOfSpeech,
          // Keep the HTML - we'll render it properly with SanitizedHtml component
          definition: firstDef.definitions[0]?.definition || '',
          example: firstDef.definitions[0]?.examples?.[0],
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch word definition:', error);
      return null;
    }
  }, []);

  const loadInitialWords = useCallback(async () => {
    setIsLoading(true);
    const today = new Date();
    
    // Get word of the day (either from database or generate deterministically)
    let wordOfTheDay: string | null = await getWordOfTheDay(today);
    
    // If no word of the day exists, generate one deterministically
    if (!wordOfTheDay) {
      wordOfTheDay = generateWordOfTheDay(today, INTERESTING_WORDS);
    }
    
    const newUsedWords = new Set<string>();
    if (wordOfTheDay) {
      newUsedWords.add(wordOfTheDay);
    }
    
    // Select 9 additional words (for 10 total)
    const availableWords = INTERESTING_WORDS.filter(w => !newUsedWords.has(w));
    const shuffled = [...availableWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, 9);
    
    // Fetch all definitions in parallel for speed
    const allWords = wordOfTheDay ? [wordOfTheDay, ...selectedWords] : selectedWords;
    const results = await Promise.allSettled(
      allWords.map(word => fetchWordDefinition(word))
    );
    
    const wordEntries: WordEntry[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        wordEntries.push(result.value);
        newUsedWords.add(allWords[index]);
      }
    });
    
    setWords(wordEntries);
    setUsedWords(newUsedWords);
    setCurrentIndex(0);
    setIsLoading(false);
  }, [fetchWordDefinition]);

  useEffect(() => {
    loadInitialWords();
  }, [loadInitialWords]);

  const loadMoreWords = useCallback(async () => {
    const availableWords = INTERESTING_WORDS.filter(w => !usedWords.has(w));
    if (availableWords.length === 0) {
      // Reset if all words have been used
      setUsedWords(new Set());
      return;
    }
    
    const shuffled = availableWords.sort(() => Math.random() - 0.5);
    const newWords = shuffled.slice(0, 5);
    
    // Fetch all new word definitions in parallel
    const results = await Promise.allSettled(
      newWords.map(word => fetchWordDefinition(word))
    );
    
    const newEntries: WordEntry[] = [];
    const newUsedSet = new Set(usedWords);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        newEntries.push(result.value);
        newUsedSet.add(newWords[index]);
      }
    });
    
    if (newEntries.length > 0) {
      setWords(prev => [...prev, ...newEntries]);
      setUsedWords(newUsedSet);
    }
  }, [usedWords, fetchWordDefinition]);

  // Use requestAnimationFrame for smooth scroll handling
  const scrollTimeoutRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef(0);
  const isScrollingRef = useRef(false);
  const itemHeightRef = useRef(0);

  // Update item height on resize (important for mobile viewport changes)
  useEffect(() => {
    const updateItemHeight = () => {
      if (containerRef.current) {
        // Use actual viewport height, accounting for mobile browser UI
        itemHeightRef.current = window.innerHeight || containerRef.current.clientHeight;
      }
    };
    
    updateItemHeight();
    window.addEventListener('resize', updateItemHeight);
    window.addEventListener('orientationchange', updateItemHeight);
    
    return () => {
      window.removeEventListener('resize', updateItemHeight);
      window.removeEventListener('orientationchange', updateItemHeight);
    };
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const itemHeight = itemHeightRef.current || window.innerHeight || container.clientHeight;
    
    // Throttle scroll handling with requestAnimationFrame for smooth performance
    if (scrollTimeoutRef.current !== null) {
      cancelAnimationFrame(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = requestAnimationFrame(() => {
      // Use more accurate calculation with threshold for better snap detection
      const scrollProgress = scrollTop / itemHeight;
      const newIndex = Math.round(scrollProgress);
      
      // Only update if we've moved significantly (reduces unnecessary re-renders)
      if (Math.abs(newIndex - currentIndex) > 0 || Math.abs(scrollTop - lastScrollTopRef.current) > itemHeight * 0.1) {
        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < words.length) {
          setCurrentIndex(newIndex);
        }
        
        // Load more words when nearing the end
        if (newIndex >= words.length - 3 && newIndex < words.length) {
          loadMoreWords();
        }
      }
      
      lastScrollTopRef.current = scrollTop;
      isScrollingRef.current = false;
    });
    
    isScrollingRef.current = true;
  }, [currentIndex, words.length, loadMoreWords]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current !== null) {
        cancelAnimationFrame(scrollTimeoutRef.current);
      }
    };
  }, []);

  const speakWord = useCallback((word: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  }, [isSpeaking]);

  const handleRefresh = useCallback(() => {
    setUsedWords(new Set());
    loadInitialWords();
  }, [loadInitialWords]);

  if (!user) return null;

  return (
    <div className="h-screen h-[100dvh] w-screen relative overflow-hidden bg-background">
      <Navigation />
      
      {/* Back button and refresh */}
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
          onClick={handleRefresh}
          className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
          disabled={isLoading}
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading && words.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading interesting words...</p>
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
          <>
            {words.map((wordEntry, index) => (
              <div
                key={`${wordEntry.word}-${index}`}
                className="h-[100dvh] w-full snap-start snap-always relative flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, 
                    hsl(${(index * 37) % 360}, 70%, 15%), 
                    hsl(${(index * 37 + 60) % 360}, 60%, 10%))`,
                }}
              >
                <div className="relative z-10 text-foreground p-8 max-w-2xl mx-auto text-center">
                  <div className="space-y-6">
                    {/* Word */}
                    <div className="flex flex-col items-center justify-center gap-4">
                      {index === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 text-sm font-medium"
                        >
                          Word of the Day
                        </motion.div>
                      )}
                      <div className="flex items-center justify-center gap-4">
                        <h1 
                          className="text-5xl sm:text-7xl font-bold text-white"
                          style={{ fontFamily: userPreferences.fontFamily }}
                        >
                          {wordEntry.word}
                        </h1>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => speakWord(wordEntry.word)}
                          className="text-white/60 hover:text-white hover:bg-white/10"
                        >
                          {isSpeaking ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Part of Speech */}
                    <p className="text-lg text-white/60 italic">
                      {wordEntry.partOfSpeech}
                    </p>
                    
                    {/* Definition - render sanitized HTML properly */}
                    <div 
                      className="text-xl sm:text-2xl text-white/90 leading-relaxed"
                      style={{ 
                        fontFamily: userPreferences.fontFamily,
                        fontSize: `${userPreferences.fontSize + 4}px`
                      }}
                    >
                      <SanitizedHtml html={wordEntry.definition} className="text-white/90" />
                    </div>
                    
                    {/* Example */}
                    {wordEntry.example && (
                      <p className="text-base text-white/50 italic mt-4">
                        "{wordEntry.example}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Scroll hint */}
                {index === currentIndex && index < words.length - 1 && (
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/40">
                    <ChevronDown className="w-8 h-8 animate-bounce" />
                  </div>
                )}
              </div>
            ))}
          </>
        </div>
      )}
    </div>
  );
};

export default WordFeed;