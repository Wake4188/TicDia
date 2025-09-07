import { Search, Compass, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { formatDate } from "../services/translations";
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
  const location = useLocation();
  const {
    user
  } = useAuth();
  const {
    theme
  } = useTheme();
  const {
    currentLanguage,
    translations
  } = useLanguage();
  const t = translations;
  const dateString = formatDate(new Date(), currentLanguage);
  const isDiscoverPage = location.pathname === "/discover";
  const isDark = theme === 'dark';
  const handleDiscoverClick = () => {
    navigate(isDiscoverPage ? "/" : "/discover");
  };
  const handleAuthClick = () => {
    navigate(user ? "/profile" : "/auth");
  };
  return <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/50 to-transparent backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-2 max-w-7xl mx-auto">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <div className={`flex items-center gap-2 cursor-pointer transition-colors duration-300 text-white hover:text-wikitok-red`} onClick={handleAuthClick}>
            {user ? <>
                <div className="w-6 h-6 bg-wikitok-red rounded-full flex items-center justify-center text-xs text-white font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm hidden sm:block">{t.profile}</span>
              </> : <>
                <User className="w-5 h-5" />
                <span className="text-sm hidden sm:block">{t.signIn}</span>
              </>}
          </div>
        </div>

        {/* Center Section */}
        <div className={`flex items-center ${isDark ? 'bg-black/20' : 'bg-white/80'} backdrop-blur-sm rounded-full px-4 py-1.5 cursor-pointer transition-all duration-300 min-w-80`} onClick={onSearchClick}>
          <Search className={`w-4 h-4 ${isDark ? 'text-white/60' : 'text-gray-500'} mr-2`} />
          <span className={`${isDark ? 'text-white/60' : 'text-gray-500'} text-sm`}>
            {searchValue || t.search}
          </span>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <Compass className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${isDiscoverPage ? "text-wikitok-red" : "text-white hover:text-wikitok-red"}`} onClick={handleDiscoverClick} />
          <div className="bg-wikitok-red text-white px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:bg-red-600 transition-colors" onClick={onTodayClick}>
            {dateString}
          </div>
          <div className="text-xl font-bold text-wikitok-red cursor-pointer" onClick={() => navigate("/")}>TicDia</div>
        </div>
      </div>
    </div>;
};
export default NavigationDesktop;