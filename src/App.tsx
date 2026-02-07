import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "@/components/ui/toaster";
import { GoogleAnalyticsTracker } from "./components/GoogleAnalyticsTracker";
import { useReferralTracking } from "./hooks/useReferralTracking";

import { useUserPreferences, UserPreferencesProvider } from "./contexts/UserPreferencesContext";

// Lazy load non-critical UI that isn't needed for initial render
const CookieConsent = lazy(() => import("./components/CookieConsent").then(m => ({ default: m.CookieConsent })));
const AnnouncementDisplay = lazy(() => import("./components/AnnouncementDisplay").then(m => ({ default: m.AnnouncementDisplay })));

// Lazy load all pages for code splitting with error handling
const Index = lazy(() => import("./pages/Index"));
const Discover = lazy(() => import("./pages/Discover"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Today = lazy(() => import("./pages/Today"));
const Recap = lazy(() => import("./pages/Recap"));
const WordFeed = lazy(() => import("./pages/WordFeed"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));

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

// Component to track referrals
function ReferralTrackerComponent() {
  useReferralTracking();
  return null;
}

function AppContent() {
  const { userPreferences } = useUserPreferences();
  const [showSmoke, setShowSmoke] = useState(false);

  // Defer smoke effect loading using requestIdleCallback for lower priority
  useEffect(() => {
    if (userPreferences.smokeEffect) {
      // Use requestIdleCallback for truly idle-time loading
      const loadSmoke = () => setShowSmoke(true);
      if ('requestIdleCallback' in window) {
        const id = requestIdleCallback(loadSmoke, { timeout: 5000 });
        return () => cancelIdleCallback(id);
      } else {
        // Fallback for Safari
        const timer = setTimeout(loadSmoke, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setShowSmoke(false);
    }
  }, [userPreferences.smokeEffect]);

  return (
    <div 
      className={`min-h-screen bg-background ${userPreferences.liquidGlassMode ? 'liquid-glass' : ''}`}
      style={{ contain: 'layout style' }}
    >
      {/* Announcements from admin panel - lazy loaded */}
      <Suspense fallback={null}>
        <AnnouncementDisplay />
      </Suspense>
      
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
          <Route path="/word-feed" element={<WordFeed />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Suspense>
      <Toaster />
      <Suspense fallback={null}>
        <CookieConsent />
      </Suspense>
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
                  <ReferralTrackerComponent />
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
