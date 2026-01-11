"use client";

import { useEffect, useState, useRef } from "react";
import "katex/dist/katex.min.css";
import { useSplitScreen } from "./SplitScreenProvider";

interface Article {
  title: string;
  byline?: string;
  content: string;
  excerpt?: string;
  siteName?: string;
  sourceUrl: string;
}

interface ReaderViewProps {
  url: string;
  onClose: () => void;
}

export function ReaderView({ url, onClose }: ReaderViewProps) {
  const { canGoBack, canGoForward, goBack, goForward, openInSplitScreen, splitScreenEnabled, originalUrl, currentTopicId, currentTopicResources, setPendingResourceUrl } = useSplitScreen();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if current URL is already in topic resources
  const isResourceAlreadyAdded = originalUrl && currentTopicResources.includes(originalUrl);
  const canAddToPage = currentTopicId && originalUrl && !isResourceAlreadyAdded;

  useEffect(() => {
    async function fetchArticle() {
      setLoading(true);
      setError(null);

      // Scroll to top when new article loads
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }

      try {
        const response = await fetch(
          `/api/reader?url=${encodeURIComponent(url)}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load article');
        }

        const data = await response.json();
        setArticle(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [url]);

  // Render math formulas after article loads
  useEffect(() => {
    if (article && contentRef.current) {
      const renderMath = async () => {
        try {
          const renderMathInElement = (await import('katex/dist/contrib/auto-render.js')).default;
          renderMathInElement(contentRef.current!, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\[', right: '\\]', display: true },
              { left: '\\(', right: '\\)', display: false }
            ],
            throwOnError: false
          });
        } catch (e) {
          console.error('Math rendering error:', e);
        }
      };
      renderMath();
    }
  }, [article]);

  // Remove target="_blank" from all links and intercept clicks to open in split screen
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    // Remove target="_blank" from all links in the reader content
    const links = contentElement.querySelectorAll('a[target="_blank"]');
    links.forEach((link) => {
      link.removeAttribute('target');
    });

    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href) {
        // Only intercept if it's a regular navigation link (not anchor links)
        try {
          const linkUrl = new URL(link.href);
          const currentUrl = new URL(window.location.href);

          // Don't intercept anchor links on the same page
          if (linkUrl.pathname === currentUrl.pathname && linkUrl.hash) {
            return;
          }

          // Intercept the click and prevent default behavior
          event.preventDefault();
          event.stopPropagation();

          // Open in split screen
          openInSplitScreen(link.href);
        } catch (e) {
          // If URL parsing fails, let it navigate normally
          console.error('Error parsing URL:', e);
        }
      }
    };

    // Use capture phase to intercept before any other handlers
    contentElement.addEventListener('click', handleLinkClick, true);

    return () => {
      contentElement.removeEventListener('click', handleLinkClick, true);
    };
  }, [article, openInSplitScreen]);

  const handleAddToPage = () => {
    if (!originalUrl) return;
    // Set the pending URL to trigger the add resource modal
    setPendingResourceUrl(originalUrl);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="mb-4 p-4 bg-red-50 rounded-full">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Could not load article
        </h3>
        <p className="text-sm text-gray-600 mb-6 max-w-md">
          {error}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-all"
          >
            Close
          </button>
          <a
            href={originalUrl || url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-teal-400
                     text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Open original
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div ref={containerRef} className="h-full overflow-auto bg-white">
      <style dangerouslySetInnerHTML={{
        __html: `
          .reader-content {
            font-size: 1.125rem;
            line-height: 1.75;
            color: #374151;
          }
          .reader-content p {
            margin-bottom: 1.25rem;
            line-height: 1.8;
          }
          .reader-content h1,
          .reader-content h2,
          .reader-content h3,
          .reader-content h4,
          .reader-content h5,
          .reader-content h6 {
            font-weight: 700;
            color: #111827;
            margin-top: 2rem;
            margin-bottom: 1rem;
          }
          .reader-content h1 { font-size: 2rem; }
          .reader-content h2 { font-size: 1.75rem; }
          .reader-content h3 { font-size: 1.5rem; }
          .reader-content ul,
          .reader-content ol {
            margin: 1.5rem 0;
            padding-left: 2rem;
          }
          .reader-content ul {
            list-style-type: disc;
          }
          .reader-content ol {
            list-style-type: decimal;
          }
          .reader-content li {
            margin-bottom: 0.75rem;
            line-height: 1.8;
            padding-left: 0.5rem;
          }
          .reader-content ul ul,
          .reader-content ol ol,
          .reader-content ul ol,
          .reader-content ol ul {
            margin-top: 0.75rem;
            margin-bottom: 0.75rem;
          }
          .reader-content a {
            color: #9333ea;
            text-decoration: none;
          }
          .reader-content a:hover {
            text-decoration: underline;
          }
          .reader-content strong,
          .reader-content b {
            font-weight: 600;
            color: #111827;
          }
          .reader-content em,
          .reader-content i {
            font-style: italic;
          }
          .reader-content blockquote {
            border-left: 4px solid #9333ea;
            padding: 1rem 1.5rem;
            margin: 1.5rem 0;
            font-style: italic;
            color: #4b5563;
            background-color: #f9fafb;
            border-radius: 0.5rem;
          }
          .reader-content code {
            background-color: #f3f4f6;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.9rem;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          }
          .reader-content pre {
            background-color: #1f2937;
            color: #f3f4f6;
            padding: 1.5rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1.5rem 0;
            line-height: 1.6;
          }
          .reader-content pre code {
            background-color: transparent;
            padding: 0;
            color: inherit;
            font-size: 0.875rem;
          }
          .reader-content img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            margin: 2rem 0;
          }
          .reader-content hr {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 2rem 0;
          }
          .reader-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
            border: 1px solid #e5e7eb;
          }
          .reader-content th,
          .reader-content td {
            border: 1px solid #e5e7eb;
            padding: 0.75rem 1rem;
            text-align: left;
          }
          .reader-content th {
            background-color: #f9fafb;
            font-weight: 600;
            color: #111827;
          }
          .reader-content tbody tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .reader-content tbody tr:hover {
            background-color: #f3f4f6;
          }
          /* Math equation styling */
          .reader-content .katex-display {
            margin: 1.5rem 0;
            overflow-x: auto;
            overflow-y: hidden;
          }
          .reader-content .katex {
            font-size: 1.1em;
          }
        `
      }} />
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        {/* Left side: Back and Forward buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={goBack}
            disabled={!canGoBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Go back"
            title="Go back"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goForward}
            disabled={!canGoForward}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Go forward"
            title="Go forward"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Center: Reader Mode label */}
        <div className="flex items-center gap-2 text-sm text-gray-500 flex-1 justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>Reader Mode</span>
        </div>

        {/* Right side: Add to Page, View original and Close buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {canAddToPage && (
            <button
              type="button"
              onClick={handleAddToPage}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-teal-400 text-white rounded-lg hover:from-purple-600 hover:to-teal-500 transition-colors font-medium"
              title="Add this resource to the current page"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add to Page
            </button>
          )}
          <a
            href={originalUrl || url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            View original
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close reader view"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-6 py-8">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
          {article.title}
        </h1>

        {/* Metadata */}
        {(article.byline || article.siteName) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
            {article.byline && <span>{article.byline}</span>}
            {article.byline && article.siteName && <span>•</span>}
            {article.siteName && <span>{article.siteName}</span>}
          </div>
        )}

        {/* Article body */}
        <div
          ref={contentRef}
          className="reader-content"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>
    </div>
  );
}
