
// Content Security Policy utilities

export const getCSPDirectives = () => {
  const directives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://vercel.live"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
    'img-src': ["'self'", "data:", "https:", "http:"],
    'media-src': ["'self'", "https:", "http:"],
    'connect-src': ["'self'", "https://api.openai.com", "https://*.supabase.co", "https://en.wikipedia.org", "wss://*.supabase.co"],
    'frame-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  };

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
};

export const setSecurityHeaders = () => {
  // Note: These would typically be set at the server level
  // This is for documentation and potential future server-side implementation
  const headers = {
    'Content-Security-Policy': getCSPDirectives(),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  };

  return headers;
};
