import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "@/components/ui/toaster";
import { CookieConsent } from "@/components/CookieConsent";
import { GoogleAnalyticsTracker } from "./components/GoogleAnalyticsTracker";

import { useUserPreferences, UserPreferencesProvider } from "./contexts/UserPreferencesContext";

// Lazy load all pages for code splitting with error handling
const Index = lazy(() => import("./pages/Index"));
const Discover = lazy(() => import("./pages/Discover"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Today = lazy(() => import("./pages/Today"));
const Recap = lazy(() => import("./pages/Recap"));

// Lazy load heavy components that hurt performance
const FluidSmokeEffect = lazy(() => import("./components/FluidSmokeEffect"));

// Create a client with optimized caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      refetchOnMount: false,
    },
  },
});

import LoadingScreen from "./components/LoadingScreen";

function AppContent() {
  const { userPreferences } = useUserPreferences();
  const [showSmoke, setShowSmoke] = useState(false);

  // Defer smoke effect loading to after initial paint (reduces INP/LCP)
  useEffect(() => {
    if (userPreferences.smokeEffect) {
      // Use requestIdleCallback or setTimeout to defer heavy component
      const timer = setTimeout(() => {
        setShowSmoke(true);
      }, 2000); // Load smoke effect 2s after initial render
      return () => clearTimeout(timer);
    } else {
      setShowSmoke(false);
    }
  }, [userPreferences.smokeEffect]);

  return (
    <div 
      className={`min-h-screen bg-background ${userPreferences.liquidGlassMode ? 'liquid-glass' : ''}`}
      style={{ contain: 'layout style' }}
    >
      {/* Defer heavy WebGL effect to after LCP */}
      {showSmoke && (
        <Suspense fallback={null}>
          <FluidSmokeEffect />
        </Suspense>
      )}
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/today" element={<Today />} />
          <Route path="/recap" element={<Recap />} />
        </Routes>
      </Suspense>
      <Toaster />
      <CookieConsent />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <UserPreferencesProvider>
              <AuthProvider>
                <Router>
                  <GoogleAnalyticsTracker />
                  <AppContent />
                </Router>
              </AuthProvider>
            </UserPreferencesProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
