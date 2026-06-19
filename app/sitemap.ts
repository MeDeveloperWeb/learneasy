import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { SITE_URL, paperPath, topicPath } from '@/lib/seo';

// Regenerate hourly so newly added papers/topics get discovered without a deploy.
export const revalidate = 3600;

// Lists every indexable URL for Google. Topic pages are the priority: this is
// what gets each topic discovered & crawled so it can rank.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const home: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  try {
    const [papers, topics] = await Promise.all([
      prisma.paper.findMany({ select: { id: true, title: true, createdAt: true } }),
      prisma.topic.findMany({ select: { id: true, title: true, createdAt: true } }),
    ]);

    const paperEntries: MetadataRoute.Sitemap = papers.map((p) => ({
      url: `${SITE_URL}${paperPath(p.id, p.title)}`,
      lastModified: p.createdAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const topicEntries: MetadataRoute.Sitemap = topics.map((t) => ({
      url: `${SITE_URL}${topicPath(t.id, t.title)}`,
      lastModified: t.createdAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...home, ...paperEntries, ...topicEntries];
  } catch {
    // DB unavailable at build/edge — still emit a valid sitemap with the home URL.
    return home;
  }
}
