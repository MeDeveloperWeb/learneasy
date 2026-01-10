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
    // Use linkedom for serverless-friendly HTML parsing
    const { parseHTML } = await import('linkedom');

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

    // Parse with linkedom
    const dom = parseHTML(html);
    const { document } = dom;

    // Manually set the document URL for Readability
    Object.defineProperty(document, 'URL', {
      value: targetUrl,
      writable: false,
      configurable: true
    });

    // Check for common React/Next.js SSR content locations
    const nextData = document?.getElementById('__NEXT_DATA__');

    // Clone document to preserve original
    const documentClone = document.cloneNode(true);

    const reader = new Readability(documentClone, {
      keepClasses: true,
      classesToPreserve: [
        'highlight', 'code', 'hljs', 'language-', 'prettyprint',
        'syntax', 'sourceCode', 'codehilite', 'code-block',
        'table', 'data-table'
      ],
      nbTopCandidates: 10,
      charThreshold: 100,
    });
    const article = reader.parse();

    if (!article) {
      // Try to extract from __NEXT_DATA__ for Next.js sites
      if (nextData) {
        try {
          const nextDataContent = JSON.parse(nextData.textContent || '{}');

          // GeeksforGeeks and similar sites store content in props
          const pageProps = nextDataContent?.props?.pageProps;
          if (pageProps) {
            // GeeksforGeeks specific extraction
            const postData = pageProps.postDataFromWriteApi;
            const articleContentArray = pageProps.articleContentArray;
            const postTitle = pageProps.postTitle;
            const authorData = pageProps.authorData;

            if (postData || articleContentArray) {
              let content = '';

              // Try to build content from articleContentArray
              if (Array.isArray(articleContentArray)) {
                content = articleContentArray.map((item: any) => {
                  if (typeof item === 'string') return item;
                  if (item?.content) return item.content;
                  if (item?.html) return item.html;
                  return '';
                }).join('\n');
              } else if (typeof postData === 'object' && postData?.content) {
                content = postData.content;
              }

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
          // Silent fail on __NEXT_DATA__ parsing
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
