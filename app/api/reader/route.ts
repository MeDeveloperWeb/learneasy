import { NextRequest, NextResponse } from 'next/server';
import { Readability } from '@mozilla/readability';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json(
      { error: 'Missing URL parameter' },
      { status: 400 }
    );
  }

  try {
    // Dynamically import JSDOM to avoid ESM/CommonJS issues in serverless
    const { JSDOM } = await import('jsdom');

    // Fetch the webpage
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MissionCS Reader/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Parse with JSDOM
    const dom = new JSDOM(html, {
      url: targetUrl,
    });

    // Extract article content with Readability
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return NextResponse.json(
        { error: 'Could not extract article content from this page' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      title: article.title,
      byline: article.byline,
      content: article.content,
      textContent: article.textContent,
      excerpt: article.excerpt,
      siteName: article.siteName,
      sourceUrl: targetUrl,
    });
  } catch (error) {
    console.error('Reader mode error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch or parse the article',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
