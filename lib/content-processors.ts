/**
 * Website-specific content processors
 * Handles special cases and transformations for different websites
 */

/**
 * Process GeeksforGeeks content
 * - Converts <gfg-tex> tags to KaTeX delimiters ($$)
 * - Decodes HTML entities
 */
export function processGeeksforGeeksContent(content: string): string {
  return content
    .replace(/<gfg-tex>/g, '$$')
    .replace(/<\/gfg-tex>/g, '$$')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * Apply all content processors based on the source URL
 */
export function processContent(content: string, sourceUrl: string): string {
  const url = new URL(sourceUrl);
  const hostname = url.hostname.toLowerCase();

  // GeeksforGeeks
  if (hostname.includes('geeksforgeeks.org')) {
    return processGeeksforGeeksContent(content);
  }

  // Apply generic math tag conversions for any site that might use gfg-tex tags
  // or similar custom math notation
  if (content.includes('<gfg-tex>')) {
    return processGeeksforGeeksContent(content);
  }

  // Add more website-specific processors here as needed
  // Example:
  // if (hostname.includes('medium.com')) {
  //   return processMediumContent(content);
  // }

  return content;
}
