// Write paths call these after a mutation to bust the matching cached read
// (lib/queries.ts) so the static/ISR pages regenerate with fresh data on the
// next request. revalidateTag is cheap: it only marks cache entries stale.

import { revalidateTag } from 'next/cache';
import { prisma } from './prisma';
import { tags } from './cache-tags';

// Next 16 requires a cache-life profile on revalidateTag. `{ expire: 0 }` means
// "expire immediately" — a full, read-your-own-writes purge so the very next
// request rebuilds (vs. the 'max' profile, which serves stale once first).
const PURGE = { expire: 0 } as const;

function purge(tag: string) {
  revalidateTag(tag, PURGE);
}

export function bustPapers() {
  purge(tags.papers());
}

export function bustPaper(paperId: string) {
  purge(tags.paper(paperId));
}

export function bustUnit(unitId: string) {
  purge(tags.unit(unitId));
}

export function bustTopic(topicId: string) {
  purge(tags.topic(topicId));
}

export function bustResources(topicId: string) {
  purge(tags.resources(topicId));
}

/**
 * Topic title/order/existence changed: bust the topic's own page, every
 * sibling's prev/next nav (unit tag), and the parent paper page (topic list).
 * Looks the tree up by id, so call BEFORE deleting the topic.
 */
export async function bustTopicTree(topicId: string) {
  const t = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { unitId: true, unit: { select: { paperId: true } } },
  });
  bustTopic(topicId);
  if (t?.unitId) bustUnit(t.unitId);
  if (t?.unit?.paperId) bustPaper(t.unit.paperId);
}

/**
 * Resource added/removed: the paper page shows a per-topic resource count, so
 * bust the owning paper too. (Edits and likes don't change the count.)
 */
export async function bustPaperOfTopic(topicId: string) {
  const t = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { unit: { select: { paperId: true } } },
  });
  if (t?.unit?.paperId) bustPaper(t.unit.paperId);
}
