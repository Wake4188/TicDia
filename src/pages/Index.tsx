
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import ArticleLoadingState from "../components/ArticleLoadingState";
import { getRandomArticles, searchArticles, getPersonalizedArticles } from "../services/wikipediaService";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "../contexts/LanguageContext";
import { useAnalyticsTracking } from "../hooks/useAnalyticsTracking";
import { useChallengeTracking } from "../hooks/useChallengeTracking";
import { AnalyticsCheck } from "../components/AnalyticsCheck";
import { useUserPreferences } from "../contexts/UserPreferencesContext";
import { useAuth } from "../contexts/AuthContext";

// Lazy load heavy components to reduce initial JS payload
const ArticleViewer = lazy(() => import("../components/ArticleViewer"));
const Navigation = lazy(() => import("../components/Navigation"));
const LeftSidebar = lazy(() => import("../components/LeftSidebar"));
const RightSidebar = lazy(() => import("../components/RightSidebar"));
const FunErrorScreen = lazy(() => import("../components/FunErrorScreen"));

// Cache key for persisting articles
const ARTICLES_CACHE_KEY = 'ticdia_cached_articles';
const CACHE_TIMESTAMP_KEY = 'ticdia_cache_timestamp';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes - longer cache for faster loads

// Load cached articles from localStorage
const loadCachedArticles = () => {
  try {
    const cached = localStorage.getItem(ARTICLES_CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age < CACHE_DURATION) {
        const parsed = JSON.parse(cached);
        // Validate the cached data is a non-empty array with required fields
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.title && parsed[0]?.image) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to load cached articles:', e);
    // Clear corrupted cache
    localStorage.removeItem(ARTICLES_CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  }
  return null;
};

// Save articles to localStorage cache
const saveCachedArticles = (articles: any[]) => {
  try {
    localStorage.setItem(ARTICLES_CACHE_KEY, JSON.stringify(articles));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (e) {
    console.warn('Failed to cache articles:', e);
  }
};

const Index = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentLanguage, isLoading: languageLoading, translations } = useLanguage();
  const t = translations;
  const searchQuery = searchParams.get("q");
  const [currentArticle, setCurrentArticle] = useState(null);
  const { trackArticleView } = useAnalyticsTracking();
  useChallengeTracking();
  const { userPreferences } = useUserPreferences();
  const { user } = useAuth();

  // Extract specific values to prevent query re-execution on every render
  const feedType = userPreferences.feedType;
  const allowAdultContent = userPreferences.allowAdultContent;
  const userId = user?.id;

  // Only regenerate feedKey when explicitly requested (e.g., logo click)
  // Use location.key to detect fresh navigation vs back/forward
  const [feedKey, setFeedKey] = useState(() => {
    // Check if this is a fresh navigation to home (logo click triggers this)
    const navState = location.state as { freshFeed?: boolean } | null;
    return navState?.freshFeed ? Date.now() : 'initial';
  });

  // Listen for explicit refresh requests (logo click)
  useEffect(() => {
    const navState = location.state as { freshFeed?: boolean } | null;
    if (navState?.freshFeed && !searchQuery) {
      setFeedKey(Date.now());
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state, searchQuery]);

  // Stable query key that doesn't change on every navigation
  const queryKey = useMemo(() => {
    if (searchQuery) {
      return ["articles", "search", searchQuery, currentLanguage.code, allowAdultContent];
    }
    return ["articles", "feed", currentLanguage.code, feedType, userId, feedKey, allowAdultContent];
  }, [searchQuery, currentLanguage.code, feedType, userId, feedKey, allowAdultContent]);

  const { data: articles, isLoading, error, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      if (searchQuery) {
        const results = location.state?.reorderedResults || await searchArticles(searchQuery, currentLanguage, allowAdultContent);
        return results.filter(article => article.image);
      }

      // Check cache first for instant display
      const cached = loadCachedArticles();
      
      // Use personalized feed if feedType is 'curated' and user is logged in
      if (feedType === 'curated' && userId) {
        try {
          const personalizedArticles = await getPersonalizedArticles(userId, 10, currentLanguage, allowAdultContent);
          const articlesWithImages = personalizedArticles.filter(article => article.image);
          if (articlesWithImages.length > 0) {
            saveCachedArticles(articlesWithImages);
            return articlesWithImages;
          }
        } catch (error) {
          console.error('Failed to fetch personalized articles, falling back to random:', error);
        }
      }

      // Faster single fetch - request more articles to increase chance of images
      const randomArticles = await getRandomArticles(20, undefined, currentLanguage, allowAdultContent);
      const articlesWithImages = randomArticles.filter(article => article.image);
      
      if (articlesWithImages.length >= 5) {
        saveCachedArticles(articlesWithImages);
        return articlesWithImages;
      }
      
      // If we have cached data and fresh fetch failed, use cache
      if (cached && cached.length > 0) {
        return cached;
      }
      
      // Last resort: return whatever we got
      if (articlesWithImages.length > 0) {
        saveCachedArticles(articlesWithImages);
        return articlesWithImages;
      }
      
      throw new Error("Failed to find articles with images.");
    },
    retry: 1,
    enabled: !languageLoading,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on every mount
    placeholderData: () => {
      // Use cached articles as placeholder for instant display
      if (!searchQuery) {
        return loadCachedArticles();
      }
      return undefined;
    },
  });

  const handleTagClick = useCallback((tag: string) => {
    navigate(`/?q=${encodeURIComponent(tag)}`);
  }, [navigate]);

  // Show error toast only once
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load articles. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Show loading on initial load or when actively fetching with no data
  // Critical: Only show loading screen during actual loading states, not during brief transitions
  const hasArticles = articles && articles.length > 0;
  const showLoading = languageLoading || (isLoading && !hasArticles);

  // Only show error screen for actual persistent errors, not during loading transitions
  // The key is to wait for the query to complete before deciding to show an error
  const showError = !isLoading && !isFetching && !languageLoading && (error || !hasArticles);

  if (showLoading) {
    return <ArticleLoadingState />;
  }

  if (showError) {
    const errorType = searchQuery ? 'empty' : (error ? 'loading-failed' : 'empty');
    const handleRetry = () => {
      localStorage.removeItem(ARTICLES_CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      window.location.reload();
    };
    
    return (
      <Suspense fallback={<ArticleLoadingState />}>
        <FunErrorScreen
          type={errorType}
          title={searchQuery ? t.noResults : undefined}
          message={searchQuery 
            ? `No articles found for "${searchQuery}". Try a different search term!`
            : undefined}
          onRetry={handleRetry}
          onGoHome={() => navigate('/')}
        />
      </Suspense>
    );
  }

  // Ensure we have articles before rendering
  if (!hasArticles) {
    return <ArticleLoadingState />;
  }

  const currentDisplayArticle = currentArticle || articles[0];

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-background">
      <AnalyticsCheck />
      <Suspense fallback={null}>
        <Navigation currentArticle={currentDisplayArticle} />
      </Suspense>
      <div className="flex h-full">
        <Suspense fallback={null}>
          <LeftSidebar article={currentDisplayArticle} onTagClick={handleTagClick} />
        </Suspense>
        <Suspense fallback={<ArticleLoadingState />}>
          <ArticleViewer articles={articles} onArticleChange={setCurrentArticle} onArticleView={trackArticleView} />
        </Suspense>
        <Suspense fallback={null}>
          <RightSidebar article={currentDisplayArticle} />
        </Suspense>
      </div>
    </div>
  );
};

export default Index;