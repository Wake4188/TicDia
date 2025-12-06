import React, { useState } from 'react';
import { Search, Compass, User, Menu, X, ChevronRight, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { formatDate } from '../services/translations';
import LanguageSelector from './LanguageSelector';
import VoteButton from './VoteButton';
import { ThemeToggle } from './ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

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
  const { user, signOut } = useAuth();
  const { currentLanguage, translations } = useLanguage();
  const { theme } = useTheme();
  const { userPreferences } = useUserPreferences();
  const t = translations;
  const dateString = formatDate(new Date(), currentLanguage);
  const isDark = theme === 'dark';

  const handleNavigation = (path: string, action?: () => void) => {
    setIsOpen(false);
    if (action) action();
    else navigate(path);
  };

  const menuItems: Array<{
    label: string;
    path: string;
    style?: React.CSSProperties;
    icon?: React.ComponentType<{ className?: string }>;
    action?: () => void;
    isActive?: boolean;
    className?: string;
  }> = [
    {
      label: t.today || "Today",
      path: '/today',
      style: {
        backgroundColor: userPreferences.highlightColor,
        color: '#ffffff',
        boxShadow: `0 4px 14px 0 ${userPreferences.highlightColor}40`
      }
    },
    {
      icon: Search,
      label: searchValue || t.search,
      action: onSearchClick,
      path: ''
    },
    {
      icon: Compass,
      label: t.discover,
      path: '/discover',
      isActive: location.pathname === "/discover"
    },
    {
      icon: user ? User : User,
      label: user ? t.profile : t.signIn,
      path: user ? "/profile" : "/auth",
      isActive: location.pathname === "/profile" || location.pathname === "/auth"
    }
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent h-24" />
        <div className="relative flex items-center justify-between px-4 py-3 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-black tracking-tighter text-white cursor-pointer drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
            onClick={() => navigate('/')}
          >
            <span className="text-white">Tic</span>
            <span className="text-tictok-red">Dia</span>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white p-2.5 rounded-full hover:bg-white/20 transition-all shadow-lg"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </motion.button>
        </div>
      </div>

      {/* Menu Overlay & Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed top-0 right-0 h-full w-[85%] max-w-sm z-[71] overflow-hidden ${isDark ? 'bg-[#0f0f0f]/95' : 'bg-white/95'
                } backdrop-blur-2xl border-l border-white/10 shadow-2xl`}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Menu</h2>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(false)}
                    className={`p-2 rounded-full ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'}`}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                  {/* Date Display */}
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                    {dateString}
                  </div>

                  {/* Main Navigation */}
                  <div className="space-y-3">
                    {menuItems.map((item, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleNavigation(item.path, item.action)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group relative overflow-hidden ${item.className
                          ? item.className
                          : item.isActive
                            ? 'text-white shadow-lg'
                            : isDark
                              ? 'bg-white/5 text-white hover:bg-white/10'
                              : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                          }`}
                        style={item.style || (item.isActive ? {
                          backgroundColor: userPreferences.highlightColor,
                          boxShadow: `0 4px 14px 0 ${userPreferences.highlightColor}40`
                        } : undefined)}
                      >
                        {item.icon && <item.icon className="w-5 h-5" />}
                        <span className="flex-1 text-left font-semibold text-lg">{item.label}</span>
                        {!item.className && <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />}
                      </motion.button>
                    ))}
                  </div>

                  {/* Current Article Actions */}
                  {currentArticle && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
                    >
                      <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Current Article</div>
                      <VoteButton
                        articleId={currentArticle.id?.toString() || currentArticle.title}
                        articleTitle={currentArticle.title}
                        articleUrl={currentArticle.url}
                      />
                    </motion.div>
                  )}

                  {/* Settings Section */}
                  <div className="pt-4 border-t border-white/10 space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Appearance</span>
                      <ThemeToggle />
                    </div>

                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/5">
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Language</span>
                      <LanguageSelector />
                    </div>
                  </div>
                </div>

                {/* Footer / Sign Out */}
                {user && (
                  <div className="p-6 border-t border-white/5">
                    <button
                      onClick={() => {
                        signOut();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-medium"
                    >
                      <LogOut className="w-5 h-5" />
                      {t.signOut || "Sign Out"}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileMenu;