// Service to check if words have Wikipedia articles

const cache = new Map<string, boolean>();

export async function checkWikipediaExists(word: string, langCode: string = 'en'): Promise<boolean> {
  const cacheKey = `${langCode}:${word.toLowerCase()}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }
  
  try {
    const domain = langCode === 'en' ? 'en.wikipedia.org' : `${langCode}.wikipedia.org`;
    const response = await fetch(
      `https://${domain}/w/api.php?action=query&titles=${encodeURIComponent(word)}&format=json&origin=*`
    );
    
    if (!response.ok) {
      cache.set(cacheKey, false);
      return false;
    }
    
    const data = await response.json();
    const pages = data.query?.pages;
    
    // Check if the page exists (no "-1" key which indicates missing)
    const exists = pages && !pages["-1"];
    cache.set(cacheKey, exists);
    return exists;
  } catch {
    cache.set(cacheKey, false);
    return false;
  }
}

// Batch check multiple words (more efficient)
export async function batchCheckWikipedia(words: string[], langCode: string = 'en'): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  const toCheck: string[] = [];
  
  // Check cache first
  for (const word of words) {
    const cacheKey = `${langCode}:${word.toLowerCase()}`;
    if (cache.has(cacheKey)) {
      results.set(word.toLowerCase(), cache.get(cacheKey)!);
    } else {
      toCheck.push(word);
    }
  }
  
  if (toCheck.length === 0) {
    return results;
  }
  
  // Batch check in groups of 50 (Wikipedia API limit)
  const batches: string[][] = [];
  for (let i = 0; i < toCheck.length; i += 50) {
    batches.push(toCheck.slice(i, i + 50));
  }
  
  for (const batch of batches) {
    try {
      const domain = langCode === 'en' ? 'en.wikipedia.org' : `${langCode}.wikipedia.org`;
      const titles = batch.join('|');
      const response = await fetch(
        `https://${domain}/w/api.php?action=query&titles=${encodeURIComponent(titles)}&format=json&origin=*`
      );
      
      if (response.ok) {
        const data = await response.json();
        const pages = data.query?.pages || {};
        
        // Get normalized titles mapping
        const normalized = new Map<string, string>();
        for (const norm of (data.query?.normalized || [])) {
          normalized.set(norm.from.toLowerCase(), norm.to);
        }
        
        // Check each page
        for (const [pageId, page] of Object.entries(pages)) {
          const pageData = page as { title: string; missing?: boolean };
          const exists = pageId !== "-1" && !pageData.missing;
          const title = pageData.title.toLowerCase();
          
          cache.set(`${langCode}:${title}`, exists);
          results.set(title, exists);
          
          // Also set for original word if it was normalized
          for (const [from, to] of normalized) {
            if (to.toLowerCase() === title) {
              cache.set(`${langCode}:${from}`, exists);
              results.set(from, exists);
            }
          }
        }
        
        // Mark words not found as false
        for (const word of batch) {
          const lower = word.toLowerCase();
          if (!results.has(lower)) {
            cache.set(`${langCode}:${lower}`, false);
            results.set(lower, false);
          }
        }
      }
    } catch {
      // Mark all as false on error
      for (const word of batch) {
        const lower = word.toLowerCase();
        cache.set(`${langCode}:${lower}`, false);
        results.set(lower, false);
      }
    }
  }
  
  return results;
}
