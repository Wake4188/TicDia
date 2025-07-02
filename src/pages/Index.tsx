
import { useQuery } from "@tanstack/react-query";
import ArticleViewer from "../components/ArticleViewer";
import RightSidebar from "../components/RightSidebar";
import LeftSidebar from "../components/LeftSidebar";
import { getRandomArticles, searchArticles } from "../services/wikipediaService";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { getTranslations } from "../services/translations";

const Index = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentLanguage, isLoading: languageLoading } = useLanguage();
  const t = getTranslations(currentLanguage);
  const searchQuery = searchParams.get("q");
  const [currentArticle, setCurrentArticle] = useState(null);

  const { data: articles, isLoading, error } = useQuery({
    queryKey: ["articles", searchQuery, currentLanguage.code],
    queryFn: async () => {
      let fetchedArticles;
      if (searchQuery) {
        if (location.state?.reorderedResults) {
          fetchedArticles = location.state.reorderedResults;
        } else {
          fetchedArticles = await searchArticles(searchQuery, currentLanguage);
        }
      } else {
        fetchedArticles = await getRandomArticles(3, undefined, currentLanguage);
      }
      return fetchedArticles.filter(article => article.image);
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

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-wikitok-dark">
      <div className="flex h-full">
        <LeftSidebar article={currentArticle || articles[0]} onTagClick={handleTagClick} />
        <ArticleViewer 
          articles={articles} 
          onArticleChange={setCurrentArticle}
        />
        <RightSidebar article={currentArticle || articles[0]} />
      </div>
    </div>
  );
};

export default Index;
