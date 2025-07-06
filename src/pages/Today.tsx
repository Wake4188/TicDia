import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, ExternalLink, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import LittleWik from "@/components/LittleWik";
import NewsFeed from "@/components/NewsFeed";
import { useNavigate } from "react-router-dom";
import { useUserPreferences } from "@/hooks/useUserPreferences";

interface TodayArticle {
  id: string;
  title: string;
  content: string;
  url: string;
  created_at: string;
  is_admin_added: boolean;
}

interface WikipediaArticle {
  title: string;
  extract: string;
  fullurl: string;
}

const Today = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Load user preferences to apply highlight color
  useUserPreferences();
  const [isAddingArticle, setIsAddingArticle] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: "", content: "", url: "" });
  const [wikipediaArticles, setWikipediaArticles] = useState<WikipediaArticle[]>([]);
  const [littleWikOpen, setLittleWikOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<{ article_title: string; article_url: string } | null>(null);

  // Check if user is admin
  const isAdmin = user?.email === "jessica.wilhide@gmail.com";

  // Get today's date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Fetch admin articles
  const { data: adminArticles, refetch } = useQuery({
    queryKey: ["todayArticles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('today_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TodayArticle[];
    },
  });

  // Fetch Wikipedia articles on component mount
  useEffect(() => {
    fetchWikipediaArticles();
  }, []);

  const fetchWikipediaArticles = async () => {
    try {
      // Get current events from Wikipedia
      const currentDate = new Date();
      const month = currentDate.toLocaleString('en-US', { month: 'long' });
      const day = currentDate.getDate();
      
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${month}_${day}`
      );
      
      if (!response.ok) {
        // Fallback to "Current events" page
        const fallbackResponse = await fetch(
          'https://en.wikipedia.org/api/rest_v1/page/summary/Current_events'
        );
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          setWikipediaArticles([{
            title: data.title,
            extract: data.extract,
            fullurl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`
          }]);
        }
        return;
      }
      
      const data = await response.json();
      setWikipediaArticles([{
        title: data.title,
        extract: data.extract,
        fullurl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`
      }]);
      
      // Try to get more current events
      const eventsResponse = await fetch(
        'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&titles=Portal:Current_events&origin=*'
      );
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        const pages = eventsData.query?.pages;
        if (pages) {
          const pageIds = Object.keys(pages);
          pageIds.forEach(pageId => {
            const page = pages[pageId];
            if (page.extract) {
              setWikipediaArticles(prev => [...prev, {
                title: page.title,
                extract: page.extract,
                fullurl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`
              }]);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching Wikipedia articles:', error);
    }
  };

  const handleAddArticle = async () => {
    if (!newArticle.title || !newArticle.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('today_articles')
        .insert({
          title: newArticle.title,
          content: newArticle.content,
          url: newArticle.url,
          is_admin_added: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Article added successfully!",
      });

      setNewArticle({ title: "", content: "", url: "" });
      setIsAddingArticle(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add article.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('today_articles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Article deleted successfully!",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete article.",
        variant: "destructive",
      });
    }
  };

  const handleWikipediaClick = (article: WikipediaArticle) => {
    setSelectedArticle({
      article_title: article.title,
      article_url: article.fullurl
    });
    setLittleWikOpen(true);
  };

  const handleOpenFull = (title: string) => {
    navigate(`/?q=${encodeURIComponent(title)}`);
  };

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-wikitok-red mb-2">Today's Highlights</h1>
            <p className="text-gray-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {dateString}
            </p>
          </div>
          {isAdmin && (
            <Dialog open={isAddingArticle} onOpenChange={setIsAddingArticle}>
              <DialogTrigger asChild>
                <Button className="bg-wikitok-red hover:bg-wikitok-red/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Article
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800">
                <DialogHeader>
                  <DialogTitle>Add New Article</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Article Title"
                    value={newArticle.title}
                    onChange={(e) => setNewArticle(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-gray-800 border-gray-700"
                  />
                  <Textarea
                    placeholder="Article Content"
                    value={newArticle.content}
                    onChange={(e) => setNewArticle(prev => ({ ...prev, content: e.target.value }))}
                    className="bg-gray-800 border-gray-700 min-h-32"
                  />
                  <Input
                    placeholder="Article URL (optional)"
                    value={newArticle.url}
                    onChange={(e) => setNewArticle(prev => ({ ...prev, url: e.target.value }))}
                    className="bg-gray-800 border-gray-700"
                  />
                  <Button onClick={handleAddArticle} className="w-full bg-wikitok-red hover:bg-wikitok-red/90">
                    Add Article
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-8">
          {/* News Feed Section */}
          <NewsFeed />

          {/* Wikipedia Articles Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-300">From Wikipedia</h2>
            <div className="grid gap-4">
              {wikipediaArticles.map((article, index) => (
                <Card key={index} className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <CardContent className="p-6" onClick={() => handleWikipediaClick(article)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-white mb-2">{article.title}</h3>
                        <p className="text-gray-400 text-sm line-clamp-3">{article.extract}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0 ml-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Admin Articles Section */}
          {adminArticles && adminArticles.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-300">Editorial Highlights</h2>
              <div className="grid gap-4">
                {adminArticles.map((article) => (
                  <Card key={article.id} className="bg-gray-900/50 border-gray-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg text-white">{article.title}</CardTitle>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteArticle(article.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-gray-400 text-sm mb-3">{article.content}</p>
                      {article.url && (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-wikitok-red hover:text-wikitok-red/80 text-sm flex items-center gap-1"
                        >
                          Read more <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <LittleWik
        isOpen={littleWikOpen}
        onClose={() => setLittleWikOpen(false)}
        article={selectedArticle}
        onOpenFull={handleOpenFull}
      />
    </div>
  );
};

export default Today;
