import React, { useState } from 'react';
import { Search, Compass, User, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatDate } from '../services/translations';
import LanguageSelector from './LanguageSelector';
import VoteButton from './VoteButton';

interface MobileMenuProps {
  onSearchClick: () => void;
  searchValue: string;
  currentArticle?: any;
}
const MobileMenu: React.FC<MobileMenuProps> = ({
  onSearchClick,
  searchValue,
  currentArticle
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user
  } = useAuth();
  const {
    currentLanguage,
    translations
  } = useLanguage();
  const {
    theme
  } = useTheme();
  const t = translations;
  const dateString = formatDate(new Date(), currentLanguage);
  const isDark = theme === 'dark';
  const handleNavigation = (path: string, action?: () => void) => {
    setIsOpen(false);
    if (action) action();else navigate(path);
  };
  const menuItems = [{
    label: dateString,
    onClick: () => handleNavigation('/today'),
    className: "w-full bg-tictok-red text-white px-4 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
  }, {
    icon: Search,
    label: searchValue || t.search,
    onClick: () => handleNavigation('', onSearchClick)
  }, {
    icon: Compass,
    label: t.discover,
    onClick: () => handleNavigation(location.pathname === "/discover" ? "/" : "/discover"),
    isActive: location.pathname === "/discover"
  }, {
    icon: user ? undefined : User,
    label: user ? t.profile : t.signIn,
    onClick: () => handleNavigation(user ? "/profile" : "/auth"),
    userIcon: user ? user.email?.charAt(0).toUpperCase() : undefined
  }];
  return <>
      <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-b from-black/50 to-transparent backdrop-blur-sm pointer-events-none">
        <div className="flex items-center justify-between px-4 py-3 pointer-events-auto">
          <div
            className="text-xl font-bold text-white cursor-pointer hover:text-white/80 transition-all duration-300 drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]"
            onClick={() => navigate('/')}
          >
            TicDia
          </div>
          <button 
            onClick={() => setIsOpen(true)} 
            className="bg-black/30 backdrop-blur-sm border border-white/20 text-white p-2.5 rounded-full hover:bg-black/40 transition-all"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {isOpen && <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsOpen(false)} />}

      <div className={`fixed top-0 right-0 h-full w-80 ${isDark ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-md z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-4 h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="text-xl font-bold text-tictok-red">TicDia</div>
          <button onClick={() => setIsOpen(false)} className={`p-2 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
              <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
            </button>
          </div>

          <div className="space-y-4">
            {menuItems.map((item, index) => <button key={index} onClick={item.onClick} className={item.className || `w-full flex items-center gap-3 p-3 rounded-lg ${item.isActive ? 'bg-tictok-red text-white' : isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} transition-colors`}>
                {item.userIcon ? <div className="w-5 h-5 bg-tictok-red rounded-full flex items-center justify-center text-xs text-white font-bold">
                    {item.userIcon}
                  </div> : item.icon && <item.icon className="w-5 h-5" />}
                <span className="text-left flex-1">{item.label}</span>
              </button>)}

            {/* Vote Button for Current Article */}
            {currentArticle && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'} opacity-60 mb-2`}>Vote on Article</div>
                <VoteButton 
                  articleId={currentArticle.id?.toString() || currentArticle.title}
                  articleTitle={currentArticle.title}
                  articleUrl={currentArticle.url}
                />
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'} opacity-60 mb-2`}>Language</div>
              <LanguageSelector />
            </div>
          </div>
        </div>
      </div>
    </>;
};
export default MobileMenu;