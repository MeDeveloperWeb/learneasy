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
    console.log('[Reader API] Starting fetch for URL:', targetUrl);

    // Use linkedom for serverless-friendly HTML parsing
    console.log('[Reader API] Importing linkedom...');
    const { parseHTML } = await import('linkedom');
    console.log('[Reader API] Linkedom imported successfully');

    // Fetch the webpage
    console.log('[Reader API] Fetching webpage...');
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MissionCS Reader/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log('[Reader API] Fetched HTML, length:', html.length);

    // Parse with linkedom
    console.log('[Reader API] Parsing HTML with linkedom...');
    const { document } = parseHTML(html);
    console.log('[Reader API] HTML parsed successfully');

    // Extract article content with Readability
    // Configure to preserve code blocks, tables, and other structural elements
    console.log('[Reader API] Initializing Readability...');
    const reader = new Readability(document, {
      keepClasses: true,
      classesToPreserve: [
        'highlight', 'code', 'hljs', 'language-', 'prettyprint',
        'syntax', 'sourceCode', 'codehilite', 'code-block',
        'table', 'data-table'
      ],
      nbTopCandidates: 10,
      charThreshold: 0, // Don't filter by length
    });
    console.log('[Reader API] Parsing article with Readability...');
    const article = reader.parse();
    console.log('[Reader API] Article parsed successfully');

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
    console.error('[Reader API] Error occurred:', error);
    console.error('[Reader API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[Reader API] Error type:', error instanceof Error ? error.constructor.name : typeof error);

    return NextResponse.json(
      {
        error: 'Failed to fetch or parse the article',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
