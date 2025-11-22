import React from 'react';

const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
            <div className="relative flex items-center justify-center">
                {/* Outer pulsing ring */}
                <div className="absolute w-24 h-24 rounded-full border-2 border-primary/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>

                {/* Inner rotating gradient ring */}
                <div className="w-16 h-16 rounded-full border-2 border-transparent border-t-primary border-r-primary/50 animate-[spin_1.5s_linear_infinite]"></div>

                {/* Center brand mark */}
                <div className="absolute w-12 h-12 bg-primary/10 rounded-full backdrop-blur-sm flex items-center justify-center">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                </div>
            </div>

            {/* Elegant text with shimmer */}
            <div className="mt-8 relative overflow-hidden">
                <h1 className="text-2xl font-bold tracking-widest text-foreground/80 font-serif">
                    TICDIA
                </h1>
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>

            <p className="mt-2 text-xs text-muted-foreground tracking-widest uppercase opacity-60">
                Discover
            </p>
        </div>
    );
};

export default LoadingScreen;
