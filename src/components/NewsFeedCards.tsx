import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Calendar, RefreshCw, Settings2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import SourceLogo from "@/components/news/SourceLogo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

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
  id: 'nyt' | 'bbc' | 'custom';
  label: string;
  accent: string;
  badgeBg: string;
}

const STATIC_SOURCES: FeedSource[] = [
  { id: 'nyt', label: 'New York Times', accent: 'text-rose-400', badgeBg: 'bg-rose-500/10 border-rose-500/20' },
  { id: 'bbc', label: 'BBC World',      accent: 'text-red-400',  badgeBg: 'bg-red-500/10 border-red-500/20' },
];

// Skeleton row template — allocated once at module scope
const SKELETON_ITEMS = Array.from({ length: 5 });

// Default custom slot = France Info (preserves prior behavior)
const DEFAULT_CUSTOM = {
  label: 'France Info',
  url: 'https://www.franceinfo.fr/titres.rss',
};

const STORAGE_KEY = 'ticdia_custom_rss_v1';

interface CustomFeed {
  label: string;
  url: string;
}

const loadCustomFeed = (): CustomFeed => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.url === 'string' && typeof parsed.label === 'string') {
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return DEFAULT_CUSTOM;
};

const fetchRSS = async (url: string, source: string): Promise<RSSArticle[]> => {
  const { data, error } = await supabase.functions.invoke('rss-feed', {
    body: { url, source },
  });
  if (error) throw error;
  const items = (data || []) as Array<{
    title: string;
    summary: string;
    link: string;
    image?: string;
    publishedAt: string;
  }>;
  return items.slice(0, 12).map((a) => ({
    title: a.title,
    description: a.summary,
    link: a.link,
    pubDate: a.publishedAt,
    image: a.image,
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
  onEdit?: () => void;
}

const FeedColumn = memo(({ source, articles, loading, onRefresh, onEdit }: FeedColumnProps) => {
  const { currentLanguage } = useLanguage();

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 flex flex-col h-[520px] overflow-hidden">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0 border-b border-border/40 gap-2">
        <CardTitle className={`text-base font-bold flex items-center gap-2.5 min-w-0 ${source.accent}`}>
          <SourceLogo source={source.id} />
          <span className="truncate">{source.label}</span>
        </CardTitle>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label={`Configure ${source.label}`}
            >
              <Settings2 className="w-3.5 h-3.5" />
            </Button>
          )}
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
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full">
          <ul className="divide-y divide-border/30">
            {loading && articles.length === 0
              ? SKELETON_ITEMS.map((_, i) => (
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
                            decoding="async"
                            width={56}
                            height={56}
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
  const { toast } = useToast();
  const [nyt, setNyt] = useState<RSSArticle[]>([]);
  const [bbc, setBbc] = useState<RSSArticle[]>([]);
  const [custom, setCustom] = useState<RSSArticle[]>([]);
  const [loadingNyt, setLoadingNyt] = useState(true);
  const [loadingBbc, setLoadingBbc] = useState(true);
  const [loadingCustom, setLoadingCustom] = useState(true);

  const [customFeed, setCustomFeed] = useState<CustomFeed>(() => loadCustomFeed());
  const [editorOpen, setEditorOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState(customFeed.url);
  const [draftLabel, setDraftLabel] = useState(customFeed.label);

  const customSource = useMemo<FeedSource>(() => ({
    id: 'custom',
    label: customFeed.label || 'Custom Feed',
    accent: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/20',
  }), [customFeed.label]);

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
      setBbc(await fetchRSS('https://feeds.bbci.co.uk/news/world/rss.xml', 'BBC World'));
    } catch (e) {
      console.error('BBC fetch failed:', e);
    } finally {
      setLoadingBbc(false);
    }
  };

  const loadCustom = async (feed: CustomFeed = customFeed) => {
    setLoadingCustom(true);
    try {
      setCustom(await fetchRSS(feed.url, feed.label));
    } catch (e: any) {
      console.error('Custom feed fetch failed:', e);
      setCustom([]);
      toast({
        title: 'Could not load feed',
        description: e?.message || 'The RSS feed could not be fetched. Check the URL.',
        variant: 'destructive',
      });
    } finally {
      setLoadingCustom(false);
    }
  };

  const refreshCustom = useCallback(() => loadCustom(customFeed), [customFeed]);

  useEffect(() => {
    loadNyt();
    loadBbc();
    loadCustom(customFeed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEditor = () => {
    setDraftUrl(customFeed.url);
    setDraftLabel(customFeed.label);
    setEditorOpen(true);
  };

  const handleSave = async () => {
    const url = draftUrl.trim();
    const label = draftLabel.trim() || 'Custom Feed';
    if (!url) {
      toast({ title: 'URL required', description: 'Enter a valid RSS feed URL.', variant: 'destructive' });
      return;
    }
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Only http:// and https:// URLs are supported.');
      }
    } catch (e: any) {
      toast({ title: 'Invalid URL', description: e?.message || 'That URL looks invalid.', variant: 'destructive' });
      return;
    }
    const next = { url, label };
    setCustomFeed(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setEditorOpen(false);
    loadCustom(next);
  };

  const handleReset = () => {
    setCustomFeed(DEFAULT_CUSTOM);
    setDraftUrl(DEFAULT_CUSTOM.url);
    setDraftLabel(DEFAULT_CUSTOM.label);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    loadCustom(DEFAULT_CUSTOM);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeedColumn source={STATIC_SOURCES[0]} articles={nyt} loading={loadingNyt} onRefresh={loadNyt} />
        <FeedColumn source={STATIC_SOURCES[1]} articles={bbc} loading={loadingBbc} onRefresh={loadBbc} />
        <FeedColumn
          source={customSource}
          articles={custom}
          loading={loadingCustom}
          onRefresh={refreshCustom}
          onEdit={openEditor}
        />
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border">
          <DialogHeader>
            <DialogTitle>Customize feed</DialogTitle>
            <DialogDescription>
              Paste any public RSS or Atom feed URL. It will replace the third column on the Today page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rss-label">Feed name</Label>
              <Input
                id="rss-label"
                value={draftLabel}
                onChange={(e) => setDraftLabel(e.target.value)}
                placeholder="e.g. The Verge"
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rss-url">RSS URL</Label>
              <Input
                id="rss-url"
                value={draftUrl}
                onChange={(e) => setDraftUrl(e.target.value)}
                placeholder="https://example.com/feed.xml"
                type="url"
              />
            </div>
          </div>
          <DialogFooter className="flex sm:justify-between gap-2">
            <Button variant="ghost" onClick={handleReset} className="text-muted-foreground">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to default
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default memo(NewsFeedCards);
