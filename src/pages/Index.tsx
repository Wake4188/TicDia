
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ArticleViewer from "../components/ArticleViewer";
import ArticleLoadingState from "../components/ArticleLoadingState";
import RightSidebar from "../components/RightSidebar";
import LeftSidebar from "../components/LeftSidebar";
import Navigation from "../components/Navigation";
import { getRandomArticles, searchArticles, getPersonalizedArticles } from "../services/wikipediaService";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "../contexts/LanguageContext";
import { useAnalyticsTracking } from "../hooks/useAnalyticsTracking";
import { useChallengeTracking } from "../hooks/useChallengeTracking";
import { AnalyticsCheck } from "../components/AnalyticsCheck";
import BadgeDisplay from "../components/BadgeDisplay";
import DailyChallenges from "../components/DailyChallenges";
import { useUserPreferences } from "../contexts/UserPreferencesContext";
import { useAuth } from "../contexts/AuthContext";

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
  const userId = user?.id;

  // Generate unique key for fresh articles on each navigation
  const [feedKey, setFeedKey] = useState(() => Date.now());

  // Reset feed when navigating back to home without search
  useEffect(() => {
    if (!searchQuery) {
      setFeedKey(Date.now());
    }
  }, [location.pathname, searchQuery]);

  const { data: articles, isLoading, error } = useQuery({
    queryKey: ["articles", searchQuery, currentLanguage.code, feedType, userId, feedKey],
    queryFn: async () => {
      if (searchQuery) {
        const results = location.state?.reorderedResults || await searchArticles(searchQuery, currentLanguage);
        return results.filter(article => article.image);
      }

      // Use personalized feed if feedType is 'curated' and user is logged in
      if (feedType === 'curated' && userId) {
        try {
          const personalizedArticles = await getPersonalizedArticles(userId, 10, currentLanguage);
          const articlesWithImages = personalizedArticles.filter(article => article.image);
          if (articlesWithImages.length > 0) {
            return articlesWithImages;
          }
        } catch (error) {
          console.error('Failed to fetch personalized articles, falling back to random:', error);
        }
      }

      // Resilient fetching logic - retry until we find articles with images
      let attempts = 0;
      while (attempts < 5) {
        const randomArticles = await getRandomArticles(10, undefined, currentLanguage);
        const articlesWithImages = randomArticles.filter(article => article.image);
        if (articlesWithImages.length > 0) {
          return articlesWithImages;
        }
        attempts++;
      }
      throw new Error("Failed to find articles with images after multiple attempts.");
    },
    retry: 1,
    enabled: !languageLoading,
  });

  const handleTagClick = (tag: string) => {
    navigate(`/?q=${encodeURIComponent(tag)}`);
  };

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load articles. Please try again later.",
      variant: "destructive",
    });
  }


  // ... existing code ...

  if (isLoading || languageLoading) {
    return <ArticleLoadingState />;
  }

  if (error || !articles || articles.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
        <div>{t.error}</div>
      </div>
    );
  }

  const currentDisplayArticle = currentArticle || articles[0];

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-background">
      <AnalyticsCheck />
      {/* BadgeDisplay removed as requested */}
      {/* DailyChallenges removed as requested */}
      <Navigation currentArticle={currentDisplayArticle} />
      <div className="flex h-full">
        <LeftSidebar article={currentDisplayArticle} onTagClick={handleTagClick} />
        <ArticleViewer articles={articles} onArticleChange={setCurrentArticle} onArticleView={trackArticleView} />
        <RightSidebar article={currentDisplayArticle} />
      </div>
    </div>
  );
};

export default Index;
