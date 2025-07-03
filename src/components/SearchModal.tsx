
import { useState } from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { getTranslations } from "../services/translations";
import { useTheme } from "../contexts/ThemeContext";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const { theme } = useTheme();
  const t = getTranslations(currentLanguage);

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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Search Modal */}
      <div className={`relative w-full max-w-2xl mx-4 ${
        theme === 'dark' ? 'bg-black/80' : 'bg-white/90'
      } backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl`}>
        <form onSubmit={handleSearch} className="p-6">
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
      </div>
    </div>
  );
};

export default SearchModal;
