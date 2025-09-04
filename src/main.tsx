
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker, addResourceHints } from './utils/performance'

// Register service worker for PWA functionality
registerServiceWorker();

// Add performance resource hints
addResourceHints();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
