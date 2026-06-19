import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SITE_NAME, absoluteUrl, paperPath, topicPath } from '@/lib/seo';

// /llms.txt — a Markdown map of the whole site for LLMs/AI agents (llmstxt.org).
// Major AI *search crawlers* largely ignore this file today, but AI dev tools and
// agents that fetch it get a clean, link-rich index. Cheap to serve, refreshed
// hourly. Each entry links to the human page and its `.md` twin.
export const revalidate = 3600;

export async function GET() {
    const lines: string[] = [];
    lines.push(`# ${SITE_NAME}`);
    lines.push('');
    lines.push(
        '> Free, community-curated study hub: notes, video lectures, PDFs and past ' +
        'papers organized by subject (paper), unit and topic. Append `.md` to any ' +
        'topic or paper URL for a clean Markdown version of its content.'
    );
    lines.push('');

    try {
        const papers = await prisma.paper.findMany({
            orderBy: { title: 'asc' },
            include: {
                units: {
                    orderBy: { createdAt: 'asc' },
                    include: { topics: { orderBy: { order: 'asc' }, select: { id: true, title: true } } },
                },
            },
        });

        lines.push('## Papers');
        lines.push('');
        for (const p of papers) {
            const u = absoluteUrl(paperPath(p.id, p.title));
            lines.push(`- [${p.title}](${u}) ([Markdown](${u}.md))`);
        }
        lines.push('');

        lines.push('## Topics');
        lines.push('');
        for (const p of papers) {
            for (const unit of p.units) {
                for (const t of unit.topics) {
                    const tu = absoluteUrl(topicPath(t.id, t.title));
                    lines.push(`- [${t.title}](${tu}) — ${p.title} › ${unit.title} ([Markdown](${tu}.md))`);
                }
            }
        }
        lines.push('');
    } catch {
        // Best-effort: still return the header/summary if the DB is unavailable.
    }

    return new NextResponse(lines.join('\n'), {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
}
