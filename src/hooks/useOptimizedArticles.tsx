import { useQuery } from '@tanstack/react-query';
import { getRandomArticles, searchArticles } from '@/services/wikipediaService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

interface UseOptimizedArticlesOptions {
  searchQuery?: string;
  initialCount?: number;
}

export const useOptimizedArticles = ({ 
  searchQuery, 
  initialCount = 2 
}: UseOptimizedArticlesOptions = {}) => {
  const { currentLanguage, isLoading: languageLoading } = useLanguage();
  const { userPreferences } = useUserPreferences();

  return useQuery({
    queryKey: ['articles', searchQuery, currentLanguage.code, initialCount, userPreferences.allowAdultContent],
    queryFn: async () => {
      if (searchQuery) {
        const results = await searchArticles(searchQuery, currentLanguage, userPreferences.allowAdultContent);
        return results.slice(0, initialCount);
      }
      return getRandomArticles(initialCount, undefined, currentLanguage, userPreferences.allowAdultContent);
    },
    enabled: !languageLoading,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
