import { NextResponse } from 'next/server';
import { getTopic, getTopicResources, getPaper } from '@/lib/queries';
import { topicMarkdown, paperMarkdown } from '@/lib/markdown';

// Serves the Markdown twin of a topic/paper page. Reached only via middleware,
// which rewrites `<page-url>.md` -> `/api/md/<type>/<id>/<slug>`. Data comes from
// the same cached queries the HTML pages use — no extra DB load after the first
// hit, and updates ride the same on-demand cache tags.

function markdown(body: string) {
    return new NextResponse(body, {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            // The HTML page is the indexable canonical; this twin is for agents.
            'X-Robots-Tag': 'noindex',
        },
    });
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ path: string[] }> },
) {
    const { path } = await params;
    const [type, id] = path; // ['topic'|'paper', '<id>', '<slug>'?]

    if (type === 'topic' && id) {
        const topic = await getTopic(id);
        if (!topic) return new NextResponse('Topic not found', { status: 404 });
        const resources = await getTopicResources(id);
        return markdown(topicMarkdown(topic, resources));
    }

    if (type === 'paper' && id) {
        const paper = await getPaper(id);
        if (!paper) return new NextResponse('Paper not found', { status: 404 });
        return markdown(paperMarkdown(paper));
    }

    return new NextResponse('Not found', { status: 404 });
}
