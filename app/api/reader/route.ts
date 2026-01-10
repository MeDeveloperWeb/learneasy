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
    const dom = parseHTML(html);
    const { document } = dom;

    // Manually set the document URL for Readability
    Object.defineProperty(document, 'URL', {
      value: targetUrl,
      writable: false,
      configurable: true
    });

    console.log('[Reader API] HTML parsed successfully');

    // Extract article content with Readability
    // Configure to preserve code blocks, tables, and other structural elements
    console.log('[Reader API] Initializing Readability...');
    console.log('[Reader API] Document type:', document?.constructor?.name);
    console.log('[Reader API] Document has body:', !!document?.body);
    console.log('[Reader API] Document URL:', document?.URL);
    console.log('[Reader API] Body text length:', document?.body?.textContent?.length);

    // Check for common React/Next.js SSR content locations
    const nextData = document?.getElementById('__NEXT_DATA__');
    const mainContent = document?.querySelector('main, article, [role="main"]');
    console.log('[Reader API] Has __NEXT_DATA__:', !!nextData);
    console.log('[Reader API] Main content element:', mainContent?.tagName);
    console.log('[Reader API] Main content text length:', mainContent?.textContent?.length);

    // Check if the page is probably readerable
    const { isProbablyReaderable } = await import('@mozilla/readability');
    const isReaderable = isProbablyReaderable(document);
    console.log('[Reader API] Is page readerable:', isReaderable);

    // Clone document to preserve original
    const documentClone = document.cloneNode(true);

    const reader = new Readability(documentClone, {
      debug: true,
      keepClasses: true,
      classesToPreserve: [
        'highlight', 'code', 'hljs', 'language-', 'prettyprint',
        'syntax', 'sourceCode', 'codehilite', 'code-block',
        'table', 'data-table'
      ],
      nbTopCandidates: 10,
      charThreshold: 100, // Lower threshold
    });
    console.log('[Reader API] Parsing article with Readability...');
    const article = reader.parse();
    console.log('[Reader API] Article parsed, result:', article ? 'success' : 'null');

    if (article) {
      console.log('[Reader API] Article title:', article.title);
      console.log('[Reader API] Article content length:', article.content?.length);
      console.log('[Reader API] Article excerpt:', article.excerpt?.substring(0, 100));
    } else {
      console.log('[Reader API] Readability returned null - article could not be extracted');
      console.log('[Reader API] Attempting fallback extraction...');

      // Try to extract from __NEXT_DATA__ for Next.js sites
      if (nextData) {
        try {
          const nextDataContent = JSON.parse(nextData.textContent || '{}');
          console.log('[Reader API] __NEXT_DATA__ keys:', Object.keys(nextDataContent));

          // GeeksforGeeks and similar sites store content in props
          const pageProps = nextDataContent?.props?.pageProps;
          if (pageProps) {
            console.log('[Reader API] pageProps keys:', Object.keys(pageProps));

            // GeeksforGeeks specific extraction
            const postData = pageProps.postDataFromWriteApi;
            const articleContentArray = pageProps.articleContentArray;
            const postTitle = pageProps.postTitle;
            const authorData = pageProps.authorData;

            if (postData || articleContentArray) {
              let content = '';

              // Try to build content from articleContentArray
              if (Array.isArray(articleContentArray)) {
                console.log('[Reader API] Found articleContentArray with', articleContentArray.length, 'items');
                content = articleContentArray.map((item: any) => {
                  if (typeof item === 'string') return item;
                  if (item?.content) return item.content;
                  if (item?.html) return item.html;
                  return '';
                }).join('\n');
              } else if (typeof postData === 'object' && postData?.content) {
                content = postData.content;
              }

              console.log('[Reader API] Extracted content length:', content.length);

              if (content && content.length > 100) {
                // Convert GeeksforGeeks custom math tags to KaTeX delimiters
                content = content
                  .replace(/<gfg-tex>/g, '$$')
                  .replace(/<\/gfg-tex>/g, '$$')
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>');

                return NextResponse.json({
                  title: postTitle || postData?.title || document.querySelector('title')?.textContent || 'Article',
                  byline: authorData?.name || postData?.author || '',
                  content: content,
                  textContent: content.replace(/<[^>]*>/g, ''),
                  excerpt: postData?.excerpt || '',
                  siteName: 'GeeksforGeeks',
                  sourceUrl: targetUrl,
                });
              }
            }

            // Fallback for other Next.js sites
            const articleData = pageProps.article || pageProps.data || pageProps.post || pageProps.content;
            if (articleData) {
              console.log('[Reader API] Found generic article data, keys:', Object.keys(articleData));

              const fallbackArticle = {
                title: articleData.title || articleData.heading || document.querySelector('title')?.textContent || 'Article',
                content: articleData.content || articleData.body || articleData.html || '',
                excerpt: articleData.excerpt || articleData.description || '',
                byline: articleData.author || articleData.byline || '',
                siteName: new URL(targetUrl).hostname,
              };

              if (fallbackArticle.content && fallbackArticle.content.length > 100) {
                return NextResponse.json({
                  title: fallbackArticle.title,
                  byline: fallbackArticle.byline,
                  content: fallbackArticle.content,
                  textContent: fallbackArticle.content.replace(/<[^>]*>/g, ''),
                  excerpt: fallbackArticle.excerpt,
                  siteName: fallbackArticle.siteName,
                  sourceUrl: targetUrl,
                });
              }
            }
          }
        } catch (e) {
          console.log('[Reader API] Failed to parse __NEXT_DATA__:', e);
        }
      }
    }

    if (!article) {
      // Check if this is a client-side rendered site
      const isClientSideRendered = !!nextData || document?.getElementById('__next');

      return NextResponse.json(
        {
          error: isClientSideRendered
            ? 'This page uses client-side rendering and cannot be read in reader mode. Please view the original page.'
            : 'Could not extract article content from this page'
        },
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
