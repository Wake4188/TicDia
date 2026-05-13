
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker, addResourceHints } from './utils/performance'
import { errorTracker } from './utils/errorTracking'

// Initialize error tracking
errorTracker;

// Register service worker for PWA functionality
registerServiceWorker();

// Add performance resource hints
addResourceHints();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)
