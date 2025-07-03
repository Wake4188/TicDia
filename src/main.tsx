
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Security: Ensure we're running over HTTPS in production
if (import.meta.env.PROD && location.protocol !== 'https:') {
  console.warn('Application should be served over HTTPS in production');
}

// Security: Remove any potential debug information in production
if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
