import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getRandomArticles, WikipediaArticle } from "@/services/wikipediaService";
const Discover = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const navigate = useNavigate();
  const {
    ref,
    inView
  } = useInView();
  const queryClient = useQueryClient();
  const {
    toast
  } = useToast();
  const {
    currentLanguage,
    translations
  } = useLanguage();
  const t = translations;
  const categories = [t.categories.all, t.categories.science, t.categories.history, t.categories.technology, t.categories.arts, t.categories.sports, t.categories.nature, t.categories.philosophy, t.categories.politics, t.categories.literature];
  const categoryMapping = {
    [t.categories.all]: "All",
    [t.categories.science]: "Science",
    [t.categories.history]: "History",
    [t.categories.technology]: "Technology",
    [t.categories.arts]: "Arts",
    [t.categories.sports]: "Sports",
    [t.categories.nature]: "Nature",
    [t.categories.philosophy]: "Philosophy",
    [t.categories.politics]: "Politics",
    [t.categories.literature]: "Literature"
  };
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ["discover", selectedCategory, currentLanguage.code],
    queryFn: async () => {
      const englishCategory = categoryMapping[selectedCategory] || selectedCategory;
      const articles = await getRandomArticles(12, englishCategory, currentLanguage);
      return articles.filter(article => article.image);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => allPages.length < 3 ? allPages.length + 1 : undefined
  });
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);
  const handleCategoryChange = async (category: string) => {
    await queryClient.cancelQueries({
      queryKey: ["discover", selectedCategory, currentLanguage.code]
    });
    queryClient.removeQueries({
      queryKey: ["discover", selectedCategory, currentLanguage.code]
    });
    setSelectedCategory(category);
    toast({
      title: `${t.loading} ${category} ${t.articles}`,
      description: t.loadingDescription,
      duration: 2000
    });
    await refetch();
  };
  const handleArticleClick = (article: WikipediaArticle) => {
    navigate(`/?q=${encodeURIComponent(article.title)}`, {
      state: {
        reorderedResults: [article]
      }
    });
  };
  const articles = data?.pages.flat() ?? [];
  return <div className="h-screen overflow-y-auto pb-20">
      <div className="sticky top-0 z-10 bg-black/70 backdrop-blur-sm pt-4">
        <div className="flex items-center justify-between px-4 py-2">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-gray-400 hover:text-white" aria-label="Back to Home">
            
            <span className="sr-only">Back to Home</span>
            ← Back to Home
          </Button>
          <h1 className="text-lg font-semibold text-white" role="heading" aria-level={1}>{t.discover}</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-4 px-4 py-2">
            {categories.map(category => <button key={category} onClick={() => handleCategoryChange(category)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === category ? "bg-wikitok-red text-white" : "bg-white/10 hover:bg-white/20"}`} aria-label={`Filter by ${category}`} aria-pressed={selectedCategory === category}>
                {category}
              </button>)}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
        {isLoading ? Array.from({
        length: 12
      }).map((_, i) => <Skeleton key={i} className="aspect-[9/16] rounded-lg bg-white/10" />) : articles.map((article: WikipediaArticle) => <div key={`${article.id}-${article.title}`} className="relative aspect-[9/16] group cursor-pointer" onClick={() => handleArticleClick(article)} role="article" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleArticleClick(article)} aria-label={`Read article: ${article.title}`}>
              <img src={article.image} alt={article.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80 rounded-lg" />
              <div className="absolute bottom-0 p-3 w-full">
                <h3 className="text-sm font-semibold line-clamp-2">{article.title}</h3>
                <p className="text-xs text-gray-300 mt-1">
                  {article.views.toLocaleString()} {t.views}
                </p>
              </div>
            </div>)}
      </div>

      {isFetchingNextPage && <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wikitok-red" />
        </div>}

      <div ref={ref} className="h-10" />
    </div>;
};
export default Discover;