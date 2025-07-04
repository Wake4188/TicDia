
import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { getTranslations } from "../services/translations";
import { useTheme } from "../contexts/ThemeContext";
import { searchArticles } from "../services/wikipediaService";
import { WikipediaArticle } from "../services/types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [previewResults, setPreviewResults] = useState<WikipediaArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const { theme } = useTheme();
  const t = getTranslations(currentLanguage);

  // Debounced search for preview
  const debouncedSearch = useCallback(
    async (query: string) => {
      if (query.length < 3) {
        setPreviewResults([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const results = await searchArticles(query, currentLanguage);
        setPreviewResults(results.slice(0, 5)); // Show top 5 results
      } catch (error) {
        console.error('Preview search failed:', error);
        setPreviewResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentLanguage]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearch]);

  const handleResultClick = (title: string) => {
    navigate(`/?q=${encodeURIComponent(title)}`);
    onClose();
    setSearchQuery("");
    setPreviewResults([]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
      setSearchQuery("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Search Modal */}
      <div className={`relative w-full max-w-2xl mx-4 ${
        theme === 'dark' ? 'bg-black/80' : 'bg-white/90'
      } backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl`}>
        <form onSubmit={handleSearch} className="p-6 pt-4 pb-0">
          <div className="flex items-center gap-4">
            <Search className={`w-6 h-6 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search}
              className={`flex-1 bg-transparent border-none outline-none text-lg ${
                theme === 'dark' ? 'text-white placeholder-white/60' : 'text-gray-900 placeholder-gray-500'
              }`}
              autoFocus
            />
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-full ${
                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              } transition-colors`}
            >
              <X className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-500'}`} />
            </button>
          </div>
        </form>
        
        {/* Search Preview Results */}
        {(searchQuery.length >= 3 || isLoading) && (
          <div className="px-6 pb-6">
            <div className={`border-t ${theme === 'dark' ? 'border-white/20' : 'border-gray-200'} pt-4`}>
              {isLoading ? (
                <div className={`text-center py-4 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
                  Searching...
                </div>
              ) : previewResults.length > 0 ? (
                <div className="space-y-2">
                  <div className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'} mb-3`}>
                    Search Results:
                  </div>
                  {previewResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => handleResultClick(result.title)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        theme === 'dark' 
                          ? 'hover:bg-white/10 border border-white/10' 
                          : 'hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {result.image && (
                          <img 
                            src={result.image} 
                            alt={result.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium truncate ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {result.title}
                          </div>
                          <div className={`text-sm truncate ${
                            theme === 'dark' ? 'text-white/60' : 'text-gray-500'
                          }`}>
                            {result.content.substring(0, 100)}...
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery.length >= 3 ? (
                <div className={`text-center py-4 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
                  No results found
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchModal;
