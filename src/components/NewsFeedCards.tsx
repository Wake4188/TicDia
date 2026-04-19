import { useState, useEffect, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Newspaper, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface NYTArticle {
  title: string;
  abstract: string;
  url: string;
  published_date: string;
  multimedia?: Array<{ url: string; format: string }>;
  section?: string;
}

interface RSSArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  image?: string;
}

interface FeedSource {
  id: 'nyt' | 'bbc' | 'franceinfo';
  label: string;
  accent: string;
  badgeBg: string;
}

const SOURCES: FeedSource[] = [
  { id: 'nyt',        label: 'New York Times', accent: 'text-rose-400',   badgeBg: 'bg-rose-500/10 border-rose-500/20' },
  { id: 'bbc',        label: 'BBC World',      accent: 'text-red-400',    badgeBg: 'bg-red-500/10 border-red-500/20' },
  { id: 'franceinfo', label: 'France Info',    accent: 'text-amber-400',  badgeBg: 'bg-amber-500/10 border-amber-500/20' },
];

const fetchRSS = async (url: string): Promise<RSSArticle[]> => {
  const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error('RSS fetch failed');
  const text = await res.text();
  const xml = new DOMParser().parseFromString(text, 'application/xml');
  const items = Array.from(xml.querySelectorAll('item'));

  const getImage = (item: Element) => {
    const enclosure = item.querySelector('enclosure');
    if (enclosure?.getAttribute('type')?.startsWith('image/')) return enclosure.getAttribute('url') || undefined;
    const mediaContent = item.querySelector('media\\:content, content');
    if (mediaContent?.getAttribute('url')) return mediaContent.getAttribute('url') || undefined;
    const mediaThumb = item.querySelector('media\\:thumbnail');
    if (mediaThumb?.getAttribute('url')) return mediaThumb.getAttribute('url') || undefined;
    const imgInDesc = (item.querySelector('description')?.textContent || '').match(/<img[^>]+src="([^"]+)"/i);
    return imgInDesc ? imgInDesc[1] : undefined;
  };

  return items.slice(0, 12).map((item) => ({
    title: item.querySelector('title')?.textContent || 'Untitled',
    description: (item.querySelector('description')?.textContent || '').replace(/<[^>]+>/g, '').trim(),
    link: item.querySelector('link')?.textContent || '#',
    pubDate: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
    image: getImage(item),
  }));
};

const formatRelative = (dateString: string, langCode: string): string => {
  const date = new Date(dateString);
  const diffH = Math.floor((Date.now() - date.getTime()) / 3600_000);
  if (diffH < 1) return 'now';
  if (diffH < 24) return `${diffH}h`;
  return date.toLocaleDateString(langCode, { month: 'short', day: 'numeric' });
};

interface FeedColumnProps {
  source: FeedSource;
  articles: Array<{ title: string; description: string; link: string; pubDate: string; image?: string; section?: string }>;
  loading: boolean;
  onRefresh: () => void;
}

const FeedColumn = memo(({ source, articles, loading, onRefresh }: FeedColumnProps) => {
  const { currentLanguage } = useLanguage();

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 flex flex-col h-[520px] overflow-hidden">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0 border-b border-border/40">
        <CardTitle className={`text-base font-bold flex items-center gap-2 ${source.accent}`}>
          <Newspaper className="w-4 h-4" />
          {source.label}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={loading}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label={`Refresh ${source.label}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full">
          <ul className="divide-y divide-border/30">
            {loading && articles.length === 0
              ? Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="p-3 animate-pulse">
                    <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-2 bg-muted rounded w-1/2" />
                  </li>
                ))
              : articles.length === 0 ? (
                  <li className="p-6 text-center text-sm text-muted-foreground">No articles</li>
                ) : (
                  articles.map((a) => (
                    <li key={a.link} className="group">
                      <a
                        href={a.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex gap-3 p-3 hover:bg-muted/40 transition-colors"
                      >
                        {a.image && (
                          <img
                            src={a.image}
                            alt=""
                            loading="lazy"
                            className="w-14 h-14 object-cover rounded-md flex-shrink-0 bg-muted"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {a.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{formatRelative(a.pubDate, currentLanguage.code)}</span>
                            {a.section && (
                              <span className={`px-1.5 py-0.5 rounded ${source.badgeBg} ${source.accent} border text-[10px] font-medium`}>
                                {a.section}
                              </span>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                      </a>
                    </li>
                  ))
                )
            }
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});
FeedColumn.displayName = 'FeedColumn';

const NewsFeedCards = () => {
  const [nyt, setNyt] = useState<RSSArticle[]>([]);
  const [bbc, setBbc] = useState<RSSArticle[]>([]);
  const [fi, setFi] = useState<RSSArticle[]>([]);
  const [loadingNyt, setLoadingNyt] = useState(true);
  const [loadingBbc, setLoadingBbc] = useState(true);
  const [loadingFi, setLoadingFi] = useState(true);

  const loadNyt = async () => {
    setLoadingNyt(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-news', { body: { source: 'nyt' } });
      if (error) throw error;
      const articles = (data || []) as NYTArticle[];
      const unique = articles.filter((a, i, self) => i === self.findIndex(s => s.url === a.url));
      setNyt(unique.slice(0, 12).map(a => ({
        title: a.title,
        description: a.abstract,
        link: a.url,
        pubDate: a.published_date,
        image: a.multimedia?.find(m => m.format === 'mediumThreeByTwo440' || m.format === 'superJumbo')?.url,
      })));
    } catch (e) {
      console.error('NYT fetch failed:', e);
    } finally {
      setLoadingNyt(false);
    }
  };

  const loadBbc = async () => {
    setLoadingBbc(true);
    try {
      setBbc(await fetchRSS('https://feeds.bbci.co.uk/news/world/rss.xml'));
    } catch (e) {
      console.error('BBC fetch failed:', e);
    } finally {
      setLoadingBbc(false);
    }
  };

  const loadFi = async () => {
    setLoadingFi(true);
    try {
      setFi(await fetchRSS('https://www.franceinfo.fr/titres.rss'));
    } catch (e) {
      console.error('France Info fetch failed:', e);
    } finally {
      setLoadingFi(false);
    }
  };

  useEffect(() => {
    // Parallel load — never block on a single source
    loadNyt();
    loadBbc();
    loadFi();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <FeedColumn source={SOURCES[0]} articles={nyt} loading={loadingNyt} onRefresh={loadNyt} />
      <FeedColumn source={SOURCES[1]} articles={bbc} loading={loadingBbc} onRefresh={loadBbc} />
      <FeedColumn source={SOURCES[2]} articles={fi}  loading={loadingFi}  onRefresh={loadFi} />
    </div>
  );
};

export default memo(NewsFeedCards);
