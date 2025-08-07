
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import ArticleViewer from "../components/ArticleViewer";
import RightSidebar from "../components/RightSidebar";
import LeftSidebar from "../components/LeftSidebar";
import { getRandomArticles, searchArticles } from "../services/wikipediaService";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "../contexts/LanguageContext";
import { getTranslations } from "../services/translations";
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
  const { currentLanguage, isLoading: languageLoading } = useLanguage();
  const t = getTranslations(currentLanguage);
  const searchQuery = searchParams.get("q");
  const [currentArticle, setCurrentArticle] = useState(null);
  const { trackArticleView } = useAnalyticsTracking();
  useChallengeTracking();

  const { data: articles, isLoading, error } = useQuery({
    queryKey: ["articles", searchQuery, currentLanguage.code],
    queryFn: async () => {
      if (searchQuery) {
        return location.state?.reorderedResults || await searchArticles(searchQuery, currentLanguage);
      }
      return await getRandomArticles(3, undefined, currentLanguage);
    },
    retry: 1,
    enabled: !languageLoading,
    select: (data) => data.filter(article => article.image)
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
      <div className="h-screen w-screen flex items-center justify-center bg-wikitok-dark text-white">
        <div>{t.loading}</div>
      </div>
    );
  }

  if (error || !articles || articles.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-wikitok-dark text-white">
        <div>{t.error}</div>
      </div>
    );
  }

  const currentDisplayArticle = currentArticle || articles[0];

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-wikitok-dark">
      <AnalyticsCheck />
      <BadgeDisplay />
      <DailyChallenges />
      <div className="flex h-full">
        <LeftSidebar article={currentDisplayArticle} onTagClick={handleTagClick} />
        <ArticleViewer articles={articles} onArticleChange={setCurrentArticle} onArticleView={trackArticleView} />
        <RightSidebar article={currentDisplayArticle} />
      </div>
    </div>
  );
};

export default Index;
