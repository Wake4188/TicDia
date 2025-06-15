
import { Search, Compass, User, Sun, Moon } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { searchArticles, getRandomArticles } from "../services/wikipediaService";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

const Navigation = () => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const query = searchParams.get("q");
    if (query && location.pathname !== "/discover") {
      const decodedQuery = decodeURIComponent(query);
      setSearchValue(decodedQuery);
    }
  }, [searchParams, location.pathname]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search", searchValue],
    queryFn: () => searchArticles(searchValue),
    enabled: searchValue.length > 0,
    gcTime: 1000 * 60 * 5,
    staleTime: 0,
  });

  const handleArticleSelect = (title: string, selectedArticle: any) => {
    setOpen(false);
    setSearchValue(title);
    toast({
      title: "Loading articles",
      description: `Loading articles about ${title}...`,
      duration: 2000,
    });
    
    const reorderedResults = [
      selectedArticle,
      ...(searchResults || []).filter(article => article.id !== selectedArticle.id)
    ];
    
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
      title: "Loading random article",
      description: "Finding something interesting for you...",
      duration: 2000,
    });
    const randomArticles = await getRandomArticles(3);
    if (randomArticles.length > 0) {
      navigate(`/?q=${encodeURIComponent(randomArticles[0].title)}`, {
        state: { reorderedResults: randomArticles }
      });
    }
  };

  const handleDiscoverClick = () => {
    setSearchValue("");
    if (location.pathname === "/discover") {
      navigate("/");
    } else {
      navigate("/discover");
    }
  };

  const handleAuthClick = () => {
    if (user) {
      navigate("/profile");
    } else {
      navigate("/auth");
    }
  };

  const isDiscoverPage = location.pathname === "/discover";
  const navBgClass = theme === 'dark' 
    ? (isDiscoverPage ? "bg-black" : "bg-gradient-to-b from-black/50 to-transparent")
    : (isDiscoverPage ? "bg-white shadow-sm" : "bg-gradient-to-b from-white/90 to-transparent backdrop-blur-sm");
  
  const textClass = theme === 'dark' ? "text-white" : "text-wikitok-lightText";
  const searchBgClass = theme === 'dark' ? "bg-black/20" : "bg-white/80";

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-4 transition-all duration-300 ${navBgClass}`}>
        <div 
          className="text-xl font-bold text-wikitok-red cursor-pointer"
          onClick={handleRandomArticle}
        >
          WikTok
        </div>
        <div 
          className={`flex items-center ${searchBgClass} backdrop-blur-sm rounded-full px-4 py-2 cursor-pointer transition-all duration-300`}
          onClick={() => setOpen(true)}
        >
          <Search className={`w-4 h-4 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'} mr-2`} />
          <span className={`${theme === 'dark' ? 'text-white/60' : 'text-gray-500'} text-sm`}>
            {searchValue || "Search articles"}
          </span>
        </div>
        <div className="flex space-x-4 items-center">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors duration-300 ${
              theme === 'dark' 
                ? 'text-white hover:text-wikitok-red hover:bg-white/10' 
                : 'text-wikitok-lightText hover:text-wikitok-red hover:bg-gray-100'
            }`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Compass 
            className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${
              location.pathname === "/discover" 
                ? "text-wikitok-red" 
                : theme === 'dark' ? "text-white hover:text-wikitok-red" : "text-wikitok-lightText hover:text-wikitok-red"
            }`}
            onClick={handleDiscoverClick}
          />
          <div 
            className={`flex items-center gap-2 cursor-pointer transition-colors duration-300 ${
              theme === 'dark' ? "text-white hover:text-wikitok-red" : "text-wikitok-lightText hover:text-wikitok-red"
            }`}
            onClick={handleAuthClick}
          >
            {user ? (
              <>
                <div className="w-6 h-6 bg-wikitok-red rounded-full flex items-center justify-center text-xs text-white font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm hidden sm:block">Profile</span>
              </>
            ) : (
              <>
                <User className="w-5 h-5" />
                <span className="text-sm hidden sm:block">Sign In</span>
              </>
            )}
          </div>
        </div>
      </div>

      <CommandDialog 
        open={open} 
        onOpenChange={handleOpenChange}
      >
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search articles..." 
            value={searchValue}
            onValueChange={setSearchValue}
            className="border-none focus:ring-0"
          />
          <CommandList className="max-h-[80vh] overflow-y-auto">
            {isLoading && (
              <CommandEmpty>Searching...</CommandEmpty>
            )}
            {!isLoading && !searchResults && searchValue.length > 0 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            {!isLoading && !searchValue && (
              <CommandEmpty>Start typing to search articles</CommandEmpty>
            )}
            {!isLoading && searchResults && searchResults.length === 0 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            {!isLoading && searchResults && searchResults.length > 0 && (
              <CommandGroup heading={`Articles (${searchResults.length} results)`}>
                {searchResults.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleArticleSelect(result.title, result)}
                    className="flex items-center p-2 cursor-pointer hover:bg-accent rounded-lg"
                  >
                    <div className="flex items-center w-full gap-3">
                      {result.image && (
                        <img 
                          src={result.image} 
                          alt={result.title}
                          className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-base">{result.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {result.content}
                        </div>
                        {result.relevanceScore && (
                          <div className="text-xs text-wikitok-red mt-1">
                            Relevance: {Math.round(result.relevanceScore)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
};

export default Navigation;
