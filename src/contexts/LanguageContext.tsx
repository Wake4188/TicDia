
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../services/languageConfig';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load saved language preference from localStorage
    const savedLanguageCode = localStorage.getItem('wikitok-language');
    if (savedLanguageCode) {
      const foundLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === savedLanguageCode);
      if (foundLanguage) {
        setCurrentLanguage(foundLanguage);
      }
    }
  }, []);

  const setLanguage = (language: Language) => {
    setIsLoading(true);
    setCurrentLanguage(language);
    localStorage.setItem('wikitok-language', language.code);
    
    // Set document direction for RTL languages
    document.documentElement.dir = language.rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language.code;
    
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
