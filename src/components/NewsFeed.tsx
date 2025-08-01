
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Calendar, Clock, Newspaper } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { fetchNewsApiHeadlines, NewsApiArticle } from "@/services/newsApiService";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/services/translations";

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

type NewsSource = "nyt" | "newsapi";

const NewsFeed = () => {
  const [nytArticles, setNytArticles] = useState<NYTArticle[]>([]);
  const [newsApiArticles, setNewsApiArticles] = useState<NewsApiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<NewsSource>("nyt");
  const { toast } = useToast();
  const { currentLanguage } = useLanguage();

  const t = (key: string, params?: Record<string, string | number>) => 
    getTranslation(key, currentLanguage.code, params);

  const NYT_API_KEY = "CgNmskY4a1yqFpXiTyLDXLVLNmfHV1D1";

  useEffect(() => {
    fetchAllNews();
  }, []);

  const fetchAllNews = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchNYTNews(), fetchNewsApiNews()]);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast({
        title: t('error'),
        description: t('failedToLoad'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNYTNews = async () => {
    try {
      const response = await fetch(
        `https://api.nytimes.com/svc/news/v3/content/all/all.json?api-key=${NYT_API_KEY}&limit=8`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch NYT news');
      }
      
      const data = await response.json();
      
      // Remove duplicates and set articles
      const articles = data.results || [];
      const uniqueArticles = articles.filter((article: NYTArticle, index: number, self: NYTArticle[]) => 
        index === self.findIndex(a => a.url === article.url)
      );
      setNytArticles(uniqueArticles);
    } catch (error) {
      console.error('Error fetching NYT news:', error);
      toast({
        title: t('error'),
        description: t('failedToLoadNews'),
        variant: "destructive"
      });
    }
  };

  const fetchNewsApiNews = async () => {
    try {
      const articles = await fetchNewsApiHeadlines();
      
      // Remove duplicates and set articles
      const uniqueArticles = articles.filter((article: NewsApiArticle, index: number, self: NewsApiArticle[]) => 
        index === self.findIndex(a => a.url === article.url)
      );
      setNewsApiArticles(uniqueArticles);
    } catch (error) {
      console.error('Error fetching NewsAPI headlines:', error);
      toast({
        title: t('error'),
        description: t('failedToLoadNews'),
        variant: "destructive"
      });
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
      <Card key={`nyt-${article.url}`} className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-colors group">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {getNYTImageUrl(article) && (
              <div className="w-full sm:w-32 h-32 sm:h-20 flex-shrink-0 overflow-hidden rounded">
                <img 
                  src={getNYTImageUrl(article)} 
                  alt={article.title}
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

  const renderNewsApiArticles = () => {
    // Remove duplicates based on URL
    const uniqueArticles = newsApiArticles.filter((article, index, self) => 
      index === self.findIndex(a => a.url === article.url)
    );
    
    return uniqueArticles.map((article, index) => (
      <Card key={`newsapi-${article.url}`} className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-colors group">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {article.urlToImage && (
              <div className="w-full sm:w-32 h-32 sm:h-20 flex-shrink-0 overflow-hidden rounded">
                <img 
                  src={article.urlToImage} 
                  alt={article.title}
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
                {article.description}
              </p>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(article.publishedAt)}
                  </span>
                  <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-medium">
                    {article.source.name}
                  </span>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild 
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/10"
                >
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1 text-xs"
                  >
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
          <Card key={i} className="bg-gray-900/50 border-gray-800 animate-pulse">
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

  const currentArticles = selectedSource === "nyt" ? nytArticles : newsApiArticles;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-300">{t('latestNews')}</h2>
        
        <div className="flex items-center gap-3">
          <Select value={selectedSource} onValueChange={(value: NewsSource) => setSelectedSource(value)}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="nyt" className="text-white focus:bg-gray-700">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-tictok-red" />
                  {t('nytNews')}
                </div>
              </SelectItem>
              <SelectItem value="newsapi" className="text-white focus:bg-gray-700">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-blue-400" />
                  {t('headlines')}
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
        {selectedSource === "nyt" ? renderNYTArticles() : renderNewsApiArticles()}
        
        {currentArticles.length === 0 && (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6 text-center">
              <p className="text-gray-400">
                {t('noArticlesAvailable', { source: selectedSource === "nyt" ? "NYT" : "NewsAPI" })}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
