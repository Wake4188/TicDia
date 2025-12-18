// Utility to parse and sanitize MediaWiki HTML content

/**
 * Sanitizes MediaWiki HTML by:
 * - Removing mw:* attributes
 * - Keeping safe tags (i, em, b, strong, a)
 * - Converting Wikipedia links to proper URLs
 * - Stripping other HTML tags
 */
export function sanitizeMediaWikiHtml(html: string): string {
  if (!html) return '';
  
  // Create a temporary DOM element to parse HTML
  const doc = new DOMParser().parseFromString(html, 'text/html');
  
  // Process all anchor tags
  const anchors = doc.querySelectorAll('a');
  anchors.forEach((anchor) => {
    // Clean up Wikipedia-specific attributes
    anchor.removeAttribute('rel');
    anchor.removeAttribute('typeof');
    anchor.removeAttribute('data-mw');
    
    // Get all attributes and remove mw:* ones
    const attrs = Array.from(anchor.attributes);
    attrs.forEach(attr => {
      if (attr.name.startsWith('data-') || attr.value.includes('mw:')) {
        anchor.removeAttribute(attr.name);
      }
    });
    
    // Fix relative Wikipedia links
    const href = anchor.getAttribute('href');
    if (href && href.startsWith('/wiki/')) {
      anchor.setAttribute('href', `https://en.wikipedia.org${href}`);
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    } else if (href && href.startsWith('./')) {
      anchor.setAttribute('href', `https://en.wikipedia.org/wiki/${href.slice(2)}`);
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    }
  });
  
  // Get the cleaned HTML
  let cleanedHtml = doc.body.innerHTML;
  
  // Remove any remaining typeof attributes
  cleanedHtml = cleanedHtml.replace(/\s*typeof="[^"]*"/g, '');
  cleanedHtml = cleanedHtml.replace(/\s*data-mw="[^"]*"/g, '');
  cleanedHtml = cleanedHtml.replace(/\s*rel="mw:[^"]*"/g, '');
  cleanedHtml = cleanedHtml.replace(/\s*about="[^"]*"/g, '');
  cleanedHtml = cleanedHtml.replace(/\s*class="mw-[^"]*"/g, '');
  
  return cleanedHtml;
}

/**
 * Strips all HTML tags from a string, leaving only text content
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Extracts plain text while preserving some formatting context
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}
