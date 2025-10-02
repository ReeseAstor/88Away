/**
 * Calculate word count from HTML content
 * Strips HTML tags, decodes entities, splits on whitespace
 * Works on both browser and Node.js environments
 */
export function calculateWordCount(htmlContent: string): number {
  if (!htmlContent) return 0;
  
  // Strip HTML tags
  const textWithEntities = htmlContent.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities manually (for Node.js compatibility)
  let text = textWithEntities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…');
  
  // Treat punctuation as word separators (per architect requirement)
  // Replace em-dash, en-dash, ellipsis with spaces
  text = text
    .replace(/—/g, ' ')  // em dash
    .replace(/–/g, ' ')  // en dash
    .replace(/…/g, ' ')  // ellipsis
    .replace(/\.\.\./g, ' ')  // three dots
    .trim();
  
  if (!text) return 0;
  
  // Split on whitespace and filter empty strings
  const words = text.split(/\s+/).filter(s => s.length > 0);
  return words.length;
}
