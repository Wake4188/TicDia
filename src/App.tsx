import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "@/components/ui/toaster";
import { CookieConsent } from "@/components/CookieConsent";

// Lazy load analytics for better performance
const Analytics = lazy(() => import("@vercel/analytics/react").then(mod => ({ default: mod.Analytics })).catch(() => ({ default: () => null })));
const SpeedInsights = lazy(() => import("@vercel/speed-insights/react").then(mod => ({ default: mod.SpeedInsights })).catch(() => ({ default: () => null })));

// Lazy load all pages for code splitting with error handling
const Index = lazy(() => import("./pages/Index").catch(() => import("./pages/Index")));
const Discover = lazy(() => import("./pages/Discover").catch(() => import("./pages/Discover")));
const Auth = lazy(() => import("./pages/Auth").catch(() => import("./pages/Auth")));
const Profile = lazy(() => import("./pages/Profile").catch(() => import("./pages/Profile")));
const Today = lazy(() => import("./pages/Today").catch(() => import("./pages/Today")));
const Recap = lazy(() => import("./pages/Recap").catch(() => import("./pages/Recap")));

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

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <Router>
                <div className="min-h-screen bg-background">
                  <Suspense fallback={
                    <div className="h-screen w-screen flex items-center justify-center bg-background">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading"></div>
                        <div className="text-foreground text-lg">Loading TicDia...</div>
                      </div>
                    </div>
                  }>
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
                  <Suspense fallback={null}>
                    <Analytics />
                    <SpeedInsights />
                  </Suspense>
                </div>
              </Router>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
