// Input validation and sanitization utilities

export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'Password must be less than 128 characters' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)' };
  }
  
  return { isValid: true, message: 'Password is valid' };
};

export const sanitizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== 'string') return '';
  
  // Remove HTML tags and limit length
  const sanitized = query
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>&"']/g, (match) => {  // Escape dangerous characters
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return escapeMap[match] || match;
    })
    .trim()
    .substring(0, 200); // Limit length
  
  return sanitized;
};

export const validateFontFamily = (fontFamily: string): string => {
  if (!fontFamily || typeof fontFamily !== 'string') return 'Inter';
  
  const allowedFonts = [
    'Inter', 'Georgia', 'Times New Roman', 'Arial', 
    'Helvetica', 'Verdana', 'Open Sans', 'Roboto'
  ];
  
  return allowedFonts.includes(fontFamily) ? fontFamily : 'Inter';
};

export const validateBackgroundOpacity = (opacity: number): number => {
  if (typeof opacity !== 'number' || isNaN(opacity)) return 70;
  return Math.max(10, Math.min(100, Math.round(opacity)));
};

export const validateHexColor = (color: string): string => {
  if (!color || typeof color !== 'string') return '#FE2C55';
  
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color) ? color : '#FE2C55';
};

export const sanitizeErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred';
  
  if (typeof error === 'string') {
    return error.substring(0, 200);
  }
  
  if (error.message && typeof error.message === 'string') {
    // Remove potential sensitive information
    const sanitized = error.message
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]') // IP addresses
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]') // Email addresses
      .replace(/\b[A-Za-z0-9]{20,}\b/g, '[TOKEN]') // Potential tokens
      .substring(0, 200);
    
    return sanitized || 'An error occurred';
  }
  
  return 'An error occurred';
};

export const validateUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};
