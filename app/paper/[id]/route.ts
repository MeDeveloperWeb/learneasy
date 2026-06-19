import { NextRequest, NextResponse } from 'next/server';
import { getPaper } from '@/lib/queries';
import { paperPath } from '@/lib/seo';

// Short, shareable URL: GET /paper/<id> (no slug). A Route Handler so it returns
// a REAL HTTP 308 to the canonical /paper/<id>/<slug>. id is the key; slug is
// derived from the current title, so shared links never 404.
export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const paper = await getPaper(id);

    if (!paper) {
        return new NextResponse('Paper not found', { status: 404 });
    }

    return NextResponse.redirect(new URL(paperPath(id, paper.title), request.url), 308);
}
