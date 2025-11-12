import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Lazy load analytics for better performance
const Analytics = lazy(() => import("@vercel/analytics/react").then(mod => ({ default: mod.Analytics })));
const SpeedInsights = lazy(() => import("@vercel/speed-insights/react").then(mod => ({ default: mod.SpeedInsights })));
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "@/components/ui/toaster";
import { CookieConsent } from "@/components/CookieConsent";

// Lazy load all pages for code splitting
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-black">
                <Suspense fallback={
                  <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
                    <div className="animate-pulse">Loading...</div>
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
  );
}

export default App;
