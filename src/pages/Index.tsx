
import { useQuery } from "@tanstack/react-query";
import ArticleViewer from "../components/ArticleViewer";
import RightSidebar from "../components/RightSidebar";
import LeftSidebar from "../components/LeftSidebar";
import { getRandomArticles, searchArticles } from "../services/wikipediaService";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";

const Index = () => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchQuery = searchParams.get("q");
  const [currentArticle, setCurrentArticle] = useState(null);

  // Apply theme to body
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark' : 'light';
  }, [theme]);

  const { data: articles, isLoading, error } = useQuery({
    queryKey: ["articles", searchQuery],
    queryFn: async () => {
      let fetchedArticles;
      if (searchQuery) {
        if (location.state?.reorderedResults) {
          fetchedArticles = location.state.reorderedResults;
        } else {
          fetchedArticles = await searchArticles(searchQuery);
        }
      } else {
        fetchedArticles = await getRandomArticles(3);
      }
      return fetchedArticles.filter(article => article.image);
    },
    retry: 1,
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

  const bgClass = theme === 'dark' ? 'bg-wikitok-dark' : 'bg-wikitok-lightBg';
  const textClass = theme === 'dark' ? 'text-white' : 'text-wikitok-lightText';

  if (isLoading) {
    return (
      <div className={`h-screen w-screen flex items-center justify-center ${bgClass} transition-colors duration-300`}>
        <div className={textClass}>Loading amazing articles...</div>
      </div>
    );
  }

  if (error || !articles || articles.length === 0) {
    return (
      <div className={`h-screen w-screen flex items-center justify-center ${bgClass} transition-colors duration-300`}>
        <div className={textClass}>Something went wrong. Please try again.</div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen relative overflow-hidden ${bgClass} transition-colors duration-300`}>
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
