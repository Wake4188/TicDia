import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createUserAnalytics, getUserAnalytics, incrementArticleView, updateScrollDistance } from '@/services/analyticsService';

export const useAnalyticsTracking = () => {
  const { user } = useAuth();
  const lastScrollY = useRef(0);
  const scrollAccumulator = useRef(0);

  useEffect(() => {
    if (!user) return;

    // Initialize user analytics if not exists
    const initializeAnalytics = async () => {
      try {
        const existing = await getUserAnalytics(user.id);
        if (!existing) {
          await createUserAnalytics(user.id);
        }
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
      }
    };

    initializeAnalytics();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);
      
      scrollAccumulator.current += scrollDelta;
      lastScrollY.current = currentScrollY;

      // Update scroll distance every 100 pixels to avoid too frequent API calls
      if (scrollAccumulator.current >= 100) {
        updateScrollDistance(user.id, scrollAccumulator.current);
        scrollAccumulator.current = 0;
      }
    };

    const throttledScroll = throttle(handleScroll, 100);
    window.addEventListener('scroll', throttledScroll);

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      // Save any remaining scroll distance
      if (scrollAccumulator.current > 0) {
        updateScrollDistance(user.id, scrollAccumulator.current);
      }
    };
  }, [user]);

  const trackArticleView = (articleTags?: string[]) => {
    if (!user) return;
    incrementArticleView(user.id, articleTags);
  };

  return {
    trackArticleView
  };
};

// Simple throttle function
function throttle(func: Function, limit: number) {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}