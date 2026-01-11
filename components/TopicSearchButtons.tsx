'use client';

import { useState, useEffect } from 'react';
import { useSplitScreen } from '@/components/SplitScreenProvider';

interface TopicSearchButtonsProps {
    topicTitle: string;
}

export function TopicSearchButtons({ topicTitle }: TopicSearchButtonsProps) {
    const { openInSplitScreen, splitScreenEnabled } = useSplitScreen();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSearchInPanel = (e: React.MouseEvent) => {
        e.preventDefault();
        // Use absolute URL for split screen to avoid iframe compatibility check issues
        const searchUrl = `${window.location.origin}/search?q=${encodeURIComponent(topicTitle)}`;
        openInSplitScreen(searchUrl, 'iframe');
    };

    return (
        <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Google Search Button - 1/4 width */}
            <a
                href={`https://www.google.com/search?q=${encodeURIComponent(topicTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white border-2 border-gray-200
                         rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all
                         text-gray-700 hover:text-purple-700 font-medium text-sm group
                         shadow-sm hover:shadow-md active:scale-95 flex-[1] sm:flex-initial"
                title="Search on Google in new tab"
            >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                </svg>
                <span className="hidden xs:inline sm:hidden md:inline">Google</span>
                <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            </a>

            {/* Search in Panel Button - 3/4 width - Only show when split screen is enabled */}
            {mounted && splitScreenEnabled && (
                <button
                    onClick={handleSearchInPanel}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-teal-400
                             rounded-lg hover:from-purple-600 hover:to-teal-500 transition-all
                             text-white font-medium text-xs group shadow-sm hover:shadow-md
                             active:scale-95 flex-[3] sm:flex-initial"
                    title="Search in split panel"
                >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                    </svg>
                    <span>Open in Panel</span>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                    </svg>
                </button>
            )}
        </div>
    );
}
