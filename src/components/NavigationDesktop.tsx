
import { Search, Compass, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { getTranslations, formatDate } from "../services/translations";
import LanguageSelector from "./LanguageSelector";

interface NavigationDesktopProps {
  searchValue: string;
  onSearchClick: () => void;
  onRandomClick: () => void;
  onTodayClick: () => void;
}

const NavigationDesktop = ({ searchValue, onSearchClick, onRandomClick, onTodayClick }: NavigationDesktopProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);

  const today = new Date();
  const dateString = formatDate(today, currentLanguage);

  const handleDiscoverClick = () => {
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
  const searchBgClass = theme === 'dark' ? "bg-black/20" : "bg-white/80";
  const textClass = theme === 'dark' ? "text-white" : "text-wikitok-lightText";

  return (
    <div className="hidden md:contents">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="text-xl font-bold text-wikitok-red cursor-pointer" onClick={onRandomClick}>
          WikTok
        </div>
        <div 
          className="bg-wikitok-red text-white px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:bg-red-600 transition-colors"
          onClick={onTodayClick}
        >
          {dateString}
        </div>
      </div>

      {/* Search Bar */}
      <div className={`flex items-center ${searchBgClass} backdrop-blur-sm rounded-full px-4 py-2 cursor-pointer transition-all duration-300`} onClick={onSearchClick}>
        <Search className={`w-4 h-4 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'} mr-2`} />
        <span className={`${theme === 'dark' ? 'text-white/60' : 'text-gray-500'} text-sm`}>
          {searchValue || t.search}
        </span>
      </div>

      {/* Right Section */}
      <div className="flex space-x-4 items-center">
        <LanguageSelector />
        <Compass 
          className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${
            isDiscoverPage 
              ? "text-wikitok-red" 
              : theme === 'dark' 
                ? "text-white hover:text-wikitok-red" 
                : "text-wikitok-lightText hover:text-wikitok-red"
          }`} 
          onClick={handleDiscoverClick} 
        />
        <div 
          className={`flex items-center gap-2 cursor-pointer transition-colors duration-300 ${
            theme === 'dark' 
              ? "text-white hover:text-wikitok-red" 
              : "text-wikitok-lightText hover:text-wikitok-red"
          }`} 
          onClick={handleAuthClick}
        >
          {user ? (
            <>
              <div className="w-6 h-6 bg-wikitok-red rounded-full flex items-center justify-center text-xs text-white font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm hidden sm:block">{t.profile}</span>
            </>
          ) : (
            <>
              <User className="w-5 h-5" />
              <span className="text-sm hidden sm:block">{t.signIn}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavigationDesktop;
