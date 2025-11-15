
import { useState } from "react";
import { Progress } from "./ui/progress";
import { UserPreferences } from "@/services/userPreferencesService";
import AudioPlayer from "./AudioPlayer";
import { useAuth } from "@/contexts/AuthContext";

interface ArticleItemProps {
  article: any;
  index: number;
  isCurrent: boolean;
  displayedText: string;
  progress: number;
  userPreferences: UserPreferences;
  isMobile: boolean;
}

const ArticleItem = ({
  article,
  index,
  isCurrent,
  displayedText,
  progress,
  userPreferences,
  isMobile
}: ArticleItemProps) => {
  const { user } = useAuth();
  const [hideTts, setHideTts] = useState<boolean>(() => {
    try { return localStorage.getItem('ticdia_hide_tts') === 'true'; } catch { return false; }
  });
  const contentToShow = isCurrent && displayedText ? displayedText : article.content;
  
  return (
    <div 
      data-index={index} 
      className="article-section h-screen w-screen snap-start snap-always relative flex items-center justify-center"
      style={{ minHeight: '100vh' }}
    >
      <div className="absolute inset-0 w-screen h-screen" style={{ aspectRatio: '16/9' }}>
        <img 
          src={article.image} 
          alt={article.title} 
          className="w-full h-full object-cover"
          loading={index > 0 ? "lazy" : "eager"}
          decoding="async"
          width="1920"
          height="1080"
          fetchPriority={index === 0 ? "high" : "low"}
          style={{ aspectRatio: '16/9' }}
        />
        <div 
          className="absolute inset-0 bg-black" 
          style={{ opacity: userPreferences.backgroundOpacity / 100 }} 
        />
      </div>
      
      <div 
        className="relative z-10 text-white p-4 sm:p-8 max-w-3xl mx-auto h-full flex flex-col justify-center animate-fade-in"
        style={{ 
          minHeight: '300px',
          animationDelay: `${index * 0.1}s`,
          animationFillMode: 'both'
        }}
      >
        <div className={`${isMobile ? 'bg-black/40 backdrop-blur-sm rounded-lg p-4 max-h-[70vh] overflow-y-auto' : 'text-center max-h-[80vh] overflow-y-auto'}`} style={{ minHeight: '200px' }}>
          <div className="space-y-4" style={{ minHeight: '150px' }}>
            <h1 
              className="text-2xl sm:text-4xl font-bold" 
              style={{ fontFamily: userPreferences.fontFamily }}
            >
              {article.title}
            </h1>
            <div className="max-w-2xl" style={{ minHeight: '100px' }}>
              <p 
                className="text-sm sm:text-lg leading-relaxed" 
                style={{ 
                  fontFamily: userPreferences.fontFamily,
                  fontSize: `${userPreferences.fontSize}px`,
                  minHeight: '80px'
                }}
                translate="yes"
              >
                {contentToShow}
              </p>
            </div>
            
            {/* Audio Player */}
            {isCurrent && user && !hideTts && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2 text-xs opacity-70">
                  <span>Text to Speech</span>
                  <button
                    onClick={() => {
                      try { localStorage.setItem('ticdia_hide_tts', 'true'); } catch {}
                      setHideTts(true);
                    }}
                    className="underline hover:opacity-100"
                  >
                    Hide
                  </button>
                </div>
                <AudioPlayer 
                  text={article.content || ''}
                  onAudioStart={() => {
                    // Handle TTS start for tracking purposes
                    if (typeof window !== 'undefined' && (window as any).handleTtsStart) {
                      (window as any).handleTtsStart(index);
                    }
                  }}
                  onAudioEnd={() => {
                    // Handle TTS end for tracking purposes
                    if (typeof window !== 'undefined' && (window as any).handleTtsStop) {
                      (window as any).handleTtsStop();
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-300 flex-shrink-0 mt-4 ml-6">
          <span>{article.readTime} min read</span>
          <span>•</span>
          <span>{article.views.toLocaleString()} views</span>
        </div>
      </div>
      
      {isCurrent && progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <Progress 
            value={progress}
            aria-label={`Article reading progress: ${Math.round(progress)}%`}
            className="h-1 bg-black/20" 
            indicatorClassName="transition-colors duration-300" 
            style={{ '--progress-bar-color': userPreferences.highlightColor } as React.CSSProperties} 
          />
        </div>
      )}
    </div>
  );
};

export default ArticleItem;
