import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
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
const NYTNewsFeed = () => {
  const [articles, setArticles] = useState<NYTArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const NYT_API_KEY = "CgNmskY4a1yqFpXiTyLDXLVLNmfHV1D1";
  useEffect(() => {
    fetchNews();
  }, []);
  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://api.nytimes.com/svc/news/v3/content/all/all.json?api-key=${NYT_API_KEY}&limit=8`);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await response.json();
      setArticles(data.results || []);
    } catch (error) {
      console.error('Error fetching NYT news:', error);
      toast({
        title: "Error",
        description: "Failed to load news articles. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };
  const getImageUrl = (article: NYTArticle) => {
    const image = article.multimedia?.find(media => media.format === "mediumThreeByTwo440" || media.format === "superJumbo");
    return image?.url;
  };
  if (loading) {
    return <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-300">Latest News</h2>
        {[...Array(3)].map((_, i) => <Card key={i} className="bg-gray-900/50 border-gray-800 animate-pulse">
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
          </Card>)}
      </div>;
  }
  return <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-300">Latest News From NYT</h2>
        <Button variant="ghost" size="sm" onClick={fetchNews} className="text-gray-400 hover:text-white">
          <Clock className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      <div className="grid gap-4">
        {articles.map((article, index) => <Card key={`${article.url}-${index}`} className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-colors group">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {getImageUrl(article) && <div className="w-full sm:w-32 h-32 sm:h-20 flex-shrink-0 overflow-hidden rounded">
                    <img src={getImageUrl(article)} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => {
                e.currentTarget.style.display = 'none';
              }} />
                  </div>}
                
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
                        {article.section && <span className="px-2 py-1 bg-wikitok-red/20 text-wikitok-red rounded text-xs font-medium">
                            {article.section}
                          </span>}
                      </div>
                      
                      <Button variant="ghost" size="sm" asChild className="text-wikitok-red hover:text-wikitok-red/80 hover:bg-wikitok-red/10">
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs">
                          Read on NYT <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>)}
      </div>

    </div>;
};
export default NYTNewsFeed;