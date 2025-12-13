import React from 'react';

const ArticleLoadingState = () => {
  return (
    <div 
      className="h-screen w-screen flex flex-col items-center justify-center bg-background"
      style={{ 
        minHeight: '100vh',
        minWidth: '100vw',
        contain: 'layout style paint',
      }}
    >
      {/* Static skeleton matching article layout to prevent CLS */}
      <div 
        className="absolute inset-0 bg-muted/20"
        style={{ 
          backgroundImage: 'linear-gradient(90deg, transparent 0%, hsl(var(--muted)/0.3) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-primary border-r-primary/50 animate-spin"></div>
          <div className="absolute w-2 h-2 bg-primary rounded-full animate-pulse"></div>
        </div>
        <div className="text-foreground/80 text-sm font-medium tracking-wider animate-pulse">
          Discovering...
        </div>
      </div>
    </div>
  );
};

export default ArticleLoadingState;
