// Central SEO helpers. One source of truth for the canonical site origin, URL
// slugs, and the id/slug ("Stack Overflow style") paths used for papers/topics.
//
// URLs are /paper/<id>/<slug> and /topic/<id>/<slug>. The id is the real key
// (lookups ignore the slug); the slug is human/SEO sugar generated from the
// title. Pages permanent-redirect to the canonical slug when it doesn't match,
// so the slug can change freely (title edits) without breaking old links.

/**
 * Canonical origin, no trailing slash. Set NEXT_PUBLIC_SITE_URL in the
 * environment (Vercel + .env) to override; falls back to the production domain.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://lu-cs.vercel.app'
).replace(/\/+$/, '');

/** Human-readable brand / site name, reused across titles & structured data. */
export const SITE_NAME = 'LearnEasy';

/** Make an absolute URL from a root-relative path (for canonical / OG tags). */
export function absoluteUrl(path: string): string {
  if (!path.startsWith('/')) path = `/${path}`;
  return `${SITE_URL}${path}`;
}

/**
 * Turn a title into a URL slug: lowercase, ASCII-ish, hyphen-separated.
 * Deterministic so the same title always yields the same canonical URL.
 */
export function slugify(input: string): string {
  const slug = input
    .normalize('NFKD')                 // split accents from base letters
    .replace(/[̀-ͯ]/g, '')   // drop the combining accent marks
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')       // non-alphanumerics -> hyphen
    .replace(/^-+|-+$/g, '')           // trim leading/trailing hyphens
    .slice(0, 80)
    .replace(/-+$/g, '');              // re-trim after the length cut
  return slug || 'untitled';
}

/** Canonical root-relative path for a topic page. */
export function topicPath(id: string, title: string): string {
  return `/topic/${id}/${slugify(title)}`;
}

/** Canonical root-relative path for a paper page. */
export function paperPath(id: string, title: string): string {
  return `/paper/${id}/${slugify(title)}`;
}
