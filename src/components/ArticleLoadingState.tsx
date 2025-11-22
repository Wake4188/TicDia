import React from 'react';

const ArticleLoadingState = () => {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="relative flex items-center justify-center mb-6">
        <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-primary border-r-primary/50 animate-spin"></div>
        <div className="absolute w-2 h-2 bg-primary rounded-full animate-pulse"></div>
      </div>
      <div className="text-white/80 text-sm font-medium tracking-wider animate-pulse">
        Discovering...
      </div>
    </div>
  );
};

export default ArticleLoadingState;
