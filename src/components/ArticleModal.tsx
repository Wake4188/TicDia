import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleUrl: string;
  articleTitle: string;
}

const ArticleModal = ({ isOpen, onClose, articleUrl, articleTitle }: ArticleModalProps) => {
  const [iframeError, setIframeError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setIframeError(false);
      setIsLoading(true);
    }
  }, [isOpen]);

  const handleIframeError = () => {
    setIframeError(true);
    setIsLoading(false);
    toast({
      title: "Unable to load article",
      description: "The article cannot be displayed here. Opening in a new tab instead.",
      variant: "destructive",
    });
    
    // Automatically open in new tab after a short delay
    setTimeout(() => {
      window.open(articleUrl, '_blank', 'noopener,noreferrer');
      onClose();
    }, 1500);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const openInNewTab = () => {
    window.open(articleUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] bg-gray-900 border-gray-800 p-0">
        <DialogHeader className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white text-lg font-medium pr-8 line-clamp-1">
              {articleTitle}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={openInNewTab}
                className="text-gray-400 hover:text-white"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 relative">
          {!iframeError ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wikitok-red mx-auto"></div>
                    <p className="text-gray-400">Loading article...</p>
                  </div>
                </div>
              )}
              <iframe
                src={articleUrl}
                className="w-full h-full border-0"
                title={`Article: ${articleTitle}`}
                onError={handleIframeError}
                onLoad={handleIframeLoad}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                referrerPolicy="no-referrer"
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-900">
              <div className="text-center space-y-4 p-8">
                <AlertTriangle className="w-16 h-16 text-wikitok-red mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-xl font-medium text-white">Article Cannot Be Displayed</h3>
                  <p className="text-gray-400">
                    The New York Times has blocked this article from being displayed in an iframe.
                  </p>
                  <p className="text-gray-400">Opening in a new tab instead...</p>
                </div>
                <Button
                  onClick={openInNewTab}
                  className="bg-wikitok-red hover:bg-wikitok-red/90"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArticleModal;