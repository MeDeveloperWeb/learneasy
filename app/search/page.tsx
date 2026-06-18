'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const containerRef = useRef<HTMLDivElement>(null);
    const renderedRef = useRef(false);

    // Prevent this page from adding to browser history when in iframe
    useEffect(() => {
        if (window.self !== window.top) {
            // We're in an iframe - completely disable history manipulation
            const originalPushState = window.history.pushState.bind(window.history);
            const originalReplaceState = window.history.replaceState.bind(window.history);

            // Override both pushState and replaceState to do nothing
            window.history.pushState = function(...args) {
                console.log('[SearchPage] Blocked pushState in iframe');
                // Do nothing - prevent history manipulation
            };

            window.history.replaceState = function(...args) {
                console.log('[SearchPage] Blocked replaceState in iframe');
                // Do nothing - prevent history manipulation
            };

            return () => {
                window.history.pushState = originalPushState;
                window.history.replaceState = originalReplaceState;
            };
        }
    }, []);

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
            script.src = `https://cse.google.com/cse.js?cx=${process.env.NEXT_PUBLIC_GOOGLE_CSE_ID}`;
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
                // Check if it's a search result link OR pagination link
                const isResultLink = link.classList.contains('gs-title') ||
                                    link.closest('.gs-title') ||
                                    link.closest('.gsc-webResult, .gsc-result');

                const isPaginationLink = link.closest('.gsc-cursor-page');

                console.log('[SearchPage] Is result link?', isResultLink, 'Is pagination?', isPaginationLink);

                // Prevent ALL links from navigating normally
                if (isResultLink || isPaginationLink) {
                    e.preventDefault();

                    if (isResultLink && !isPaginationLink) {
                        console.log('[SearchPage] Sending postMessage to parent with URL:', link.href);
                        // Tell parent window to handle navigation (iframe check, reader mode, etc.)
                        window.parent.postMessage({
                            type: 'NAVIGATE_SPLIT_SCREEN',
                            url: link.href
                        }, '*');
                    } else if (isPaginationLink) {
                        // For pagination, prevent navigation and manually trigger search
                        console.log('[SearchPage] Pagination click - preventing navigation');
                        // Let Google CSE handle pagination through its API instead
                        // This prevents any history changes
                        const gname = 'storesearch';
                        const google = (window as any).google;
                        if (google?.search?.cse?.element) {
                            const element = google.search.cse.element.getElement(gname);
                            if (element) {
                                // Get the page number from the link
                                const pageMatch = link.textContent?.match(/\d+/);
                                if (pageMatch) {
                                    const page = parseInt(pageMatch[0]);
                                    // Google CSE pages are 0-indexed
                                    element.gotoPage(page - 1);
                                }
                            }
                        }
                    }
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

                /* =====================================================================
                   DARK MODE
                   This page loads inside a same-origin iframe, so the root layout's
                   theme script still runs and puts \`.dark\` on this document's <html>.
                   Google CSE injects its own light-colored stylesheet (and the rules
                   above hardcode light colors), so override every visible CSE piece
                   for dark here. Google's CSS uses !important, so we match it.
                   ===================================================================== */
                .dark .gsc-control-cse {
                    color: #e4e4e7 !important;
                }

                /* Search field */
                .dark .gsc-input-box {
                    background: #26262b !important;
                    border-color: #3f3f46 !important;
                }
                .dark input.gsc-input,
                .dark .gsc-input .gsc-input,
                .dark .gsib_a input.gsc-input {
                    background: #26262b !important;
                    color: #f4f4f5 !important;
                }
                .dark input.gsc-input::placeholder { color: #8b8b95 !important; }
                .dark .gsib_a,
                .dark .gsib_b,
                .dark .gsc-input-box-tools,
                .dark table.gsc-search-box,
                .dark table.gsc-search-box td { background: transparent !important; }
                /* Clear ("x") button */
                .dark .gsst_a .gscb_a { color: #a6a6af !important; }
                .dark .gsst_a:hover .gscb_a { color: #f4f4f5 !important; }

                /* Autocomplete dropdown (appended near the input) */
                .dark .gssb_c .gssb_e,
                .dark table.gssb_c,
                .dark .gssb_a td {
                    background: #1e1e22 !important;
                    color: #e4e4e7 !important;
                    border-color: #3f3f46 !important;
                }
                .dark .gssb_a:hover td,
                .dark .gssb_i td { background: #2c2c32 !important; }
                .dark .gssb_a .gsq_a,
                .dark .gssb_a b { color: #f4f4f5 !important; }

                /* Result cards */
                .dark .gsc-webResult,
                .dark .gsc-result {
                    background: #1e1e22 !important;
                    border-color: #34343b !important;
                }
                .dark .gsc-webResult:hover,
                .dark .gsc-result:hover {
                    border-color: #a855f7 !important;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4) !important;
                }
                .dark .gs-title,
                .dark .gs-title * { color: #c4b5fd !important; }
                .dark .gs-title:hover,
                .dark .gs-title:hover * { color: #2dd4bf !important; }
                .dark .gs-snippet { color: #c6c6cd !important; }
                .dark .gsc-url-top,
                .dark .gs-visibleUrl,
                .dark .gsc-url-bottom { color: #34d399 !important; }

                /* Misc CSE text (result count, "no results", spelling, tabs) */
                .dark .gsc-result-info,
                .dark .gsc-orderby-label,
                .dark .gcsc-find-more-on-google,
                .dark .gcsc-find-more-on-google-magnifier,
                .dark .gs-spelling,
                .dark .gs-spelling a,
                .dark .gsc-tabHeader,
                .dark .gsc-no-results-result .gs-snippet { color: #c6c6cd !important; }

                /* Pagination */
                .dark .gsc-cursor-page {
                    background: #26262b !important;
                    border-color: #3f3f46 !important;
                    color: #c6c6cd !important;
                }
                .dark .gsc-cursor-page:hover {
                    border-color: #a855f7 !important;
                    color: #c4b5fd !important;
                }
                .dark .gsc-cursor-current-page { color: #ffffff !important; }

                /* Search submit button — Google's bg isn't remapped in dark, so the
                   white magnifier vanishes. Force the app gradient + white icon. */
                .dark button.gsc-search-button,
                .dark button.gsc-search-button-v2,
                .dark .gsc-search-button,
                .dark .gsc-search-button-v2 {
                    background: linear-gradient(to right, #a855f7, #2dd4bf) !important;
                }
                .dark .gsc-search-button svg,
                .dark .gsc-search-button-v2 svg,
                .dark .gsc-search-button path,
                .dark .gsc-search-button-v2 path { fill: #ffffff !important; }

                /* Result thumbnails / web-image boxes — these render as white blocks
                   behind images in dark; make them blend into the dark surface. */
                .dark .gsc-table-cell-thumbnail,
                .dark .gsc-thumbnail,
                .dark .gs-image-box,
                .dark .gs-web-image-box,
                .dark .gs-web-image-box-landscape,
                .dark .gs-web-image-box-portrait,
                .dark .gsc-imageResult,
                .dark .gs-image,
                .dark a.gs-image {
                    background: transparent !important;
                    border-color: #34343b !important;
                }

                /* Refinement / tab strip ("All results · Youtube · Image") — white bg */
                .dark .gsc-tabsArea,
                .dark .gsc-refinementsArea,
                .dark .gsc-refinementBlock {
                    background: #1e1e22 !important;
                    border-color: #34343b !important;
                }
                /* Edge fade overlay → fade to the dark surface, not white */
                .dark .gsc-refinementsGradient {
                    background: linear-gradient(to right, rgba(30, 30, 34, 0), #1e1e22) !important;
                }
                .dark .gsc-tabHeader,
                .dark .gsc-tabHeader.gsc-tabhInactive,
                .dark .gsc-refinementHeader span,
                .dark .gsc-refinementHeader.gsc-refinementhInactive span { color: #a6a6af !important; }
                .dark .gsc-tabHeader.gsc-tabhInactive:hover,
                .dark .gsc-refinementHeader.gsc-refinementhInactive:hover span { color: #f4f4f5 !important; }
                .dark .gsc-tabHeader.gsc-tabhActive {
                    color: #c4b5fd !important;
                    border-color: #a855f7 !important;
                    background: transparent !important;
                }
                .dark .gsc-refinementHeader.gsc-refinementhActive span { color: #c4b5fd !important; }
                /* The chips themselves carry a white bg — clear it. Active keeps a
                   tint via the higher-specificity rules below. */
                .dark .gsc-tabHeader,
                .dark .gsc-refinementHeader { background-color: transparent !important; }
                .dark .gsc-refinementHeader.gsc-refinementhActive {
                    background-color: transparent !important;
                }
            `}</style>
        </div>
    );
}
