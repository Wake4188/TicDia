import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Home, WifiOff, AlertTriangle, Search, Database, FileQuestion, Frown } from 'lucide-react';
import { Button } from './ui/button';

export type ErrorType = 
  | 'network' 
  | 'not-found' 
  | 'server' 
  | 'empty' 
  | 'loading-failed' 
  | 'unknown';

interface FunErrorScreenProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

const errorConfigs: Record<ErrorType, { 
  icon: React.ElementType; 
  emoji: string;
  defaultTitle: string; 
  defaultMessage: string;
  color: string;
  bgGradient: string;
}> = {
  network: {
    icon: WifiOff,
    emoji: '📡',
    defaultTitle: 'Lost in the Ether!',
    defaultMessage: "The internet gremlins ate your connection. Check your Wi-Fi and try again!",
    color: 'text-blue-400',
    bgGradient: 'from-blue-500/10 to-cyan-500/10'
  },
  'not-found': {
    icon: Search,
    emoji: '🔍',
    defaultTitle: 'Nothing Here But Tumbleweeds',
    defaultMessage: "This page wandered off into the digital desert. Let's find something better!",
    color: 'text-amber-400',
    bgGradient: 'from-amber-500/10 to-orange-500/10'
  },
  server: {
    icon: Database,
    emoji: '🔧',
    defaultTitle: 'Our Hamsters Need a Break',
    defaultMessage: "The server hamsters are taking a coffee break. They'll be back soon!",
    color: 'text-red-400',
    bgGradient: 'from-red-500/10 to-pink-500/10'
  },
  empty: {
    icon: FileQuestion,
    emoji: '📭',
    defaultTitle: 'Empty Treasure Chest',
    defaultMessage: "We searched high and low but found nothing. Try a different quest!",
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/10 to-violet-500/10'
  },
  'loading-failed': {
    icon: AlertTriangle,
    emoji: '⚠️',
    defaultTitle: 'Oops! Loading Hiccup',
    defaultMessage: "Something got tangled up while loading. Give it another whirl!",
    color: 'text-yellow-400',
    bgGradient: 'from-yellow-500/10 to-amber-500/10'
  },
  unknown: {
    icon: Frown,
    emoji: '🤷',
    defaultTitle: 'Mystery Mishap',
    defaultMessage: "Something unexpected happened. Even we're confused! Let's try again.",
    color: 'text-gray-400',
    bgGradient: 'from-gray-500/10 to-slate-500/10'
  }
};

const FunErrorScreen: React.FC<FunErrorScreenProps> = ({
  type = 'unknown',
  title,
  message,
  onRetry,
  onGoHome
}) => {
  const config = errorConfigs[type];
  const Icon = config.icon;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 font-newspaper">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-md w-full text-center space-y-6"
      >
        {/* Animated Icon Container */}
        <motion.div
          className={`relative mx-auto w-32 h-32 rounded-full bg-gradient-to-br ${config.bgGradient} flex items-center justify-center`}
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Floating emoji */}
          <motion.span
            className="absolute -top-2 -right-2 text-3xl"
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {config.emoji}
          </motion.span>
          
          <Icon className={`w-16 h-16 ${config.color}`} />
          
          {/* Decorative circles */}
          <motion.div
            className="absolute w-full h-full rounded-full border-2 border-primary/20"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        {/* Error Title */}
        <motion.h1 
          className="text-2xl md:text-3xl font-bold text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {title || config.defaultTitle}
        </motion.h1>

        {/* Error Message */}
        <motion.p 
          className="text-muted-foreground text-base md:text-lg leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {message || config.defaultMessage}
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-3 justify-center pt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {onRetry && (
            <Button
              onClick={onRetry}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
          {onGoHome && (
            <Button
              onClick={onGoHome}
              variant="outline"
              className="gap-2 border-border hover:bg-accent"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          )}
        </motion.div>

        {/* Decorative footer */}
        <motion.div
          className="pt-8 flex justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {['✨', '🌟', '💫'].map((star, i) => (
            <motion.span
              key={i}
              className="text-lg opacity-50"
              animate={{ 
                y: [0, -4, 0],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3
              }}
            >
              {star}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FunErrorScreen;
