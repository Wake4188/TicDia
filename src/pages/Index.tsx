
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import ArticleViewer from "../components/ArticleViewer";
import RightSidebar from "../components/RightSidebar";
import LeftSidebar from "../components/LeftSidebar";
import Navigation from "../components/Navigation";
import { getRandomArticles, searchArticles } from "../services/wikipediaService";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "../contexts/LanguageContext";
import { useAnalyticsTracking } from "../hooks/useAnalyticsTracking";
import { useChallengeTracking } from "../hooks/useChallengeTracking";
import { AnalyticsCheck } from "../components/AnalyticsCheck";
import BadgeDisplay from "../components/BadgeDisplay";
import DailyChallenges from "../components/DailyChallenges";

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

  const { data: articles, isLoading, error } = useQuery({
    queryKey: ["articles", searchQuery, currentLanguage.code],
    queryFn: async () => {
      if (searchQuery) {
        const results = location.state?.reorderedResults || await searchArticles(searchQuery, currentLanguage);
        return results.filter(article => article.image);
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

  if (isLoading || languageLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-tictok-dark text-white">
        <div>{t.loading}</div>
      </div>
    );
  }

  if (error || !articles || articles.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-tictok-dark text-white">
        <div>{t.error}</div>
      </div>
    );
  }

  const currentDisplayArticle = currentArticle || articles[0];

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-tictok-dark">
      <AnalyticsCheck />
      <BadgeDisplay />
      <DailyChallenges />
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
