import { useState, useEffect } from "react";
import { Bookmark, Share2, Edit, BookOpen, MoreVertical } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const RightSidebar = ({ article }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentLanguage, translations } = useLanguage();
  const t = translations;
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useMobileDetection();

  // Check if article is already saved when component mounts or user/article changes
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user || !article) return;

      try {
        const { data, error } = await supabase
          .from('saved_articles')
          .select('id')
          .eq('user_id', user.id)
          .eq('article_id', article.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking saved status:', error);
          return;
        }

        setIsSaved(!!data);
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };

    checkIfSaved();
  }, [user, article]);

  const handleWikipediaRedirect = () => {
    const language = currentLanguage;
    const baseUrl = `https://${language.wikipediaDomain}/wiki/`;
    const articleTitle = encodeURIComponent(article.title);
    window.open(`${baseUrl}${articleTitle}`, '_blank');
  };

  const handleShare = () => {
    const baseUrl = window.location.origin;
    const searchParams = new URLSearchParams();
    searchParams.set('q', article.title);
    searchParams.set('id', article.id);
    const shareUrl = `${baseUrl}/?${searchParams.toString()}`;

    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: "Check out this article about " + article.title + " on TicDia!",
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({
          title: "Link copied!",
          description: "Article link has been copied to your clipboard.",
        });
      }).catch(console.error);
    }
  };

  const handleEdit = () => {
    const language = currentLanguage;
    const baseUrl = `https://${language.wikipediaDomain}/wiki/`;
    const articleTitle = encodeURIComponent(article.title);
    window.open(`${baseUrl}edit/${articleTitle}`, '_blank');
  };

  const handleBookmark = async () => {
    // If user is not logged in, prompt them to authenticate
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save articles to your collection.",
        action: (
          <button
            onClick={() => navigate('/auth')}
            className="bg-wikitok-red text-white px-3 py-1 rounded text-sm hover:bg-wikitok-red/90"
          >
            {t.signIn}
          </button>
        ),
      });
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      if (isSaved) {
        // Remove from saved articles
        const { error } = await supabase
          .from('saved_articles')
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', article.id);

        if (error) {
          throw error;
        }

        setIsSaved(false);
        toast({
          title: "Article removed",
          description: "Article has been removed from your saved collection.",
        });
      } else {
        // Add to saved articles
        const language = currentLanguage;
        const { error } = await supabase
          .from('saved_articles')
          .insert({
            user_id: user.id,
            article_id: article.id,
            article_title: article.title,
            article_url: `https://${language.wikipediaDomain}/wiki/${encodeURIComponent(article.title)}`
          });

        if (error) {
          throw error;
        }

        setIsSaved(true);
        toast({
          title: "Article saved!",
          description: "Article has been added to your saved collection.",
        });
      }
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: "Error",
        description: "Failed to save article. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  if (isMobile) {
    return (
      <div className="fixed right-4 bottom-20 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-full p-4 text-white hover:bg-black/40 transition-all shadow-lg">
              <MoreVertical className="w-6 h-6" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end"
            side="top"
            sideOffset={12}
            className="bg-black/95 backdrop-blur-md border border-white/20 text-white z-[100] min-w-[200px]"
          >
            <DropdownMenuItem 
              onClick={handleBookmark} 
              disabled={isLoading}
              className="hover:bg-white/10 focus:bg-white/10 cursor-pointer py-3"
            >
              <Bookmark className={`w-5 h-5 mr-3 ${isSaved ? 'fill-current text-wikitok-red' : ''}`} />
              <span className="text-base">{isSaved ? t.saved : t.save}</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleShare}
              className="hover:bg-white/10 focus:bg-white/10 cursor-pointer py-3"
            >
              <Share2 className="w-5 h-5 mr-3" />
              <span className="text-base">{t.share}</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleEdit}
              className="hover:bg-white/10 focus:bg-white/10 cursor-pointer py-3"
            >
              <Edit className="w-5 h-5 mr-3" />
              <span className="text-base">{t.edit}</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleWikipediaRedirect}
              className="hover:bg-white/10 focus:bg-white/10 cursor-pointer py-3"
            >
              <BookOpen className="w-5 h-5 mr-3" />
              <span className="text-base">{t.view}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="fixed right-4 bottom-20 flex flex-col items-center space-y-4 z-50">
        <div className="flex flex-col items-center">
          <button 
            className={`sidebar-icon ${isSaved ? 'text-wikitok-red' : ''} ${isLoading ? 'opacity-50' : ''}`} 
            onClick={handleBookmark}
            disabled={isLoading}
          >
            <Bookmark className={`w-7 h-7 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <span className="text-xs mt-1">{isSaved ? t.saved : t.save}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <button className="sidebar-icon" onClick={handleShare}>
            <Share2 className="w-7 h-7" />
          </button>
          <span className="text-xs mt-1">{t.share}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <button className="sidebar-icon" onClick={handleEdit}>
            <Edit className="w-7 h-7" />
          </button>
          <span className="text-xs mt-1">{t.edit}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <button className="sidebar-icon" onClick={handleWikipediaRedirect}>
            <BookOpen className="w-7 h-7" />
          </button>
          <span className="text-xs mt-1">{t.view}</span>
        </div>
      </div>
  );
};

export default RightSidebar;
