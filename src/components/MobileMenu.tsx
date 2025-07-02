
import React, { useState } from 'react';
import { Search, Compass, User, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getTranslations, formatDate } from '../services/translations';
import LanguageSelector from './LanguageSelector';

interface MobileMenuProps {
  onSearchClick: () => void;
  searchValue: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ onSearchClick, searchValue }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const { theme } = useTheme();
  const t = getTranslations(currentLanguage);

  const today = new Date();
  const dateString = formatDate(today, currentLanguage);

  const handleDiscoverClick = () => {
    setIsOpen(false);
    if (location.pathname === "/discover") {
      navigate("/");
    } else {
      navigate("/discover");
    }
  };

  const handleAuthClick = () => {
    setIsOpen(false);
    if (user) {
      navigate("/profile");
    } else {
      navigate("/auth");
    }
  };

  const handleTodayClick = () => {
    setIsOpen(false);
    navigate("/today");
  };

  const handleSearchClick = () => {
    setIsOpen(false);
    onSearchClick();
  };

  const menuBg = theme === 'dark' ? 'bg-black/95' : 'bg-white/95';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';

  return (
    <>
      {/* Menu Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className={`p-2 rounded-full ${theme === 'dark' ? 'bg-black/20 text-white' : 'bg-white/80 text-gray-700'}`}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsOpen(false)} />
      )}

      {/* Menu */}
      <div className={`fixed top-0 right-0 h-full w-80 ${menuBg} backdrop-blur-md z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-xl font-bold text-wikitok-red">WikTok</div>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
            >
              <X className={`w-5 h-5 ${textColor}`} />
            </button>
          </div>

          {/* Menu Items */}
          <div className="space-y-4">
            {/* Today's Date */}
            <button
              onClick={handleTodayClick}
              className="w-full bg-wikitok-red text-white px-4 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              {dateString}
            </button>

            {/* Search */}
            <button
              onClick={handleSearchClick}
              className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
            >
              <Search className={`w-5 h-5 ${textColor}`} />
              <span className={`${textColor} text-left flex-1`}>
                {searchValue || t.search}
              </span>
            </button>

            {/* Discover */}
            <button
              onClick={handleDiscoverClick}
              className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                location.pathname === "/discover" 
                  ? 'bg-wikitok-red text-white' 
                  : theme === 'dark' 
                    ? 'bg-white/10 hover:bg-white/20 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              } transition-colors`}
            >
              <Compass className="w-5 h-5" />
              <span className="text-left flex-1">{t.discover}</span>
            </button>

            {/* Profile/Auth */}
            <button
              onClick={handleAuthClick}
              className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
            >
              {user ? (
                <>
                  <div className="w-5 h-5 bg-wikitok-red rounded-full flex items-center justify-center text-xs text-white font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className={`${textColor} text-left flex-1`}>{t.profile}</span>
                </>
              ) : (
                <>
                  <User className={`w-5 h-5 ${textColor}`} />
                  <span className={`${textColor} text-left flex-1`}>{t.signIn}</span>
                </>
              )}
            </button>

            {/* Language Selector */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className={`text-sm ${textColor} opacity-60 mb-2`}>Language</div>
              <LanguageSelector />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
