'use client';

import { useSplitScreen } from '@/components/SplitScreenProvider';

interface TopicSearchButtonsProps {
    topicTitle: string;
}

export function TopicSearchButtons({ topicTitle }: TopicSearchButtonsProps) {
    const { openInSplitScreen, splitScreenEnabled, isDesktop } = useSplitScreen();

    const handleSearchInPanel = (e: React.MouseEvent) => {
        e.preventDefault();
        // Use absolute URL for split screen to avoid iframe compatibility check issues
        const searchUrl = `${window.location.origin}/search?q=${encodeURIComponent(topicTitle)}`;
        openInSplitScreen(searchUrl, 'iframe');
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {/* Open in New Tab Button */}
            <a
                href={`https://www.google.com/search?q=${encodeURIComponent(topicTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200
                         rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all
                         text-gray-700 hover:text-purple-700 font-medium text-sm group
                         shadow-sm hover:shadow-md"
                title="Search on Google in new tab"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                </svg>
                <span className="hidden sm:inline">New Tab</span>
                <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            </a>

            {/* Search in Panel Button - Only show on desktop or when split screen is enabled */}
            {(isDesktop || splitScreenEnabled) && (
                <button
                    onClick={handleSearchInPanel}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-teal-400
                             rounded-xl hover:from-purple-600 hover:to-teal-500 transition-all
                             text-white font-medium text-sm group shadow-sm hover:shadow-md"
                    title="Search in split panel"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                    </svg>
                    <span className="hidden sm:inline">Search in Panel</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                    </svg>
                </button>
            )}
        </div>
    );
}
