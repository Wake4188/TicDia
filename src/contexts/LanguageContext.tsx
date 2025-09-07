
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../services/languageConfig';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  isLoading: boolean;
  translations: any;
  refreshTranslations: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

import { getTranslations } from '../services/translations';

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [translations, setTranslations] = useState<any>({});

  const loadTranslations = async (language: Language) => {
    try {
      setIsLoading(true);
      const translatedData = await getTranslations(language.code);
      setTranslations(translatedData);
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Fallback to English translations
      const fallbackData = await getTranslations('en');
      setTranslations(fallbackData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load saved language preference from localStorage
    const savedLanguageCode = localStorage.getItem('ticdia-language');
    if (savedLanguageCode) {
      const foundLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === savedLanguageCode);
      if (foundLanguage) {
        setCurrentLanguage(foundLanguage);
        loadTranslations(foundLanguage);
        return;
      }
    }
    // Load default language translations
    loadTranslations(DEFAULT_LANGUAGE);
  }, []);

  const setLanguage = async (language: Language) => {
    setIsLoading(true);
    setCurrentLanguage(language);
    localStorage.setItem('ticdia-language', language.code);
    
    // Set document direction for RTL languages
    document.documentElement.dir = language.rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language.code;
    
    await loadTranslations(language);
  };

  const refreshTranslations = async () => {
    await loadTranslations(currentLanguage);
  };

  return (
    <LanguageContext.Provider value={{ 
      currentLanguage, 
      setLanguage, 
      isLoading, 
      translations,
      refreshTranslations 
    }}>
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
