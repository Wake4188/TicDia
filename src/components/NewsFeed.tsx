import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Calendar, Clock, Newspaper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { useLanguage } from "@/contexts/LanguageContext";

interface NYTArticle {
  title: string;
  abstract: string;
  url: string;
  published_date: string;
  multimedia?: Array<{
    url: string;
    format: string;
    height: number;
    width: number;
    type: string;
    subtype: string;
    caption: string;
  }>;
  byline: string;
  section: string;
}

type NewsSource = "nyt" | "franceinfo" | "bbc";

interface RSSArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  image?: string;
  sourceName: string;
}

const NewsFeed = () => {
  const [nytArticles, setNytArticles] = useState<NYTArticle[]>([]);

  const [franceInfoArticles, setFranceInfoArticles] = useState<RSSArticle[]>([]);
  const [bbcArticles, setBbcArticles] = useState<RSSArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<NewsSource>("nyt");
  const { currentLanguage, translations } = useLanguage();

  const t = (key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.');
    let value = translations;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    let result = value || key;
    if (params && typeof result === 'string') {
      Object.entries(params).forEach(([param, val]) => {
        result = result.replace(`{${param}}`, String(val));
      });
    }
    return result;
  };

  useEffect(() => {
    fetchAllNews();
  }, []);

  const fetchAllNews = async () => {
    setLoading(true);
    // Fire all requests in parallel with Promise.allSettled to never fail entirely
    await Promise.allSettled([
      fetchNYTNews(),
      fetchFranceInfoRSS(),
      fetchBBCRSS(),
    ]);
    setLoading(false);
  };

  const fetchNYTNews = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-news', {
        body: { source: 'nyt' },
      });

      if (error) throw error;

      const articles = data || [];
      const uniqueArticles = articles.filter((article: NYTArticle, index: number, self: NYTArticle[]) =>
        index === self.findIndex(a => a.url === article.url)
      );
      setNytArticles(uniqueArticles);
    } catch (error) {
      console.error('Error fetching NYT news:', error);
    }
  };


  const fetchRSS = async (url: string): Promise<RSSArticle[]> => {
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error('RSS fetch failed');
    const text = await res.text();
    const xml = new DOMParser().parseFromString(text, 'application/xml');
    const items = Array.from(xml.querySelectorAll('item'));

    const getImage = (item: Element) => {
      const enclosure = item.querySelector('enclosure');
      if (enclosure?.getAttribute('type')?.startsWith('image/')) {
        return enclosure.getAttribute('url') || undefined;
      }
      const mediaContent = item.querySelector('media\\:content, content');
      if (mediaContent?.getAttribute('url')) return mediaContent.getAttribute('url') || undefined;
      const mediaThumb = item.querySelector('media\\:thumbnail');
      if (mediaThumb?.getAttribute('url')) return mediaThumb.getAttribute('url') || undefined;
      const imgInDesc = (item.querySelector('description')?.textContent || '').match(/<img[^>]+src="([^"]+)"/i);
      return imgInDesc ? imgInDesc[1] : undefined;
    };

    return items.map((item) => ({
      title: item.querySelector('title')?.textContent || 'Untitled',
      description: (item.querySelector('description')?.textContent || '').replace(/<[^>]+>/g, '').trim(),
      link: item.querySelector('link')?.textContent || '#',
      pubDate: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
      image: getImage(item),
      sourceName: '',
    }));
  };

  const fetchFranceInfoRSS = async () => {
    try {
      const items = await fetchRSS('https://www.franceinfo.fr/titres.rss');
      setFranceInfoArticles(items.map(i => ({ ...i, sourceName: 'France Info' })));
    } catch (e) {
      console.error('Error fetching France Info RSS:', e);
    }
  };

  const fetchBBCRSS = async () => {
    try {
      const items = await fetchRSS('https://feeds.bbci.co.uk/news/world/rss.xml');
      setBbcArticles(items.map(i => ({ ...i, sourceName: 'BBC' })));
    } catch (e) {
      console.error('Error fetching BBC RSS:', e);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return t('justNow');
    } else if (diffInHours < 24) {
      return t('hoursAgo', { hours: diffInHours });
    } else {
      return date.toLocaleDateString(currentLanguage.code, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getNYTImageUrl = (article: NYTArticle) => {
    const image = article.multimedia?.find(
      media => media.format === "mediumThreeByTwo440" || media.format === "superJumbo"
    );
    return image?.url;
  };

  const renderNYTArticles = () => {
    // Remove duplicates based on URL
    const uniqueArticles = nytArticles.filter((article, index, self) =>
      index === self.findIndex(a => a.url === article.url)
    );

    return uniqueArticles.map((article, index) => (
      <Card key={`nyt-${article.url}`} className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-colors group">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {getNYTImageUrl(article) && (
              <div className="w-full sm:w-32 h-32 sm:h-20 flex-shrink-0 overflow-hidden rounded">
                <img
                  src={getNYTImageUrl(article)}
                  alt={article.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-white mb-2 line-clamp-2 leading-tight">
                {article.title}
              </h3>

              <p className="text-gray-400 text-sm mb-3 line-clamp-2 leading-relaxed">
                {article.abstract}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(article.published_date)}
                  </span>
                  {article.section && (
                    <span className="px-2 py-1 bg-tictok-red/20 text-tictok-red rounded text-xs font-medium">
                      {article.section}
                    </span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-tictok-red hover:text-tictok-red/80 hover:bg-tictok-red/10"
                >
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs"
                  >
                    {t('readOn')} NYT <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };


  const renderRSSArticles = (articles: RSSArticle[], buttonClasses: string, sourceLabel: string) => {
    return articles.map((article) => (
      <Card key={`rss-${sourceLabel}-${article.link}`} className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-colors group">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {article.image && (
              <div className="w-full sm:w-32 h-32 sm:h-20 flex-shrink-0 overflow-hidden rounded">
                <img
                  src={article.image}
                  alt={article.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-white mb-2 line-clamp-2 leading-tight">{article.title}</h3>
              <p className="text-gray-400 text-sm mb-3 line-clamp-2 leading-relaxed">{article.description}</p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(article.pubDate)}
                  </span>
                  <span className="px-2 py-1 bg-gray-600/20 text-gray-300 rounded text-xs font-medium">{sourceLabel}</span>
                </div>
                <Button variant="ghost" size="sm" asChild className={buttonClasses}>
                  <a href={article.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs">
                    {t('readArticle')} <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-300">{t('latestNews')}</h2>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-white/5 backdrop-blur-md border-white/10 animate-pulse">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-32 h-20 bg-gray-700 rounded flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-full"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const currentArticles = selectedSource === "nyt"
    ? nytArticles
    : selectedSource === "franceinfo"
      ? franceInfoArticles
      : bbcArticles;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-300 flex items-center gap-2">
          {t('latestNews')}
        </h2>

        <div className="flex items-center gap-3">
          <Select value={selectedSource} onValueChange={(value: NewsSource) => setSelectedSource(value)}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 z-[100]" position="popper" side="top" sideOffset={5}>
              <SelectItem value="nyt" className="text-white focus:bg-gray-700">
                <div className="flex items-center gap-2">
                  <img src="/lovable-uploads/3a2edeb7-cd16-4493-a86a-5667a46f7870.png" alt="NYT" loading="lazy" className="w-4 h-4" />
                  {t('nytNews')}
                </div>
              </SelectItem>
              <SelectItem value="franceinfo" className="text-white focus:bg-gray-700">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-yellow-400" />
                  France Info
                </div>
              </SelectItem>
              <SelectItem value="bbc" className="text-white focus:bg-gray-700">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-red-400" />
                  BBC World
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAllNews}
            className="text-gray-400 hover:text-white"
          >
            <Clock className="w-4 h-4 mr-1" />
            {t('refresh')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {selectedSource === "nyt"
          ? renderNYTArticles()
          : selectedSource === "franceinfo"
            ? renderRSSArticles(franceInfoArticles, "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/10", "France Info")
            : renderRSSArticles(bbcArticles, "text-red-400 hover:text-red-300 hover:bg-red-900/10", "BBC World")
        }

        {currentArticles.length === 0 && (
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardContent className="p-6 text-center">
              <p className="text-gray-400">
                {t('noArticlesAvailable', { source: selectedSource === "nyt" ? "NYT" : selectedSource === "franceinfo" ? "France Info" : "BBC World" })}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
