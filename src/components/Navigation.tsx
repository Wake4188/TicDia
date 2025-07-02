
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { searchArticles, getRandomArticles } from "../services/wikipediaService";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { getTranslations } from "../services/translations";
import MobileMenu from "./MobileMenu";
import NavigationDesktop from "./NavigationDesktop";

const Navigation = () => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const [searchParams] = useSearchParams();
  const t = getTranslations(currentLanguage);

  useEffect(() => {
    const query = searchParams.get("q");
    if (query && location.pathname !== "/discover") {
      const decodedQuery = decodeURIComponent(query);
      setSearchValue(decodedQuery);
    }
  }, [searchParams, location.pathname]);
  
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search", searchValue, currentLanguage.code],
    queryFn: () => searchArticles(searchValue, currentLanguage),
    enabled: searchValue.length > 0,
    gcTime: 1000 * 60 * 5,
    staleTime: 0
  });

  const handleArticleSelect = (title: string, selectedArticle: any) => {
    setOpen(false);
    setSearchValue(title);
    toast({
      title: t.loading,
      description: `${t.loading} ${title}...`,
      duration: 2000
    });
    const reorderedResults = [selectedArticle, ...(searchResults || []).filter(article => article.id !== selectedArticle.id)];
    navigate(`/?q=${encodeURIComponent(title)}`, {
      state: { reorderedResults }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchValue("");
    }
  };

  const handleRandomArticle = async () => {
    setSearchValue("");
    toast({
      title: t.loading,
      description: t.loadingDescription,
      duration: 2000
    });
    const randomArticles = await getRandomArticles(3, undefined, currentLanguage);
    if (randomArticles.length > 0) {
      navigate(`/?q=${encodeURIComponent(randomArticles[0].title)}`, {
        state: { reorderedResults: randomArticles }
      });
    }
  };

  const handleTodayClick = () => {
    navigate("/today");
  };

  const isDiscoverPage = location.pathname === "/discover";
  const navBgClass = theme === 'dark' 
    ? isDiscoverPage ? "bg-black" : "bg-gradient-to-b from-black/50 to-transparent" 
    : isDiscoverPage ? "bg-white shadow-sm" : "bg-gradient-to-b from-white/90 to-transparent backdrop-blur-sm";

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-4 transition-all duration-300 ${navBgClass}`}>
        <NavigationDesktop 
          searchValue={searchValue}
          onSearchClick={() => setOpen(true)}
          onRandomClick={handleRandomArticle}
          onTodayClick={handleTodayClick}
        />

        {/* Mobile */}
        <div className="md:hidden text-xl font-bold text-wikitok-red cursor-pointer" onClick={handleRandomArticle}>
          WikTok
        </div>
        <div className="md:hidden">
          <MobileMenu onSearchClick={() => setOpen(true)} searchValue={searchValue} />
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <Command shouldFilter={false}>
          <CommandInput placeholder={t.search} value={searchValue} onValueChange={setSearchValue} className="border-none focus:ring-0" />
          <CommandList className="max-h-[80vh] overflow-y-auto">
            {isLoading && <CommandEmpty>{t.loading}...</CommandEmpty>}
            {!isLoading && !searchResults && searchValue.length > 0 && <CommandEmpty>{t.error}</CommandEmpty>}
            {!isLoading && !searchValue && <CommandEmpty>{t.search}</CommandEmpty>}
            {!isLoading && searchResults && searchResults.length === 0 && <CommandEmpty>{t.error}</CommandEmpty>}
            {!isLoading && searchResults && searchResults.length > 0 && 
              <CommandGroup heading={`${t.articles} (${searchResults.length})`}>
                {searchResults.map(result => 
                  <CommandItem key={result.id} onSelect={() => handleArticleSelect(result.title, result)} className="flex items-center p-2 cursor-pointer hover:bg-accent rounded-lg">
                    <div className="flex items-center w-full gap-3">
                      {result.image && <img src={result.image} alt={result.title} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-base">{result.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {result.content}
                        </div>
                        {result.relevanceScore && 
                          <div className="text-xs text-wikitok-red mt-1">
                            Relevance: {Math.round(result.relevanceScore)}%
                          </div>
                        }
                      </div>
                    </div>
                  </CommandItem>
                )}
              </CommandGroup>
            }
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
};

export default Navigation;
