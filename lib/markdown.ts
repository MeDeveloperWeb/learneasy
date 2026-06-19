// Markdown renderers for AI/LLM consumption. Every topic & paper page has a
// `.md` twin (served via middleware -> /api/md) plus a site-wide /llms.txt index.
// LLMs and agents get clean, structured text instead of HTML/JS noise — the core
// of "GEO"/AEO (generative-/answer-engine optimization).

import { SITE_NAME, absoluteUrl, topicPath, paperPath } from './seo';

/** Lightweight HTML -> plain text. Keeps block breaks; drops tags/entities. */
export function htmlToText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|ul|ol|table)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Minimal shapes (kept loose so callers can pass Prisma results directly).
type ResourceLike = {
  name: string;
  contentType: string;
  url?: string | null;
  description?: string | null;
  fileUrl?: string | null;
  textContent?: string | null;
  username?: string | null;
  likesCount?: number;
};

type TopicLike = {
  id: string;
  title: string;
  unit: { title: string; paper: { id: string; title: string } };
};

type PaperLike = {
  id: string;
  title: string;
  code?: string | null;
  credit?: string | null;
  units: {
    title: string;
    topics: { id: string; title: string; _count?: { resources: number } }[];
  }[];
};

/** Full Markdown document for a single topic, including its resources. */
export function topicMarkdown(topic: TopicLike, resources: ResourceLike[]): string {
  const paper = topic.unit.paper;
  const url = absoluteUrl(topicPath(topic.id, topic.title));
  const lines: string[] = [];

  lines.push(`# ${topic.title}`);
  lines.push('');
  lines.push(
    `> Study topic in **${paper.title}** › ${topic.unit.title}. ` +
    `Community-curated learning resources on ${SITE_NAME}.`
  );
  lines.push('');
  lines.push(`- Subject/Paper: [${paper.title}](${absoluteUrl(paperPath(paper.id, paper.title))})`);
  lines.push(`- Unit: ${topic.unit.title}`);
  lines.push(`- Canonical URL: ${url}`);
  lines.push('');
  lines.push(`## Resources (${resources.length})`);
  lines.push('');

  if (resources.length === 0) {
    lines.push('_No resources have been added for this topic yet._');
  }

  for (const r of resources) {
    lines.push(`### ${r.name}`);
    const meta: string[] = [`Type: ${r.contentType}`];
    if (typeof r.likesCount === 'number') meta.push(`Likes: ${r.likesCount}`);
    if (r.username) meta.push(`Added by: ${r.username}`);
    lines.push(`_${meta.join(' · ')}_`);
    lines.push('');
    if (r.url) lines.push(`Link: ${r.url}`);
    if (r.fileUrl) lines.push(`File: ${r.fileUrl}`);
    if (r.description) {
      lines.push('');
      lines.push(r.description);
    }
    if (r.contentType === 'TEXT' && r.textContent) {
      lines.push('');
      lines.push(htmlToText(r.textContent));
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(`_Source: ${SITE_NAME} (${absoluteUrl('/')}). Markdown for AI/LLM use._`);
  return lines.join('\n');
}

/** Full Markdown document for a paper: its units and topics. */
export function paperMarkdown(paper: PaperLike): string {
  const url = absoluteUrl(paperPath(paper.id, paper.title));
  const totalTopics = paper.units.reduce((n, u) => n + u.topics.length, 0);
  const lines: string[] = [];

  const code = paper.code ? ` (${paper.code})` : '';
  lines.push(`# ${paper.title}${code}`);
  lines.push('');
  lines.push(
    `> ${paper.units.length} units, ${totalTopics} topics. ` +
    `Study notes, resources and past papers on ${SITE_NAME}.`
  );
  lines.push('');
  if (paper.credit) lines.push(`- Credits: ${paper.credit}`);
  lines.push(`- Canonical URL: ${url}`);
  lines.push('');

  for (const unit of paper.units) {
    lines.push(`## ${unit.title}`);
    lines.push('');
    if (unit.topics.length === 0) {
      lines.push('_No topics yet._');
    }
    for (const t of unit.topics) {
      const count = t._count?.resources ?? 0;
      lines.push(`- [${t.title}](${absoluteUrl(topicPath(t.id, t.title))}) — ${count} resources`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(`_Source: ${SITE_NAME} (${absoluteUrl('/')}). Markdown for AI/LLM use._`);
  return lines.join('\n');
}
