import React from 'react';
import { sanitizeMediaWikiHtml } from '@/utils/htmlSanitizer';
import { cn } from '@/lib/utils';

interface SanitizedHtmlProps {
  html: string;
  className?: string;
}

/**
 * Component to safely render sanitized MediaWiki HTML content
 * Preserves italics, links, and bold text while removing MediaWiki-specific attributes
 */
const SanitizedHtml: React.FC<SanitizedHtmlProps> = ({ html, className }) => {
  const sanitizedHtml = sanitizeMediaWikiHtml(html);
  
  return (
    <span 
      className={cn(
        // Link styling
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:opacity-80 [&_a]:transition-opacity",
        // Italic styling
        "[&_i]:italic [&_em]:italic",
        // Bold styling
        "[&_b]:font-bold [&_strong]:font-bold",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default SanitizedHtml;
