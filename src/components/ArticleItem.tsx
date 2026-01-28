import React, { useState, useCallback, lazy, Suspense } from "react";
import { Progress } from "./ui/progress";
import { UserPreferences } from "@/services/userPreferencesService";
import AudioPlayer from "./AudioPlayer";
import { useAuth } from "@/contexts/AuthContext";
import { ExportMenu } from "./ExportMenu";
import HighlightedText from "./HighlightedText";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useNavigate } from "react-router-dom";

// Lazy load SmartLinks to reduce initial bundle
const SmartLinks = lazy(() => import("./SmartLinks"));

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
  const navigate = useNavigate();
  const [hideTts, setHideTts] = useState<boolean>(() => {
    try { return localStorage.getItem('ticdia_hide_tts') === 'true'; } catch { return false; }
  });
  const [showSmartLinks, setShowSmartLinks] = useState(false);
  
  // Use text animation preference - show full text if disabled
  const showAnimation = userPreferences.textAnimation !== false;
  const contentToShow = isCurrent && showAnimation && displayedText ? displayedText : article.content;

  const handleSwipeRight = useCallback(() => {
    if (isCurrent) {
      setShowSmartLinks(true);
    }
  }, [isCurrent]);

  const handleSwipeLeft = useCallback(() => {
    setShowSmartLinks(false);
  }, []);

  const swipeHandlers = useSwipeGesture({
    onSwipeRight: handleSwipeRight,
    onSwipeLeft: handleSwipeLeft,
  });

  const handleNavigateToArticle = (title: string) => {
    setShowSmartLinks(false);
    navigate(`/?q=${encodeURIComponent(title)}`);
  };

  return (
    <div
      data-index={index}
      className="article-section h-screen w-screen snap-start snap-always relative flex items-center justify-center"
      style={{ minHeight: '100vh', contain: 'layout style paint' }}
      {...swipeHandlers}
    >
      {/* Smart Links Overlay - lazy loaded */}
      {showSmartLinks && isCurrent && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center"><span className="text-muted-foreground">Loading...</span></div>}>
          <SmartLinks
            articleContent={article.content}
            articleTitle={article.title}
            onClose={() => setShowSmartLinks(false)}
            onNavigateToArticle={handleNavigateToArticle}
          />
        </Suspense>
      )}

      {/* Fixed aspect ratio container prevents CLS */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {/* Placeholder background to prevent flash */}
        <div 
          className="absolute inset-0 bg-background" 
          style={{ zIndex: 0 }}
        />
        <img
          src={article.image}
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover"
          loading={index === 0 ? "eager" : "lazy"}
          decoding={index === 0 ? "sync" : "async"}
          width="1920"
          height="1080"
          // @ts-expect-error - fetchpriority is valid in DOM but missing in React types
          fetchpriority={index === 0 ? "high" : "low"}
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <div
          className="absolute inset-0 bg-background"
          style={{ opacity: userPreferences.backgroundOpacity / 100, zIndex: 1 }}
        />
      </div>

      {/* Export Menu - positioned in top-right corner */}
      {isCurrent && !showSmartLinks && (
        <div className="absolute top-20 right-4 z-20">
          <ExportMenu article={{
            id: article.id?.toString() || article.title,
            title: article.title,
            content: article.content,
            image: article.image,
            url: article.url
          }} />
        </div>
      )}

      <div
        className="relative z-10 text-foreground p-4 sm:p-8 max-w-3xl mx-auto h-full flex flex-col justify-center"
        style={{
          minHeight: '300px',
          contain: 'layout',
          willChange: 'opacity',
          opacity: 1,
        }}
      >
        <div className={`${isMobile ? 'bg-background/40 backdrop-blur-sm rounded-lg p-4 max-h-[70vh] overflow-y-auto' : 'text-center max-h-[80vh] overflow-y-auto'}`} style={{ minHeight: '200px' }}>
          <div className="space-y-4" style={{ minHeight: '150px' }}>
            <h1
              className="text-2xl sm:text-4xl font-bold"
              style={{ fontFamily: userPreferences.fontFamily }}
            >
              {article.title}
            </h1>
            <div className="max-w-2xl" style={{ minHeight: '100px' }}>
              {user ? (
                <HighlightedText
                  text={contentToShow}
                  className="text-sm sm:text-lg leading-relaxed"
                  style={{
                    fontFamily: userPreferences.fontFamily,
                    fontSize: `${userPreferences.fontSize}px`,
                    minHeight: '80px'
                  }}
                  isActive={isCurrent}
                />
              ) : (
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
              )}
            </div>

            {/* Audio Player */}
            {isCurrent && user && !hideTts && !showSmartLinks && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2 text-xs opacity-70">
                  <span>Text to Speech</span>
                  <button
                    onClick={() => {
                      try { localStorage.setItem('ticdia_hide_tts', 'true'); } catch { }
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
        {isCurrent && !showSmartLinks && (
          <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground flex-shrink-0 mt-4">
            <button
              onClick={() => setShowSmartLinks(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
            >
              <span>View Related Links</span>
              <span className="text-xs opacity-70">→</span>
            </button>
          </div>
        )}
      </div>

      {isCurrent && progress > 0 && !showSmartLinks && showAnimation && (
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

export default React.memo(ArticleItem, (prevProps, nextProps) => {
  // React.memo: return TRUE if props are EQUAL (skip re-render)
  //             return FALSE if props are DIFFERENT (DO re-render)
  const areEqual = (
    prevProps.index === nextProps.index &&
    prevProps.isCurrent === nextProps.isCurrent &&
    prevProps.progress === nextProps.progress &&
    prevProps.displayedText === nextProps.displayedText &&
    prevProps.article.id === nextProps.article.id &&
    prevProps.userPreferences.fontFamily === nextProps.userPreferences.fontFamily &&
    prevProps.userPreferences.fontSize === nextProps.userPreferences.fontSize &&
    prevProps.userPreferences.backgroundOpacity === nextProps.userPreferences.backgroundOpacity &&
    prevProps.userPreferences.highlightColor === nextProps.userPreferences.highlightColor &&
    prevProps.userPreferences.textAnimation === nextProps.userPreferences.textAnimation
  );

  return areEqual; // TRUE = skip, FALSE = re-render
});
