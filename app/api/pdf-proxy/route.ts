import { NextRequest, NextResponse } from 'next/server';

// Stream a remote PDF through our own origin.
// Why: cross-origin PDFs (e.g. cs.brown.edu) send X-Frame-Options / CSP
// frame-ancestors, so Chrome refuses to render them inside our <embed>.
// Fetching server-side and re-serving same-origin bypasses both the frame
// restriction and CORS — the browser's native PDF viewer then just works.

export const dynamic = 'force-dynamic';

// Block obvious SSRF targets (loopback, link-local, private ranges).
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h === '0.0.0.0') return true;
  if (h === '169.254.169.254') return true; // cloud metadata
  // IPv4 private / loopback ranges
  if (/^127\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  // IPv6 loopback / link-local / unique-local
  if (h === '::1' || h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd')) return true;
  return false;
}

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get('url');

  if (!target) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only http/https allowed' }, { status: 400 });
  }

  if (isBlockedHost(parsed.hostname)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
  }

  try {
    const range = request.headers.get('range');
    const upstream = await fetch(parsed.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: {
        // Some servers 403 requests without a browser-like UA.
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'application/pdf,*/*',
        ...(range ? { Range: range } : {}),
      },
    });

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { error: `Upstream responded ${upstream.status}` },
        { status: 502 }
      );
    }

    // Re-serve same-origin, dropping any frame-blocking headers.
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', 'inline');
    headers.set('Cache-Control', 'private, max-age=3600');
    headers.set('Accept-Ranges', upstream.headers.get('accept-ranges') ?? 'bytes');

    const len = upstream.headers.get('content-length');
    if (len) headers.set('Content-Length', len);
    const contentRange = upstream.headers.get('content-range');
    if (contentRange) headers.set('Content-Range', contentRange);

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    console.error('[pdf-proxy] fetch failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch PDF' },
      { status: 502 }
    );
  }
}
