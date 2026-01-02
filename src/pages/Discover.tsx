import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { getRandomArticles, WikipediaArticle } from "@/services/wikipediaService";
import { motion, AnimatePresence } from "framer-motion";

const Discover = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const navigate = useNavigate();
  const { ref, inView } = useInView();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentLanguage, translations } = useLanguage();
  const { userPreferences } = useUserPreferences();
  const t = translations;

  const categories = [
    t.categories.all,
    t.categories.science,
    t.categories.history,
    t.categories.technology,
    t.categories.arts,
    t.categories.sports,
    t.categories.nature,
    t.categories.philosophy,
    t.categories.politics,
    t.categories.literature
  ];

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
    queryKey: ["discover", selectedCategory, currentLanguage.code, userPreferences.allowAdultContent],
    queryFn: async () => {
      const englishCategory = categoryMapping[selectedCategory] || selectedCategory;
      const articles = await getRandomArticles(12, englishCategory, currentLanguage, userPreferences.allowAdultContent);
      return articles.filter(article => article.image);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => allPages.length < 3 ? allPages.length + 1 : undefined,
    staleTime: 3 * 60 * 1000, // 3 minutes - reduce refetching
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  const handleCategoryChange = async (category: string) => {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header Section */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full w-10 h-10 p-0"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
            {t.discover}
          </h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Categories */}
        <div className="pb-3">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-2 px-4">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`
                    px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border
                    ${selectedCategory === category
                      ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105"
                      : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white"
                    }
                  `}
                >
                  {category}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>
      </div>

      {/* Content Grid */}
      <div className="p-2 md:p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[9/16] rounded-xl bg-white/10" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
          >
            {articles.map((article: WikipediaArticle, index: number) => (
              <motion.div
                key={`${article.id}-${article.title}-${index}`}
                variants={itemVariants}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                className="relative aspect-[9/16] group cursor-pointer overflow-hidden rounded-xl bg-gray-900 shadow-lg border border-white/5"
                onClick={() => handleArticleClick(article)}
              >
                {/* Image */}
                <img
                  src={article.image}
                  alt={article.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 transform transition-transform duration-300">
                  <div className="flex items-center gap-1 text-xs text-tictok-red font-medium mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-y-2 group-hover:translate-y-0">
                    <TrendingUp className="w-3 h-3" />
                    <span>Trending</span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 mb-1 drop-shadow-md">
                    {article.title}
                  </h3>

                  <p className="text-xs text-white/60 font-medium flex items-center gap-1">
                    {article.views.toLocaleString()} {t.views}
                  </p>
                </div>

                {/* Shine Effect on Hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Loading More Indicator */}
      {isFetchingNextPage && (
        <div className="flex justify-center p-8">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-tictok-red rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      <div ref={ref} className="h-20" />
    </div>
  );
};

export default Discover;