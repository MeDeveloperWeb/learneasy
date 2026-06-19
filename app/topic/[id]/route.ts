import { NextRequest, NextResponse } from 'next/server';
import { getTopic } from '@/lib/queries';
import { topicPath } from '@/lib/seo';

// Short, shareable URL: GET /topic/<id> (no slug). A Route Handler (not a page)
// so it returns a REAL HTTP 308 to the canonical /topic/<id>/<slug> — pages under
// streaming fall back to a <meta refresh>, which is weaker for SEO. The id is the
// key; the slug is derived from the current title, so shared links never 404 and
// always land on the single keyword-rich indexable URL.
export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const topic = await getTopic(id);

    if (!topic) {
        return new NextResponse('Topic not found', { status: 404 });
    }

    // Build the target on the request's own origin (works on localhost & prod).
    return NextResponse.redirect(new URL(topicPath(id, topic.title), request.url), 308);
}
