
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { BookOpen, ExternalLink } from "lucide-react";

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
  if (!article) return null;

  const handleOpenFull = () => {
    onOpenFull(article.article_title);
    onClose();
  };

  const handleOpenWikipedia = () => {
    window.open(article.article_url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900/95 backdrop-blur-md border-gray-800/50 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center">
            Little Wik
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-4">
          <h3 className="text-center font-medium text-white">
            {article.article_title}
          </h3>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleOpenFull}
              className="bg-wikitok-red hover:bg-wikitok-red/90 text-white transition-all duration-300 hover:scale-105"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Open in WikiTok
            </Button>
            <Button 
              onClick={handleOpenWikipedia}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800 transition-all duration-300 hover:scale-105"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Wikipedia
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LittleWik;
