// Utility to parse and sanitize MediaWiki HTML content
import DOMPurify from 'dompurify';

/**
 * Sanitizes MediaWiki HTML by:
 * - Using DOMPurify for secure sanitization
 * - Keeping safe tags (i, em, b, strong, a, p, br)
 * - Converting Wikipedia links to proper URLs
 * - Stripping dangerous content and attributes
 */
export function sanitizeMediaWikiHtml(html: string): string {
  if (!html) return '';
  
  // Configure DOMPurify with allowed tags and attributes
  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['i', 'em', 'b', 'strong', 'a', 'p', 'br', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus']
  });
  
  // Create a temporary DOM element to process links
  const doc = new DOMParser().parseFromString(cleanHtml, 'text/html');
  
  // Process all anchor tags to fix Wikipedia links
  const anchors = doc.querySelectorAll('a');
  anchors.forEach((anchor) => {
    const href = anchor.getAttribute('href');
    
    // Fix relative Wikipedia links
    if (href && href.startsWith('/wiki/')) {
      anchor.setAttribute('href', `https://en.wikipedia.org${href}`);
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    } else if (href && href.startsWith('./')) {
      anchor.setAttribute('href', `https://en.wikipedia.org/wiki/${href.slice(2)}`);
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    } else if (href && !href.startsWith('http')) {
      // Block non-http links for safety
      anchor.removeAttribute('href');
    } else if (href) {
      // Ensure external links open safely
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    }
  });
  
  // Get the processed HTML
  let processedHtml = doc.body.innerHTML;
  
  // Final sanitization pass to ensure no MediaWiki-specific attributes remain
  processedHtml = processedHtml.replace(/\s*typeof="[^"]*"/g, '');
  processedHtml = processedHtml.replace(/\s*data-mw="[^"]*"/g, '');
  processedHtml = processedHtml.replace(/\s*rel="mw:[^"]*"/g, '');
  processedHtml = processedHtml.replace(/\s*about="[^"]*"/g, '');
  processedHtml = processedHtml.replace(/\s*class="mw-[^"]*"/g, '');
  
  return processedHtml;
}

/**
 * Strips all HTML tags from a string, leaving only text content
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}

/**
 * Extracts plain text while preserving some formatting context
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}
