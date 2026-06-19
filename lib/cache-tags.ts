// Centralized cache-tag names. Read paths (lib/queries.ts) tag their cached
// Prisma calls with these; write paths (lib/revalidation.ts) bust the same tags
// on demand. Keep names here so reads & writes never drift.

export const tags = {
  /** Home page list of papers. */
  papers: () => 'papers',
  /** A single paper's units + topics structure (paper page). */
  paper: (id: string) => `paper-${id}`,
  /** A single topic's own data (topic page). */
  topic: (id: string) => `topic-${id}`,
  /** A topic's resource list (topic page cards). */
  resources: (topicId: string) => `resources-${topicId}`,
  /** A unit's topic list (prev/next nav on every sibling topic page). */
  unit: (unitId: string) => `unit-${unitId}`,
};

/**
 * Fallback time-based revalidation (seconds). Topics/papers rarely change, so
 * real updates ride on-demand tag busting; this is just a lazy safety net for
 * DB edits made outside the app's API routes (seed scripts, set-exam-dates.ts,
 * direct SQL) — those don't bust tags, so this self-heals them. 1 week.
 *
 * NOTE: page segment configs can't import this (Next needs a static literal),
 * so the `export const revalidate` in the paper/topic pages must be kept in
 * sync with this value by hand.
 */
export const REVALIDATE = 60 * 60 * 24 * 7;
