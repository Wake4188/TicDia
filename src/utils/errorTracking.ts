// Error tracking and logging utility

interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

class ErrorTracker {
  private errors: ErrorLog[] = [];
  private maxErrors = 50;

  constructor() {
    this.setupGlobalHandlers();
  }

  private setupGlobalHandlers() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
      });
    });

    // Catch global errors
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
      });
    });
  }

  logError(error: { message: string; stack?: string }) {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.errors.push(errorLog);
    
    // Keep only last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error tracked:', errorLog);
    }

    // In production, could send to error tracking service
    // Example: send to Sentry, LogRocket, etc.
  }

  getErrors(): ErrorLog[] {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
  }
}

export const errorTracker = new ErrorTracker();
