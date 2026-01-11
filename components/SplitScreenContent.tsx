"use client";

import { ReaderView } from "./ReaderView";
import { RichTextViewer } from "./RichTextViewer";
import { useState, useEffect, useRef } from "react";
import { useSplitScreen } from "./SplitScreenProvider";

interface SplitScreenContentProps {
  contentType: 'iframe' | 'pdf' | 'image' | 'text' | null;
  iframeUrl: string | null;
  originalUrl: string | null; // The actual target URL to show in "View original"
  readerUrl: string | null;
  textContent: string | null;
  textTitle: string | null;
  onClose: () => void;
  switchToReaderMode: () => void;
  isMobile?: boolean;
}

export function SplitScreenContent({
  contentType,
  iframeUrl,
  originalUrl,
  readerUrl,
  textContent,
  textTitle,
  onClose,
  switchToReaderMode,
  isMobile = false,
}: SplitScreenContentProps) {
  const { canGoBack, canGoForward, goBack, goForward } = useSplitScreen();
  const [iframeError, setIframeError] = useState(false);
  const [showReaderButton, setShowReaderButton] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset error state and start timeout when URL changes
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setIframeError(false);
    setShowReaderButton(false);
    /* eslint-enable react-hooks/set-state-in-effect */

    if (iframeUrl) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set timeout to detect blocked iframe (5 seconds)
      timeoutRef.current = setTimeout(() => {
        setIframeError(true);
      }, 5000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [iframeUrl, readerUrl]);

  const handleIframeLoad = () => {
    // Iframe loaded successfully, clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIframeError(false);
    setShowReaderButton(true);
  };

  const handleIframeError = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIframeError(true);
  };

  // Render text content
  if (textContent) {
    return (
      <div className="relative h-full bg-white flex flex-col">
        {/* Top bar with title and close button */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 bg-white border-b border-gray-200">
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

          {/* Center: Title with icon */}
          <div className="flex items-center gap-3 flex-1 min-w-0 justify-center">
            <svg className="w-5 h-5 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="font-semibold text-gray-900 truncate">{textTitle}</h2>
          </div>

          {/* Right side: Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close split screen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Text content viewer - read-only editor */}
        <div className="flex-1 overflow-auto">
          <RichTextViewer content={textContent} />
        </div>
      </div>
    );
  }

  // Render reader view
  if (readerUrl) {
    return <ReaderView url={readerUrl} onClose={onClose} />;
  }

  // Render iframe/PDF/image content
  if (iframeUrl) {
    return (
      <div className="relative h-full bg-gray-50">
        {/* Top bar with controls */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-2 bg-white/90 backdrop-blur-sm border-b border-gray-200">
          {/* Left side: Back and Forward buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={goBack}
              disabled={!canGoBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Go forward"
              title="Go forward"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Center: Reader mode and View original buttons */}
          <div className="flex-1 flex justify-center items-center gap-2">
            {showReaderButton && !iframeError && contentType === 'iframe' && (
              <button
                type="button"
                onClick={switchToReaderMode}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Reader Mode
              </button>
            )}
            {!iframeError && (originalUrl || iframeUrl) && (
              <a
                href={originalUrl || iframeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium hover:bg-purple-50 rounded-lg transition-colors"
              >
                View original
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>

          {/* Right side: Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close split screen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content rendering based on type */}
        {contentType === 'pdf' ? (
          <div className="w-full h-full pt-12">
            <embed
              src={iframeUrl}
              type="application/pdf"
              className="w-full h-full"
            />
          </div>
        ) : contentType === 'image' ? (
          <div className="w-full h-full pt-12 overflow-auto flex items-center justify-center bg-gray-100">
            <img
              src={iframeUrl}
              alt="Uploaded content"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : iframeError ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="mb-4 p-4 bg-yellow-50 rounded-full">
              <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cannot embed this site
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md">
              This website blocks embedding for security. Try reader mode to view article content, or open in a new tab.
            </p>
            <div className="flex gap-3">
              <button
                onClick={switchToReaderMode}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-teal-400
                         text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Try Reader Mode
              </button>
              <a
                href={originalUrl || iframeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-800
                         rounded-lg font-medium hover:bg-gray-300 transition-all"
              >
                Open in new tab
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        ) : (
          <iframe
            src={iframeUrl}
            className="w-full h-full pt-12"
            title="Split screen content"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}
      </div>
    );
  }

  return null;
}
