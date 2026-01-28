import { supabase } from "@/integrations/supabase/client";
import { WikipediaArticle } from "./types";

// =============================================
// TYPES
// =============================================
export interface FeedCurationRule {
  article_id: string;
  article_title: string;
  curation_type: 'pinned' | 'promoted' | 'demoted' | 'hidden';
  priority: number;
}

export interface ContentRule {
  rule_type: 'blacklist' | 'whitelist';
  target_type: 'topic' | 'category' | 'keyword' | 'source';
  target_value: string;
}

export interface ModerationItem {
  content_id: string;
  is_hidden: boolean;
}

// =============================================
// CACHE
// =============================================
let feedCurationCache: FeedCurationRule[] | null = null;
let contentRulesCache: ContentRule[] | null = null;
let moderationCache: Map<string, boolean> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

const refreshCacheIfNeeded = async (): Promise<void> => {
  const now = Date.now();
  if (now - cacheTimestamp < CACHE_TTL && feedCurationCache && contentRulesCache && moderationCache) {
    return;
  }

  try {
    // Fetch all rules in parallel
    const [curationResult, rulesResult, moderationResult] = await Promise.all([
      supabase
        .from('feed_curation')
        .select('article_id, article_title, curation_type, priority')
        .eq('is_active', true),
      supabase
        .from('content_rules')
        .select('rule_type, target_type, target_value')
        .eq('is_active', true),
      supabase
        .from('content_moderation')
        .select('content_id, is_hidden')
        .eq('is_hidden', true)
    ]);

    feedCurationCache = (curationResult.data || []) as FeedCurationRule[];
    contentRulesCache = (rulesResult.data || []) as ContentRule[];
    
    // Build moderation map for quick lookup
    moderationCache = new Map();
    (moderationResult.data || []).forEach((item: ModerationItem) => {
      moderationCache!.set(item.content_id, item.is_hidden);
    });

    cacheTimestamp = now;
  } catch (error) {
    console.error('Failed to refresh feed filtering cache:', error);
    // Initialize empty caches on error to prevent repeated failures
    feedCurationCache = feedCurationCache || [];
    contentRulesCache = contentRulesCache || [];
    moderationCache = moderationCache || new Map();
  }
};

// =============================================
// FILTERING FUNCTIONS
// =============================================

/**
 * Check if an article should be hidden based on moderation
 */
const isArticleHidden = (articleId: string | number): boolean => {
  if (!moderationCache) return false;
  return moderationCache.get(String(articleId)) === true;
};

/**
 * Check if an article matches blacklist rules
 */
const matchesBlacklistRules = (article: WikipediaArticle): boolean => {
  if (!contentRulesCache) return false;

  const blacklistRules = contentRulesCache.filter(r => r.rule_type === 'blacklist');
  
  for (const rule of blacklistRules) {
    const targetValue = rule.target_value.toLowerCase();
    
    switch (rule.target_type) {
      case 'keyword':
        // Check if keyword appears in title or content
        if (
          article.title.toLowerCase().includes(targetValue) ||
          article.content.toLowerCase().includes(targetValue)
        ) {
          return true;
        }
        break;
      case 'category':
      case 'topic':
        // Check if any tag matches
        if (article.tags.some(tag => tag.toLowerCase().includes(targetValue))) {
          return true;
        }
        break;
      case 'source':
        // Check language/source
        if (article.language?.toLowerCase() === targetValue) {
          return true;
        }
        break;
    }
  }
  
  return false;
};

/**
 * Get curation info for an article
 */
const getCurationInfo = (articleId: string | number): FeedCurationRule | null => {
  if (!feedCurationCache) return null;
  return feedCurationCache.find(c => c.article_id === String(articleId)) || null;
};

/**
 * Apply admin rules to filter and sort articles
 */
export const applyAdminRules = async (articles: WikipediaArticle[]): Promise<WikipediaArticle[]> => {
  await refreshCacheIfNeeded();

  // Filter out hidden and blacklisted articles
  let filteredArticles = articles.filter(article => {
    // Check moderation (shadow-hidden)
    if (isArticleHidden(article.id)) {
      return false;
    }
    
    // Check blacklist rules
    if (matchesBlacklistRules(article)) {
      return false;
    }
    
    return true;
  });

  // Apply curation (pinned, promoted, demoted, hidden)
  const pinnedArticles: WikipediaArticle[] = [];
  const promotedArticles: WikipediaArticle[] = [];
  const normalArticles: WikipediaArticle[] = [];
  const demotedArticles: WikipediaArticle[] = [];

  for (const article of filteredArticles) {
    const curation = getCurationInfo(article.id);
    
    if (!curation) {
      normalArticles.push(article);
      continue;
    }
    
    switch (curation.curation_type) {
      case 'hidden':
        // Skip hidden articles
        break;
      case 'pinned':
        pinnedArticles.push({ ...article, relevanceScore: 1000 + curation.priority });
        break;
      case 'promoted':
        promotedArticles.push({ ...article, relevanceScore: 500 + curation.priority });
        break;
      case 'demoted':
        demotedArticles.push({ ...article, relevanceScore: -curation.priority });
        break;
      default:
        normalArticles.push(article);
    }
  }

  // Sort each category by priority
  pinnedArticles.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  promotedArticles.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  // Combine in order: pinned first, then promoted, then normal, then demoted
  return [...pinnedArticles, ...promotedArticles, ...normalArticles, ...demotedArticles];
};

/**
 * Get pinned articles that should appear at the top of the feed
 */
export const getPinnedArticles = async (): Promise<FeedCurationRule[]> => {
  await refreshCacheIfNeeded();
  
  if (!feedCurationCache) return [];
  
  return feedCurationCache
    .filter(c => c.curation_type === 'pinned')
    .sort((a, b) => b.priority - a.priority);
};

/**
 * Clear the cache (useful after admin makes changes)
 */
export const clearFeedFilteringCache = (): void => {
  feedCurationCache = null;
  contentRulesCache = null;
  moderationCache = null;
  cacheTimestamp = 0;
};
