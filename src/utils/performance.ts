// Performance optimization utilities

// Debounce function for scroll events
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for high-frequency events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Image lazy loading optimization
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Bundle size optimization - dynamic import helper
export const loadComponent = <T>(
  importFunc: () => Promise<{ default: T }>
): Promise<T> => {
  return importFunc().then(module => module.default);
};

// Cache utility with TTL and localStorage persistence
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private readonly storagePrefix = 'ticdia_cache_';

  constructor() {
    // Load from localStorage on initialization
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          const item = JSON.parse(localStorage.getItem(key) || '');
          const cacheKey = key.replace(this.storagePrefix, '');
          if (Date.now() - item.timestamp < item.ttl) {
            this.cache.set(cacheKey, item);
          } else {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  set<T>(key: string, data: T, ttl: number = 600000): void { // Default 10 minutes
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    this.cache.set(key, item);
    
    // Persist to localStorage for longer caching
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storagePrefix + key, JSON.stringify(item));
      } catch (error) {
        console.warn('Failed to persist cache to storage:', error);
      }
    }
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      // Try to load from localStorage
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(this.storagePrefix + key);
          if (stored) {
            const item = JSON.parse(stored);
            if (Date.now() - item.timestamp < item.ttl) {
              this.cache.set(key, item);
              return item.data;
            } else {
              localStorage.removeItem(this.storagePrefix + key);
            }
          }
        } catch (error) {
          console.warn('Failed to load from storage:', error);
        }
      }
      return null;
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.storagePrefix + key);
      }
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  size(): number {
    return this.cache.size;
  }
}

export const cache = new CacheManager();

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void): void => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds.`);
  } else {
    fn();
  }
};

// Service worker registration for PWA
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered');
    } catch (error) {
      console.log('SW registration failed');
    }
  }
};

// Critical resource hints - only add dns-prefetch for non-critical origins
// (preconnects are already in index.html to avoid duplicates)
export const addResourceHints = (): void => {
  if (typeof document === 'undefined') return;

  const hints = [
    { rel: 'dns-prefetch', href: 'https://dictionaryapi.com' },
  ];

  hints.forEach(({ rel, href }) => {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    document.head.appendChild(link);
  });
};