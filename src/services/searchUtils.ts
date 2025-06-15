
export interface SearchResult {
  title: string;
  content: string;
  relevanceScore: number;
  matchType: 'title' | 'content' | 'partial';
}

export const calculateRelevanceScore = (query: string, title: string, content: string): number => {
  const queryLower = query.toLowerCase();
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  
  let score = 0;
  
  // Exact title match gets highest score
  if (titleLower === queryLower) {
    score += 100;
  }
  // Title starts with query
  else if (titleLower.startsWith(queryLower)) {
    score += 80;
  }
  // Title contains query
  else if (titleLower.includes(queryLower)) {
    score += 60;
  }
  
  // Content relevance
  const queryWords = queryLower.split(' ').filter(word => word.length > 2);
  queryWords.forEach(word => {
    // Title word matches
    if (titleLower.includes(word)) {
      score += 20;
    }
    // Content word matches
    if (contentLower.includes(word)) {
      score += 10;
    }
  });
  
  // Boost score for shorter titles (more specific)
  if (title.length < 50) {
    score += 10;
  }
  
  // Penalize very long content (less focused)
  if (content.length > 500) {
    score -= 5;
  }
  
  return score;
};

export const sortByRelevance = (articles: any[], query: string) => {
  return articles
    .map(article => ({
      ...article,
      relevanceScore: calculateRelevanceScore(query, article.title, article.content)
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .filter(article => article.relevanceScore > 0);
};
