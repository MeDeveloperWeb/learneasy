import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json(
      { error: 'Missing URL parameter' },
      { status: 400 }
    );
  }

  // Check if this is an internal URL (relative or same origin)
  const isInternalUrl = targetUrl.startsWith('/') ||
                        targetUrl.startsWith(request.nextUrl.origin);

  if (isInternalUrl) {
    // Internal URLs are always embeddable
    return NextResponse.json({
      canEmbed: true,
      reason: 'Internal URL - always embeddable',
    });
  }

  try {
    // Do a HEAD request to check headers without downloading the full page
    const response = await fetch(targetUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MissionCS/1.0)',
      },
      // Don't follow redirects - we want to check the final destination
      redirect: 'follow',
    });

    // Check X-Frame-Options header
    const xFrameOptions = response.headers.get('x-frame-options');
    if (xFrameOptions) {
      const value = xFrameOptions.toLowerCase();
      if (value === 'deny' || value === 'sameorigin') {
        return NextResponse.json({
          canEmbed: false,
          reason: `X-Frame-Options: ${xFrameOptions}`,
        });
      }
    }

    // Check Content-Security-Policy header
    const csp = response.headers.get('content-security-policy');
    if (csp) {
      const cspLower = csp.toLowerCase();
      // Check for frame-ancestors directive
      if (cspLower.includes('frame-ancestors')) {
        if (cspLower.includes("frame-ancestors 'none'") ||
            cspLower.includes("frame-ancestors 'self'")) {
          return NextResponse.json({
            canEmbed: false,
            reason: 'Content-Security-Policy restricts framing',
          });
        }
      }
    }

    // No blocking headers found
    return NextResponse.json({
      canEmbed: true,
      reason: 'No blocking headers detected',
    });

  } catch (error) {
    console.error('Error checking iframe compatibility:', error);
    return NextResponse.json(
      {
        canEmbed: 'unknown',
        reason: 'Failed to check headers',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
