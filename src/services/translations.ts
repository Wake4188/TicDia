
// Translation service using RapidAPI
import { supabase } from '@/integrations/supabase/client';

// Base English translations that will be translated to other languages
export const translations = {
  en: {
    // Navigation
    search: "Search",
    today: "Today",
    discover: "Discover",
    profile: "Profile",
    random: "Random",
    signIn: "Sign In",
    
    // Today page
    todayHighlights: "Today's Highlights",
    latestNews: "Latest News",
    fromWikipedia: "From Wikipedia",
    editorialHighlights: "Editorial Highlights",
    addArticle: "Add Article",
    readMore: "Read more",
    readOn: "Read on",
    readArticle: "Read Article",
    refresh: "Refresh",
    justNow: "Just now",
    hoursAgo: "{hours}h ago",
    
    // New features translations
    topArticlesToday: "Top Articles Today", 
    dailyRankingResets: "Daily ranking resets at midnight",
    europeParisTime: "Europe/Paris time",
    apNews: "AP News",
    showAll: "Show All", 
    showLess: "Show Less",
    more: "more",
    backToHome: "Back to Home",
    
    // News sources
    nytNews: "NYT News",
    headlines: "Headlines",
    newsApiHeadlines: "NewsAPI Headlines",
    
    // Common
    loading: "Loading...",
    error: "Error",
    retry: "Retry",
    close: "Close",
    save: "Save",
    saved: "Saved",
    delete: "Delete",
    edit: "Edit",
    share: "Share",
    view: "View",
    
    // Categories
    categories: {
      all: "All",
      science: "Science",
      technology: "Technology", 
      history: "History",
      art: "Art",
      arts: "Arts",
      politics: "Politics",
      nature: "Nature",
      sports: "Sports",
      culture: "Culture",
      philosophy: "Philosophy",
      literature: "Literature"
    },
    
    // Profile page
    savedArticles: "Saved Articles",
    settings: "Settings",
    articles: "articles",
    article: "article",
    views: "views",
    
    // Discover page
    loadingDescription: "Loading amazing articles for you...",
    
    // Errors
    failedToLoad: "Failed to load news articles. Please try again later.",
    noArticlesAvailable: "No articles available from {source}",
    
    // Article form
    articleTitle: "Article Title",
    articleContent: "Article Content",
    articleUrl: "Article URL (optional)",
    addNewArticle: "Add New Article",
    
    // Profile page extras
    errorLoading: "Error loading saved articles",
    preferencesWarning: "Reading Preferences",
    preferencesWarningDesc: "These preferences sync across devices",
    removed: "Article removed",
    removedDesc: "Article removed from saved articles",
    errorRemoving: "Error removing article",
    cleared: "All articles cleared",
    clearedDesc: "All saved articles have been removed",
    errorClearing: "Error clearing articles",
    default: "Default",
    serif: "Serif",
    sansSerif: "Sans Serif",
    title: "Settings",
    yourSaved: "Your saved articles",
    clearAll: "Clear All",
    searchPlaceholder: "Search saved articles...",
    noMatch: "No articles match your search",
    noSaved: "No saved articles yet",
    tryDifferent: "Try different keywords",
    startSaving: "Start saving articles to see them here",
    savedOn: "Saved on",
    readingPreferences: "Reading Preferences",
    customize: "Customize your reading experience",
    syncedToCloud: "Synced to cloud",
    loadingPreferences: "Loading preferences...",
    articleFont: "Article Font",
    highlightColor: "Highlight Color",
    backgroundOpacity: "Background Opacity",
    backgroundOpacityDesc: "Adjust the transparency of article backgrounds",
    preview: "Preview",
    previewText: "This is how articles will look with your chosen settings",
    progressPreview: "Reading progress: 42% complete",
  }
};

// Cache for translations to avoid repeated API calls
const translationCache = new Map<string, string>();

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  // If target language is English, return original text
  if (targetLanguage === 'en') {
    return text;
  }

  // Check cache first
  const cacheKey = `${text}_${targetLanguage}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const { data, error } = await supabase.functions.invoke('translate', {
      body: {
        text,
        from: 'en',
        to: targetLanguage
      }
    });

    if (error) {
      console.error('Translation error:', error);
      return text; // Return original text as fallback
    }

    const translatedText = data?.translatedText || text;
    
    // Cache the translation
    translationCache.set(cacheKey, translatedText);
    
    return translatedText;
  } catch (error) {
    console.error('Translation service error:', error);
    return text; // Return original text as fallback
  }
};

// Translation utility functions
export const getTranslation = async (key: string, language: string = 'en', params?: Record<string, string | number>): Promise<string> => {
  const langData = translations.en;
  
  // Navigate through nested keys (e.g., "categories.science")
  const keys = key.split('.');
  let value: any = langData;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }
  
  let result = value || key;
  
  // Replace parameters if provided
  if (params && typeof result === 'string') {
    Object.entries(params).forEach(([param, val]) => {
      result = result.replace(`{${param}}`, String(val));
    });
  }

  // If language is not English and we have a result, translate it
  if (language !== 'en' && result && typeof result === 'string') {
    result = await translateText(result, language);
  }
  
  return result;
};

export const getTranslations = async (language: any = 'en'): Promise<any> => {
  const langCode = typeof language === 'object' ? language.code : language;
  
  if (langCode === 'en') {
    return translations.en;
  }

  // For non-English languages, we'll translate the common strings
  const baseTranslations = translations.en;
  const translatedData: any = {};

  // Translate top-level strings
  for (const [key, value] of Object.entries(baseTranslations)) {
    if (typeof value === 'string') {
      translatedData[key] = await translateText(value, langCode);
    } else if (typeof value === 'object' && value !== null) {
      translatedData[key] = {};
      // Translate nested objects
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (typeof nestedValue === 'string') {
          translatedData[key][nestedKey] = await translateText(nestedValue, langCode);
        } else {
          translatedData[key][nestedKey] = nestedValue;
        }
      }
    } else {
      translatedData[key] = value;
    }
  }

  return translatedData;
};

export const formatDate = (date: Date, language: any = 'en'): string => {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric'
  };
  
  const langCode = typeof language === 'object' ? language.code : language;
  const locale = langCode === 'en' ? 'en-US' : 
                 langCode === 'es' ? 'es-ES' :
                 langCode === 'fr' ? 'fr-FR' :
                 langCode === 'de' ? 'de-DE' : 'en-US';
  
  return new Intl.DateTimeFormat(locale, options).format(date);
};
