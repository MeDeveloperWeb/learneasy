// Cached read paths for the page render tree. Every Prisma call a page makes on
// render goes through here, wrapped in unstable_cache + a tag. Result: the first
// request fills the Data Cache, every later request renders with zero DB round
// trip. Writes bust the matching tag (lib/revalidation.ts) so updates are instant.

import { unstable_cache } from 'next/cache';
import { prisma } from './prisma';
import { tags, REVALIDATE } from './cache-tags';

type SortDir = 'asc' | 'desc';

/** Home: all papers + unit counts, sorted by exam date. */
export const getPapers = unstable_cache(
  async (direction: SortDir) =>
    prisma.paper.findMany({
      orderBy: { examDate: { sort: direction, nulls: 'last' } },
      include: { _count: { select: { units: true } } },
    }),
  ['papers'],
  { tags: [tags.papers()], revalidate: REVALIDATE }
);

/** Paper page: units -> topics -> resource counts. */
export const getPaper = (id: string) =>
  unstable_cache(
    async () =>
      prisma.paper.findUnique({
        where: { id },
        include: {
          units: {
            orderBy: { createdAt: 'asc' },
            include: {
              topics: {
                orderBy: { order: 'asc' },
                include: { _count: { select: { resources: true } } },
              },
            },
          },
        },
      }),
    ['paper', id],
    { tags: [tags.paper(id)], revalidate: REVALIDATE }
  )();

/** Topic page: the topic + its unit + paper (for breadcrumb / header). */
export const getTopic = (id: string) =>
  unstable_cache(
    async () =>
      prisma.topic.findUnique({
        where: { id },
        include: { unit: { include: { paper: true } } },
      }),
    ['topic', id],
    { tags: [tags.topic(id)], revalidate: REVALIDATE }
  )();

/**
 * Topic page: resource cards. Includes the full like-userId list (NOT
 * per-user state) — `isLiked` is derived client-side in ResourceCard, so this
 * payload is identical for every visitor and safe to share-cache.
 */
export const getTopicResources = (topicId: string) =>
  unstable_cache(
    async () =>
      prisma.resource.findMany({
        where: { topicId },
        orderBy: [{ likesCount: 'desc' }, { createdAt: 'desc' }],
        include: { likes: { select: { userId: true } } },
      }),
    ['resources', topicId],
    { tags: [tags.resources(topicId)], revalidate: REVALIDATE }
  )();

/** Topic page: sibling topics in the unit, for prev/next navigation. */
export const getUnitTopics = (unitId: string) =>
  unstable_cache(
    async () =>
      prisma.topic.findMany({
        where: { unitId },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, title: true },
      }),
    ['unit-topics', unitId],
    { tags: [tags.unit(unitId)], revalidate: REVALIDATE }
  )();
