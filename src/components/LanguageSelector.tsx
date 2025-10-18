
import React, { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../services/languageConfig';
import { useTheme } from '../contexts/ThemeContext';

const LanguageSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLanguage, setLanguage } = useLanguage();
  const { theme } = useTheme();

  const handleLanguageSelect = (language: typeof SUPPORTED_LANGUAGES[0]) => {
    setLanguage(language);
    setIsOpen(false);
  };

  const dropdownBg = theme === 'dark' ? 'bg-black/90 border-gray-700' : 'bg-white border-gray-200';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const hoverBg = theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${
          theme === 'dark' 
            ? 'bg-black/20 text-white hover:bg-black/40' 
            : 'bg-white/80 text-gray-700 hover:bg-white'
        }`}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm hidden sm:block">{currentLanguage.nativeName}</span>
        <span className="text-sm sm:hidden">{currentLanguage.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute bottom-full mb-2 left-0 w-64 rounded-lg border shadow-lg z-50 ${dropdownBg}`}>
            <div className="py-2 max-h-[60vh] overflow-y-auto">
              {SUPPORTED_LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language)}
                  className={`w-full px-4 py-2 text-left flex items-center justify-between ${textColor} ${hoverBg} transition-colors`}
                >
                  <div>
                    <div className="font-medium">{language.nativeName}</div>
                    <div className="text-sm opacity-60">{language.name}</div>
                  </div>
                  {currentLanguage.code === language.code && (
                    <Check className="w-4 h-4 text-wikitok-red" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
