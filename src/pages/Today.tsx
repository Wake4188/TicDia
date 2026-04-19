import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, ExternalLink, Calendar, Sparkles, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SmallTic from "@/components/SmallTic";
import NewsFeedCards from "@/components/NewsFeedCards";
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
const Today = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    currentLanguage,
    translations
  } = useLanguage();
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
  const [newArticle, setNewArticle] = useState({
    title: "",
    content: "",
    url: ""
  });
  const [smallTicOpen, setSmallTicOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<{
    article_title: string;
    article_url: string;
  } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin using has_role function
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const {
          data,
          error
        } = await supabase.rpc('has_role' as any, {
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
  const {
    data: adminArticles,
    refetch
  } = useQuery({
    queryKey: ["todayArticles"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('today_articles').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data as TodayArticle[];
    }
  });
  const handleAddArticle = async () => {
    if (!newArticle.title || !newArticle.content) {
      toast({
        title: t('error'),
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    try {
      const {
        error
      } = await supabase.from('today_articles').insert({
        title: newArticle.title,
        content: newArticle.content,
        url: newArticle.url,
        is_admin_added: true
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Article added successfully!"
      });
      setNewArticle({
        title: "",
        content: "",
        url: ""
      });
      setIsAddingArticle(false);
      refetch();
    } catch (error) {
      toast({
        title: t('error'),
        description: "Failed to add article.",
        variant: "destructive"
      });
    }
  };
  const handleDeleteArticle = async (id: string) => {
    try {
      const {
        error
      } = await supabase.from('today_articles').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Article deleted successfully!"
      });
      refetch();
    } catch (error) {
      toast({
        title: t('error'),
        description: "Failed to delete article.",
        variant: "destructive"
      });
    }
  };
  const handleOpenFull = (title: string) => {
    navigate(`/?q=${encodeURIComponent(title)}`);
  };
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      y: 20,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };
  return <div className="min-h-screen bg-background text-foreground pt-20 pb-10 overflow-x-hidden">
      {/* Gradient background matching profile design */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
          <div>
            <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent transition-colors">
              ← {t('backToHome')}
            </Button>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
              {t('todayHighlights')}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-primary" />
              {dateString}
            </p>
          </div>

          {isAdmin && <Dialog open={isAddingArticle} onOpenChange={setIsAddingArticle}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('addArticle')}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card/95 backdrop-blur-xl border-border">
                <DialogHeader>
                  <DialogTitle>{t('addNewArticle')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder={t('articleTitle')} value={newArticle.title} onChange={e => setNewArticle(prev => ({ ...prev, title: e.target.value }))} className="bg-muted/50 border-border focus:border-primary/50 transition-colors" />
                  <Textarea placeholder={t('articleContent')} value={newArticle.content} onChange={e => setNewArticle(prev => ({ ...prev, content: e.target.value }))} className="bg-muted/50 border-border min-h-32 focus:border-primary/50 transition-colors" />
                  <Input placeholder={t('articleUrl')} value={newArticle.url} onChange={e => setNewArticle(prev => ({ ...prev, url: e.target.value }))} className="bg-muted/50 border-border focus:border-primary/50 transition-colors" />
                  <Button onClick={handleAddArticle} className="w-full bg-primary hover:bg-primary/90">
                    {t('addArticle')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>}
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-12">

          {/* News Feed Cards (NYT • BBC • France Info) */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{t('latestNews')}</h2>
            </div>
            <NewsFeedCards />
          </motion.div>


          {/* Admin Articles Section */}
          {adminArticles && adminArticles.length > 0 && <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Sparkles className="w-6 h-6 text-accent-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t('editorialHighlights')}</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {adminArticles.map(article => <motion.div key={article.id} variants={itemVariants}>
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-xl text-foreground">{article.title}</CardTitle>
                          {isAdmin && <Button variant="ghost" size="sm" onClick={() => handleDeleteArticle(article.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{article.content}</p>
                        {article.url && <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium">
                            {t('readMore')} <ExternalLink className="w-4 h-4" />
                          </a>}
                      </CardContent>
                    </Card>
                  </motion.div>)}
              </div>
            </motion.div>}
        </motion.div>
      </div>

      <SmallTic isOpen={smallTicOpen} onClose={() => setSmallTicOpen(false)} article={selectedArticle} onOpenFull={handleOpenFull} />
    </div>;
};
export default Today;