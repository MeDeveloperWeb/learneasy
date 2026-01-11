'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const containerRef = useRef<HTMLDivElement>(null);
    const renderedRef = useRef(false);

    useEffect(() => {
        // Configure Google CSE to use explicit rendering
        (window as any).__gcse = {
            parsetags: 'explicit',
            initializationCallback: () => {
                renderSearch();
            }
        };

        // Load Google CSE script
        const existingScript = document.querySelector('script[src*="cse.google.com"]');

        if (!existingScript) {
            const script = document.createElement('script');
            script.src = 'https://cse.google.com/cse.js?cx=a42530fbfbfbe4e41';
            script.async = true;
            script.onload = () => {
                setTimeout(renderSearch, 500);
            };
            document.body.appendChild(script);
        } else {
            setTimeout(renderSearch, 500);
        }

        function renderSearch() {
            if (renderedRef.current) return;

            const google = (window as any).google;

            if (google?.search?.cse?.element) {
                try {
                    // Render the search element
                    google.search.cse.element.render({
                        div: containerRef.current,
                        tag: 'search',
                        gname: 'storesearch',
                        attributes: {
                            enableAutoComplete: true,
                            queryParameterName: 'search'
                        }
                    });

                    renderedRef.current = true;

                    // Execute the search if query is provided
                    if (query) {
                        setTimeout(() => {
                            const element = google.search.cse.element.getElement('storesearch');
                            if (element) {
                                element.execute(query);
                            }
                        }, 1000);
                    }
                } catch (error) {
                    console.error('Error rendering CSE:', error);
                }
            } else {
                setTimeout(renderSearch, 500);
            }
        }
    }, [query]);

    // Handle search result clicks - tell parent to navigate using smart logic
    useEffect(() => {
        const handleLinkClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a');

            if (link && link.href) {
                console.log('[SearchPage] Link clicked:', link.href);
                // Check if it's a search result link
                const isResultLink = link.classList.contains('gs-title') ||
                                    link.closest('.gs-title') ||
                                    (link.closest('.gsc-webResult, .gsc-result') &&
                                     !link.closest('.gsc-cursor-page')); // Exclude pagination

                console.log('[SearchPage] Is result link?', isResultLink);

                if (isResultLink) {
                    e.preventDefault();

                    console.log('[SearchPage] Sending postMessage to parent with URL:', link.href);
                    // Tell parent window to handle navigation (iframe check, reader mode, etc.)
                    window.parent.postMessage({
                        type: 'NAVIGATE_SPLIT_SCREEN',
                        url: link.href
                    }, '*');
                }
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('click', handleLinkClick);
        }

        return () => {
            if (container) {
                container.removeEventListener('click', handleLinkClick);
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-white p-6">
            <div className="w-full">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Google Search
                    </h1>
                    {query && (
                        <p className="text-gray-600">
                            Query: <span className="font-semibold">{query}</span>
                        </p>
                    )}
                </div>

                {/* Google CSE - Explicitly rendered */}
                <div ref={containerRef} id="cse-search-container"></div>
            </div>

            <style jsx global>{`
                .gsc-control-cse {
                    padding: 0 !important;
                    border: none !important;
                    background: transparent !important;
                    font-family: inherit !important;
                }

                .gsc-above-wrapper-area {
                    max-width: none !important;
                    width: 100% !important;
                }

                .gsc-wrapper {
                    max-width: none !important;
                    width: 100% !important;
                }

                form.gsc-search-box,
                .gsc-search-box {
                    max-width: none !important;
                    width: 100% !important;
                    margin: 0 !important;
                }

                .gsc-input-box {
                    border: 2px solid #e5e7eb !important;
                    border-radius: 0.75rem !important;
                }

                .gsc-input-box:focus-within {
                    border-color: #a855f7 !important;
                    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1) !important;
                }

                /* Search button - remove ALL borders */
                button.gsc-search-button,
                button.gsc-search-button-v2,
                .gsc-search-button,
                .gsc-search-button-v2 {
                    border: 0 !important;
                    border-width: 0 !important;
                    outline: 0 !important;
                    outline-width: 0 !important;
                    box-shadow: none !important;
                    border-radius: 0.75rem !important;
                    padding: 10px 24px !important;
                    transition: all 0.2s ease !important;
                    -webkit-appearance: none !important;
                    -moz-appearance: none !important;
                    appearance: none !important;
                }

                button.gsc-search-button:hover,
                button.gsc-search-button-v2:hover,
                .gsc-search-button:hover,
                .gsc-search-button-v2:hover {
                    transform: translateY(-1px) !important;
                    box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3) !important;
                    border: 0 !important;
                    outline: 0 !important;
                }

                button.gsc-search-button:active,
                button.gsc-search-button-v2:active,
                .gsc-search-button:active,
                .gsc-search-button-v2:active {
                    transform: translateY(0) !important;
                    box-shadow: 0 2px 4px rgba(168, 85, 247, 0.2) !important;
                    border: 0 !important;
                    outline: 0 !important;
                }

                button.gsc-search-button:focus,
                button.gsc-search-button-v2:focus,
                .gsc-search-button:focus,
                .gsc-search-button-v2:focus {
                    border: 0 !important;
                    outline: 0 !important;
                    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.3) !important;
                }

                /* Fix icon styling - transparent background, white fill */
                .gsc-search-button svg,
                .gsc-search-button-v2 svg {
                    border: none !important;
                    outline: none !important;
                    background: transparent !important;
                    background-color: transparent !important;
                }

                .gsc-search-button path,
                .gsc-search-button-v2 path {
                    border: none !important;
                    outline: none !important;
                    fill: white !important;
                    background: transparent !important;
                }

                /* Remove borders from all search-related icons */
                .gsc-search-box svg,
                .gsc-search-box path,
                .gsc-clear-button {
                    border: none !important;
                    outline: none !important;
                    background: transparent !important;
                }

                .gsc-webResult,
                .gsc-result {
                    border: 1px solid #e5e7eb !important;
                    border-radius: 0.75rem !important;
                    padding: 1.25rem !important;
                    margin-bottom: 1rem !important;
                }

                .gsc-webResult:hover,
                .gsc-result:hover {
                    border-color: #a855f7 !important;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
                }

                .gs-title,
                .gs-title * {
                    color: #7c3aed !important;
                    font-size: 1.125rem !important;
                    font-weight: 600 !important;
                }

                .gs-title:hover,
                .gs-title:hover * {
                    color: #2dd4bf !important;
                }

                .gs-snippet {
                    color: #4b5563 !important;
                    line-height: 1.6 !important;
                }

                .gsc-url-top {
                    color: #059669 !important;
                }

                .gsc-cursor-page {
                    background: white !important;
                    border: 2px solid #e5e7eb !important;
                    border-radius: 0.5rem !important;
                    color: #4b5563 !important;
                    padding: 0.5rem 1rem !important;
                    margin: 0 0.25rem !important;
                    font-size: 0.875rem !important;
                    min-width: auto !important;
                    white-space: nowrap !important;
                }

                @media (max-width: 640px) {
                    .gsc-cursor-page {
                        padding: 0.375rem 0.625rem !important;
                        margin: 0 0.125rem !important;
                        font-size: 0.75rem !important;
                    }
                }

                .gsc-cursor-page:hover {
                    border-color: #a855f7 !important;
                    color: #7c3aed !important;
                }

                .gsc-cursor-current-page {
                    background: linear-gradient(to right, #a855f7, #2dd4bf) !important;
                    border: none !important;
                    color: white !important;
                }

                .gsc-cursor-box {
                    overflow-x: auto !important;
                    -webkit-overflow-scrolling: touch !important;
                }

                @media (max-width: 640px) {
                    .gsc-cursor {
                        display: flex !important;
                        flex-wrap: nowrap !important;
                        overflow-x: auto !important;
                        -webkit-overflow-scrolling: touch !important;
                        padding-bottom: 0.5rem !important;
                    }
                }
            `}</style>
        </div>
    );
}
