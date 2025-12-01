import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trash2, Plus, ExternalLink, Calendar, Sparkles, TrendingUp, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SmallTic from "@/components/SmallTic";
import NewsFeed from "@/components/NewsFeed";
import VotingProgressBar from "@/components/VotingProgressBar";
import { useNavigate } from "react-router-dom";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

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

interface RSSArticle {
  title: string;
  summary: string;
  link: string;
  image?: string;
  publishedAt: string;
  source: string;
}

const Today = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
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

  // Load user preferences to apply highlight color
  useUserPreferences();
  const [isAddingArticle, setIsAddingArticle] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: "", content: "", url: "" });
  const [wikipediaArticles, setWikipediaArticles] = useState<WikipediaArticle[]>([]);
  const [apNewsArticles, setApNewsArticles] = useState<RSSArticle[]>([]);
  const [smallTicOpen, setSmallTicOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<{ article_title: string; article_url: string } | null>(null);
  const [showAllArticles, setShowAllArticles] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin using has_role function
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role' as any, {
          _user_id: user.id,
          _role: 'admin'
        });

        if (!error && data) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      }
    };

    checkAdminRole();
  }, [user]);

  // Get today's date
  const today = new Date();
  const dateString = today.toLocaleDateString(currentLanguage.code, {
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
    fetchApNewsRSS();
  }, [currentLanguage]);

  const fetchApNewsRSS = async () => {
    try {
      const response = await fetch('/api/rss?url=' + encodeURIComponent('https://rss.app/feeds/6Hnucl2wxDJEwGrt.xml') + '&source=AP News');
      if (response.ok) {
        const articles = await response.json();
        setApNewsArticles(articles);
      }
    } catch (error) {
      console.error('Error fetching AP News RSS:', error);
    }
  };

  const fetchWikipediaArticles = async () => {
    try {
      // Get current events from Wikipedia in the selected language
      const currentDate = new Date();
      const month = currentDate.toLocaleString(currentLanguage.code, { month: 'long' });
      const day = currentDate.getDate();

      const wikipediaDomain = currentLanguage.wikipediaDomain;
      const response = await fetch(
        `https://${wikipediaDomain}/api/rest_v1/page/summary/${month}_${day}`
      );

      if (!response.ok) {
        // Fallback to "Current events" page
        const fallbackResponse = await fetch(
          `https://${wikipediaDomain}/api/rest_v1/page/summary/Current_events`
        );
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          setWikipediaArticles([{
            title: data.title,
            extract: data.extract,
            fullurl: data.content_urls?.desktop?.page || `https://${wikipediaDomain}/wiki/${encodeURIComponent(data.title)}`
          }]);
        }
        return;
      }

      const data = await response.json();
      setWikipediaArticles([{
        title: data.title,
        extract: data.extract,
        fullurl: data.content_urls?.desktop?.page || `https://${wikipediaDomain}/wiki/${encodeURIComponent(data.title)}`
      }]);

      // Try to get more current events
      const eventsResponse = await fetch(
        `https://${wikipediaDomain}/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&titles=Portal:Current_events&origin=*`
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
                fullurl: `https://${wikipediaDomain}/wiki/${encodeURIComponent(page.title)}`
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
        title: t('error'),
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
        title: t('error'),
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
        title: t('error'),
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
    setSmallTicOpen(true);
  };

  const handleOpenFull = (title: string) => {
    navigate(`/?q=${encodeURIComponent(title)}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0f] to-black text-white pt-20 pb-10 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4"
        >
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-4 text-gray-400 hover:text-white pl-0 hover:bg-transparent transition-colors"
            >
              ← {t('backToHome')}
            </Button>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 mb-2">
              {t('todayHighlights')}
            </h1>
            <p className="text-gray-400 flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-tictok-red" />
              {dateString}
            </p>
          </div>

          {isAdmin && (
            <Dialog open={isAddingArticle} onOpenChange={setIsAddingArticle}>
              <DialogTrigger asChild>
                <Button className="bg-tictok-red hover:bg-tictok-red/90 shadow-lg shadow-tictok-red/20 transition-all hover:scale-105">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('addArticle')}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-gray-800">
                <DialogHeader>
                  <DialogTitle>{t('addNewArticle')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder={t('articleTitle')}
                    value={newArticle.title}
                    onChange={(e) => setNewArticle(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-gray-800/50 border-gray-700 focus:border-tictok-red/50 transition-colors"
                  />
                  <Textarea
                    placeholder={t('articleContent')}
                    value={newArticle.content}
                    onChange={(e) => setNewArticle(prev => ({ ...prev, content: e.target.value }))}
                    className="bg-gray-800/50 border-gray-700 min-h-32 focus:border-tictok-red/50 transition-colors"
                  />
                  <Input
                    placeholder={t('articleUrl')}
                    value={newArticle.url}
                    onChange={(e) => setNewArticle(prev => ({ ...prev, url: e.target.value }))}
                    className="bg-gray-800/50 border-gray-700 focus:border-tictok-red/50 transition-colors"
                  />
                  <Button onClick={handleAddArticle} className="w-full bg-tictok-red hover:bg-tictok-red/90">
                    {t('addArticle')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Voting Progress Bar */}
          <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl">
            <VotingProgressBar />
          </motion.div>

          {/* News Feed Section */}
          <motion.div variants={itemVariants}>
            <NewsFeed />
          </motion.div>

          {/* AP News RSS Section */}
          {apNewsArticles.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-tictok-red/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-tictok-red" />
                </div>
                <h2 className="text-2xl font-bold text-white">{t('apNews')}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(showAllArticles ? apNewsArticles : apNewsArticles.slice(0, 9)).map((article, index) => (
                  <motion.div
                    key={`ap-${index}`}
                    variants={itemVariants}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <Card className="h-full bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300 overflow-hidden group">
                      <CardContent className="p-0 flex flex-col h-full">
                        {article.image && (
                          <div className="relative w-full h-48 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                            <img
                              src={article.image}
                              alt={article.title}
                              loading="lazy"
                              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            <div className="absolute bottom-3 left-3 z-20">
                              <span className="text-xs font-medium px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white border border-white/20">
                                {article.source}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="p-5 flex-1 flex flex-col">
                          <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 group-hover:text-tictok-red transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-1">
                            {article.summary}
                          </p>
                          <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(article.publishedAt).toLocaleDateString()}
                            </span>
                            <a
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white hover:text-tictok-red text-sm font-medium flex items-center gap-1 transition-colors"
                            >
                              {t('readMore')} <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {apNewsArticles.length > 9 && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllArticles(!showAllArticles)}
                    className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-tictok-red transition-all"
                  >
                    {showAllArticles ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        {t('showLess')}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        {t('showAll')} ({apNewsArticles.length - 9} {t('more')})
                      </>
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Wikipedia Articles Section */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Globe className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">{t('fromWikipedia')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {wikipediaArticles.map((article, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className="h-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border-white/10 hover:border-white/20 transition-all cursor-pointer group"
                    onClick={() => handleWikipediaClick(article)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-gray-300 text-sm line-clamp-4 leading-relaxed">
                            {article.extract}
                          </p>
                        </div>
                        <div className="p-2 bg-white/5 rounded-full group-hover:bg-blue-500/20 transition-colors">
                          <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Admin Articles Section */}
          {adminArticles && adminArticles.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">{t('editorialHighlights')}</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {adminArticles.map((article) => (
                  <motion.div key={article.id} variants={itemVariants}>
                    <Card className="bg-purple-900/10 border-purple-500/20 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-xl text-white">{article.title}</CardTitle>
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
                        <p className="text-gray-300 text-sm mb-4 leading-relaxed">{article.content}</p>
                        {article.url && (
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors text-sm font-medium"
                          >
                            {t('readMore')} <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      <SmallTic
        isOpen={smallTicOpen}
        onClose={() => setSmallTicOpen(false)}
        article={selectedArticle}
        onOpenFull={handleOpenFull}
      />
    </div>
  );
};

export default Today;
