
// Security utility functions for input validation and sanitization

export const sanitizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== 'string') {
    return '';
  }
  
  // Remove potentially dangerous characters and HTML tags
  return query
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, (char) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char] || char;
    })
    .trim()
    .slice(0, 200); // Limit length to prevent abuse
};

export const validateFontFamily = (fontFamily: string): string => {
  const allowedFonts = [
    'Inter',
    'Arial',
    'Helvetica',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Trebuchet MS',
    'Palatino',
    'Garamond'
  ];
  
  if (!fontFamily || typeof fontFamily !== 'string') {
    return 'Inter';
  }
  
  const sanitized = fontFamily.trim();
  return allowedFonts.includes(sanitized) ? sanitized : 'Inter';
};

export const validateBackgroundOpacity = (opacity: number): number => {
  if (typeof opacity !== 'number' || isNaN(opacity)) {
    return 70;
  }
  
  // Ensure opacity is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(opacity)));
};

export const validateHexColor = (color: string): string => {
  if (!color || typeof color !== 'string') {
    return '#FE2C55';
  }
  
  // Remove any whitespace and ensure it starts with #
  const sanitized = color.trim();
  
  // Check if it's a valid hex color (3 or 6 digits after #)
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  
  if (hexPattern.test(sanitized)) {
    return sanitized;
  }
  
  // Return default color if invalid
  return '#FE2C55';
};

export const sanitizeErrorMessage = (error: any): string => {
  if (!error) {
    return 'An unexpected error occurred';
  }
  
  if (typeof error === 'string') {
    return error.replace(/\b(password|token|key|secret)\b/gi, '[REDACTED]');
  }
  
  if (error.message) {
    return String(error.message).replace(/\b(password|token|key|secret)\b/gi, '[REDACTED]');
  }
  
  return 'An unexpected error occurred';
};

export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 254;
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'Password is too long' };
  }
  
  return { isValid: true };
};
