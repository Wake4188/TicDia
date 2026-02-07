// Wikipedia "On This Day" and "Did You Know" (random facts) service

export interface OnThisDayEvent {
  text: string;
  year: number;
  pages: {
    title: string;
    description?: string;
    extract?: string;
    thumbnail?: {
      source: string;
      width: number;
      height: number;
    };
    content_urls?: {
      desktop?: { page: string };
      mobile?: { page: string };
    };
  }[];
}

export interface OnThisDayResponse {
  events: OnThisDayEvent[];
  births: OnThisDayEvent[];
  deaths: OnThisDayEvent[];
  holidays: { text: string; pages: OnThisDayEvent['pages'] }[];
}

export interface RandomFact {
  title: string;
  extract: string;
  description?: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  content_urls?: {
    desktop?: { page: string };
    mobile?: { page: string };
  };
}

const onThisDayCache = new Map<string, OnThisDayResponse>();
const randomFactsCache = new Map<string, RandomFact[]>();

export async function fetchOnThisDay(month?: number, day?: number): Promise<OnThisDayResponse | null> {
  const now = new Date();
  const mm = String(month ?? now.getMonth() + 1).padStart(2, '0');
  const dd = String(day ?? now.getDate()).padStart(2, '0');
  const cacheKey = `${mm}-${dd}`;

  if (onThisDayCache.has(cacheKey)) {
    return onThisDayCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/${mm}/${dd}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) return null;

    const data = await response.json();

    const result: OnThisDayResponse = {
      events: (data.events || []).slice(0, 20),
      births: (data.births || []).slice(0, 15),
      deaths: (data.deaths || []).slice(0, 15),
      holidays: (data.holidays || []).slice(0, 10),
    };

    onThisDayCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Failed to fetch On This Day data:', error);
    return null;
  }
}

export async function fetchRandomFacts(count: number = 8): Promise<RandomFact[]> {
  const today = new Date().toISOString().split('T')[0];

  if (randomFactsCache.has(today) && (randomFactsCache.get(today)?.length || 0) >= count) {
    return randomFactsCache.get(today)!.slice(0, count);
  }

  try {
    const promises = Array.from({ length: count }, () =>
      fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary', {
        headers: { 'Accept': 'application/json' },
      }).then(r => r.ok ? r.json() : null).catch(() => null)
    );

    const results = await Promise.allSettled(promises);
    const facts: RandomFact[] = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
      .map(r => ({
        title: r.value.title || '',
        extract: r.value.extract || '',
        description: r.value.description || '',
        thumbnail: r.value.thumbnail || undefined,
        content_urls: r.value.content_urls || undefined,
      }))
      .filter(f => f.extract.length > 50); // Filter out stubs

    randomFactsCache.set(today, facts);
    return facts;
  } catch (error) {
    console.error('Failed to fetch random facts:', error);
    return [];
  }
}
