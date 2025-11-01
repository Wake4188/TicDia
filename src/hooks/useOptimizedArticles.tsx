import { useQuery } from '@tanstack/react-query';
import { getRandomArticles, searchArticles } from '@/services/wikipediaService';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseOptimizedArticlesOptions {
  searchQuery?: string;
  initialCount?: number;
}

export const useOptimizedArticles = ({ 
  searchQuery, 
  initialCount = 2 
}: UseOptimizedArticlesOptions = {}) => {
  const { currentLanguage, isLoading: languageLoading } = useLanguage();

  return useQuery({
    queryKey: ['articles', searchQuery, currentLanguage.code, initialCount],
    queryFn: async () => {
      if (searchQuery) {
        const results = await searchArticles(searchQuery, currentLanguage);
        return results.slice(0, initialCount);
      }
      return getRandomArticles(initialCount, undefined, currentLanguage);
    },
    enabled: !languageLoading,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
