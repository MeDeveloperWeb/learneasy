import { NextRequest, NextResponse } from 'next/server';

// Markdown twins for AI/LLM agents: any topic/paper URL with a `.md` suffix is
// rewritten to /api/md, which returns clean Markdown of that page's content.
// e.g. /topic/<id>/<slug>.md  ->  /api/md?path=/topic/<id>/<slug>
// The rewrite is internal — the public URL keeps the `.md` form. Middleware does
// no DB work (Edge-safe); the route handler it targets does the lookup in Node.
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.endsWith('.md')) {
        // Encode the page path in the URL *path* (not query): on a rewrite the
        // destination reads route params from the rewritten path, but its
        // searchParams still reflect the original request. So target the catch-all
        // /api/md/<type>/<id>/<slug>.  /topic/<id>/<slug>.md -> /api/md/topic/<id>/<slug>
        const url = request.nextUrl.clone();
        url.pathname = `/api/md${pathname.slice(0, -3)}`; // drop ".md", prefix /api/md
        return NextResponse.rewrite(url);
    }

    return NextResponse.next();
}

export const config = {
    // Only topic/paper pages have Markdown twins.
    matcher: ['/topic/:path*', '/paper/:path*'],
};
