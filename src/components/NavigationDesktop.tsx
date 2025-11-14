import { Search, User, Compass, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "./LanguageSelector";

interface NavigationDesktopProps {
  searchValue: string;
  onSearchClick: () => void;
  onRandomClick: () => void;
  onTodayClick: () => void;
}

const NavigationDesktop = ({
  searchValue,
  onSearchClick,
  onRandomClick,
  onTodayClick
}: NavigationDesktopProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { currentLanguage, translations } = useLanguage();
  const t = translations;
  const isDark = theme === 'dark';
  
  const handleDiscoverClick = () => {
    navigate("/discover");
  };

  const handleAuthClick = () => {
    navigate(user ? "/profile" : "/auth");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/50 to-transparent backdrop-blur-sm">
      <div className="flex items-center justify-between px-3 md:px-6 py-2 max-w-7xl mx-auto gap-2 md:gap-4">
        {/* Left Section - Sign In & Language */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <div 
            className={`flex items-center gap-1 md:gap-2 cursor-pointer transition-colors duration-300 text-white hover:text-tictok-red`}
            onClick={handleAuthClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleAuthClick()}
            aria-label={user ? t.profile : t.signIn}
          >
            {user ? (
              <>
                <div className="w-5 h-5 md:w-6 md:h-6 bg-tictok-red rounded-full flex items-center justify-center text-xs text-white font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs md:text-sm hidden lg:block">{t.profile}</span>
              </>
            ) : (
              <>
                <User className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-sm hidden lg:block">{t.signIn}</span>
              </>
            )}
          </div>
          
          <LanguageSelector />
        </div>

        {/* Center Section - Search */}
        <div 
          className={`flex items-center ${isDark ? 'bg-black/20' : 'bg-white/80'} backdrop-blur-sm rounded-full px-3 md:px-4 py-1.5 cursor-pointer transition-all duration-300 flex-1 max-w-xs md:max-w-md`}
          onClick={onSearchClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSearchClick()}
          aria-label={t.search}
        >
          <Search className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isDark ? 'text-white/60' : 'text-gray-500'} mr-2 flex-shrink-0`} />
          <span className={`${isDark ? 'text-white/60' : 'text-gray-500'} text-xs md:text-sm truncate`}>
            {searchValue || t.search}
          </span>
        </div>

        {/* Right Section - Discover, Today, Logo */}
        <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
          <Button
            variant="ghost"
            onClick={handleDiscoverClick}
            className="text-white hover:text-white hover:bg-white/5 transition-colors p-1.5 md:p-2"
            aria-label={t.discover}
          >
            <Compass className="w-4 h-4 md:w-5 md:h-5" />
          </Button>

          <Button
            variant="ghost"
            onClick={onTodayClick}
            className="flex items-center gap-1 md:gap-2 text-white hover:text-white hover:bg-white/5 transition-colors p-1.5 md:p-2"
            aria-label={t.today}
          >
            <Calendar className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden md:inline text-sm">{t.today}</span>
          </Button>

          <h1 
            onClick={() => navigate('/')}
            className="text-lg md:text-2xl font-bold cursor-pointer transition-all duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] hover:drop-shadow-[0_0_20px_rgba(255,255,255,1)]"
            style={{ color: isDark ? '#FFFFFF' : '#000000' }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
            aria-label="Navigate to home"
          >
            TicDia
          </h1>
        </div>
      </div>
    </div>
  );
};

export default NavigationDesktop;