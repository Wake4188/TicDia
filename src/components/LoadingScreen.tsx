import React from 'react';

/**
 * TicDia loading screen — modern glass-morphism aesthetic.
 * Layered blurred gradient orbs, a soft glass disc with a slow orbital ring,
 * and the wordmark in the project's newspaper serif.
 */
const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Ambient gradient orbs — matches Today / Profile vibe */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/3 w-[420px] h-[420px] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/3 w-[360px] h-[360px] rounded-full bg-accent/15 blur-[110px] animate-pulse"
          style={{ animationDelay: '1.2s' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/80" />
      </div>

      {/* Glass disc with orbital ring */}
      <div className="relative flex items-center justify-center w-40 h-40">
        {/* Outer orbital ring */}
        <div
          className="absolute inset-0 rounded-full border border-primary/30"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, hsl(var(--primary) / 0.7) 30%, transparent 60%)',
            WebkitMask: 'radial-gradient(circle, transparent 62%, black 64%)',
            mask: 'radial-gradient(circle, transparent 62%, black 64%)',
            animation: 'spin 2.6s linear infinite',
          }}
        />

        {/* Soft halo */}
        <div className="absolute w-32 h-32 rounded-full bg-primary/10 blur-2xl" />

        {/* Glass core */}
        <div className="relative w-24 h-24 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_8px_40px_-8px_hsl(var(--primary)/0.6)] flex items-center justify-center">
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
          <span
            className="font-newspaper text-3xl font-bold text-foreground/90 select-none"
            style={{ fontFamily: '"Times New Roman", Georgia, serif' }}
          >
            T
          </span>
        </div>
      </div>

      {/* Wordmark */}
      <div className="mt-10 flex flex-col items-center">
        <h1
          className="text-3xl tracking-[0.45em] font-bold text-foreground/90 select-none"
          style={{ fontFamily: '"Times New Roman", Georgia, serif' }}
        >
          TICDIA
        </h1>
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
