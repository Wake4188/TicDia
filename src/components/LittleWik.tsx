
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { BookOpen, ExternalLink, Share2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface LittleWikProps {
  isOpen: boolean;
  onClose: () => void;
  article: {
    article_title: string;
    article_url: string;
  } | null;
  onOpenFull: (title: string) => void;
}

const LittleWik = ({ isOpen, onClose, article, onOpenFull }: LittleWikProps) => {
  const { toast } = useToast();
  const [articlePreview, setArticlePreview] = useState<string>("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    if (article && isOpen) {
      fetchArticlePreview();
    }
  }, [article, isOpen]);

  const fetchArticlePreview = async () => {
    if (!article) return;
    
    setIsLoadingPreview(true);
    try {
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(article.article_title)}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch article preview');
      
      const data = await response.json();
      setArticlePreview(data.extract || "No preview available for this article.");
    } catch (error) {
      console.error('Error fetching article preview:', error);
      setArticlePreview("Unable to load article preview.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  if (!article) return null;

  const handleOpenFull = () => {
    onOpenFull(article.article_title);
    onClose();
  };

  const handleOpenWikipedia = () => {
    window.open(article.article_url, '_blank');
  };

  const handleShare = () => {
    const shareUrl = article.article_url;
    const shareText = `Check out this article about ${article.article_title} on Wikipedia!`;

    if (navigator.share) {
      navigator.share({
        title: article.article_title,
        text: shareText,
        url: shareUrl,
      }).catch((error) => {
        console.error('Error sharing:', error);
        // Fallback to clipboard
        copyToClipboard(shareUrl);
      });
    } else {
      // Fallback to clipboard
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        toast({
          title: "Link copied!",
          description: "Article link has been copied to your clipboard.",
        });
      }).catch(() => {
        // Final fallback
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      toast({
        title: "Link copied!",
        description: "Article link has been copied to your clipboard.",
      });
    } catch (err) {
      console.error('Failed to copy text:', err);
      toast({
        title: "Copy failed",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    } finally {
      document.body.removeChild(textArea);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900/95 backdrop-blur-md border-gray-800/50 text-white max-w-lg max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center">
            Little Wik
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-4 overflow-y-auto">
          <h3 className="text-center font-medium text-white text-lg">
            {article.article_title}
          </h3>
          
          <div className="bg-gray-800/60 rounded-lg p-4 max-h-40 overflow-y-auto">
            {isLoadingPreview ? (
              <div className="text-center text-gray-400">
                <div className="animate-pulse">Loading preview...</div>
              </div>
            ) : (
              <p className="text-gray-300 text-sm leading-relaxed">
                {articlePreview}
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleOpenFull}
              className="bg-wikitok-red hover:bg-wikitok-red/90 text-white transition-all duration-300 hover:scale-105"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Open in WikiTok
            </Button>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleShare}
                variant="outline"
                className="flex-1 border-gray-600 text-white hover:bg-gray-800 transition-all duration-300 hover:scale-105"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              <Button 
                onClick={handleOpenWikipedia}
                variant="outline"
                className="flex-1 border-gray-600 text-white hover:bg-gray-800 transition-all duration-300 hover:scale-105"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Wikipedia
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LittleWik;
