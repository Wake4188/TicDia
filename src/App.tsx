import React, { Suspense, lazy } from "react";
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

// ... imports

import FluidSmokeEffect from "./components/FluidSmokeEffect";
import { useLocation } from "react-router-dom";

function AppContent() {
  const { userPreferences } = useUserPreferences();
  const location = useLocation();

  // Show smoke effect if enabled
  const showSmoke = userPreferences.smokeEffect;

  return (
    <div className={`min-h-screen bg-background ${userPreferences.liquidGlassMode ? 'liquid-glass' : ''}`}>
      {showSmoke && <FluidSmokeEffect />}
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
            <UserPreferencesProvider> {/* Added UserPreferencesProvider */}
              <AuthProvider>
                <Router>
                  <GoogleAnalyticsTracker />
                  <AppContent />
                </Router>
              </AuthProvider>
            </UserPreferencesProvider> {/* Closed UserPreferencesProvider */}
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
