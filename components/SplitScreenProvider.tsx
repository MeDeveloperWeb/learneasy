"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getYouTubeEmbedUrl, isEmbeddableContent, extractActualUrl } from '@/lib/embed-utils';

interface NavigationHistoryEntry {
    url: string;
    originalUrl?: string; // The actual target URL (for Google redirects, this is the extracted URL)
    type: 'iframe' | 'pdf' | 'image' | 'text';
    textContent?: string;
    textTitle?: string;
    isReaderMode?: boolean;
}

interface SplitScreenContextType {
    splitScreenEnabled: boolean;
    setSplitScreenEnabled: (enabled: boolean) => void;
    iframeUrl: string | null;
    originalUrl: string | null; // The actual target URL to show in "View original"
    readerUrl: string | null;
    textContent: string | null;
    textTitle: string | null;
    contentType: 'iframe' | 'pdf' | 'image' | 'text' | null;
    openInSplitScreen: (url: string, type?: 'iframe' | 'pdf' | 'image') => void;
    openTextInSplitScreen: (content: string, title: string) => void;
    switchToReaderMode: () => void;
    closeSplitScreen: () => void;
    isDesktop: boolean;
    canGoBack: boolean;
    canGoForward: boolean;
    goBack: () => void;
    goForward: () => void;
    currentTopicId: string | null;
    currentTopicResources: string[]; // Array of resource URLs
    setCurrentTopic: (topicId: string | null, resourceUrls: string[]) => void;
    pendingResourceUrl: string | null; // URL to pre-fill in add resource form
    setPendingResourceUrl: (url: string | null) => void;
}

const SplitScreenContext = createContext<SplitScreenContextType | null>(null);

export function SplitScreenProvider({ children }: { children: ReactNode }) {
    const [splitScreenEnabled, setSplitScreenEnabledState] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('splitScreenEnabled');
            if (saved !== null) {
                return JSON.parse(saved);
            }
        }
        return false;
    });
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const [originalUrl, setOriginalUrl] = useState<string | null>(null); // The actual target URL
    const [readerUrl, setReaderUrl] = useState<string | null>(null);
    const [textContent, setTextContent] = useState<string | null>(null);
    const [textTitle, setTextTitle] = useState<string | null>(null);
    const [contentType, setContentType] = useState<'iframe' | 'pdf' | 'image' | 'text' | null>(null);
    // Always start with false to prevent hydration mismatch
    const [isDesktop, setIsDesktop] = useState(false);

    // Current topic context for "Add to Page" functionality
    const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
    const [currentTopicResources, setCurrentTopicResources] = useState<string[]>([]);
    const [pendingResourceUrl, setPendingResourceUrl] = useState<string | null>(null);

    // Navigation history
    const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryEntry[]>([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

    // Computed navigation state
    const canGoBack = currentHistoryIndex > 0;
    const canGoForward = currentHistoryIndex < navigationHistory.length - 1;

    // Set initial value and check if desktop on resize
    useEffect(() => {
        // Set initial value
        setIsDesktop(window.innerWidth >= 1024);

        const checkDesktop = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };

        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    const setSplitScreenEnabled = (enabled: boolean) => {
        setSplitScreenEnabledState(enabled);
        localStorage.setItem('splitScreenEnabled', JSON.stringify(enabled));
        if (!enabled) {
            setIframeUrl(null);
            setOriginalUrl(null);
            setReaderUrl(null);
            setTextContent(null);
            setTextTitle(null);
            setContentType(null);
            setNavigationHistory([]);
            setCurrentHistoryIndex(-1);
        }
    };

    // Helper function to add entry to navigation history
    const addToHistory = (entry: NavigationHistoryEntry) => {
        setNavigationHistory(prev => {
            // Remove any forward history if we're not at the end
            const newHistory = prev.slice(0, currentHistoryIndex + 1);
            return [...newHistory, entry];
        });
        setCurrentHistoryIndex(prev => prev + 1);
    };

    // Helper function to load a history entry
    const loadHistoryEntry = (entry: NavigationHistoryEntry) => {
        if (entry.type === 'text' && entry.textContent && entry.textTitle) {
            setTextContent(entry.textContent);
            setTextTitle(entry.textTitle);
            setIframeUrl(null);
            setOriginalUrl(null);
            setReaderUrl(null);
            setContentType('text');
        } else {
            setTextContent(null);
            setTextTitle(null);
            setOriginalUrl(entry.originalUrl || entry.url); // Use originalUrl if available, otherwise url
            if (entry.isReaderMode) {
                setReaderUrl(entry.url);
                setIframeUrl(null);
                setContentType(null);
            } else {
                setIframeUrl(entry.url);
                setReaderUrl(null);
                setContentType(entry.type);
            }
        }
    };

    const goBack = () => {
        if (canGoBack) {
            const newIndex = currentHistoryIndex - 1;
            setCurrentHistoryIndex(newIndex);
            loadHistoryEntry(navigationHistory[newIndex]);
        }
    };

    const goForward = () => {
        if (canGoForward) {
            const newIndex = currentHistoryIndex + 1;
            setCurrentHistoryIndex(newIndex);
            loadHistoryEntry(navigationHistory[newIndex]);
        }
    };

    const openInSplitScreen = async (url: string, type?: 'iframe' | 'pdf' | 'image') => {
        console.log('[openInSplitScreen] Called with URL:', url, 'Type:', type);

        // Extract actual URL from Google redirect URLs
        const actualUrl = extractActualUrl(url);
        if (actualUrl !== url) {
            console.log('[openInSplitScreen] Extracted actual URL:', actualUrl);
        }

        if (splitScreenEnabled) {
            // Clear text content when opening a link
            setTextContent(null);
            setTextTitle(null);

            // Special handling for internal search page - convert to Google search URL for "View original"
            let displayOriginalUrl = actualUrl;
            try {
                const urlObj = new URL(actualUrl, window.location.origin);
                if (urlObj.pathname === '/search' && urlObj.searchParams.has('q')) {
                    const query = urlObj.searchParams.get('q');
                    displayOriginalUrl = `https://www.google.com/search?q=${encodeURIComponent(query!)}`;
                    console.log('[openInSplitScreen] Converted internal search to Google URL:', displayOriginalUrl);
                }
            } catch (e) {
                // If URL parsing fails, use actualUrl as-is
            }

            // If type is specified (PDF or IMAGE), use it directly
            if (type === 'pdf' || type === 'image') {
                console.log('[openInSplitScreen] Using specified type:', type);
                setReaderUrl(null);
                setIframeUrl(actualUrl);
                setOriginalUrl(displayOriginalUrl);
                setContentType(type);
                addToHistory({ url: actualUrl, originalUrl: displayOriginalUrl, type, isReaderMode: false });
                return;
            }

            // Default to iframe behavior for links
            // Check if it's a YouTube URL and convert to embed format
            const youtubeEmbedUrl = getYouTubeEmbedUrl(actualUrl);
            console.log('[openInSplitScreen] YouTube embed URL:', youtubeEmbedUrl);
            if (youtubeEmbedUrl) {
                console.log('[openInSplitScreen] Using YouTube embed');
                setReaderUrl(null);
                setIframeUrl(youtubeEmbedUrl);
                setOriginalUrl(displayOriginalUrl); // Keep the original YouTube URL, not the embed URL
                setContentType('iframe');
                addToHistory({ url: youtubeEmbedUrl, originalUrl: displayOriginalUrl, type: 'iframe', isReaderMode: false });
                return;
            }

            // Check if it's other known embeddable content
            const isEmbeddable = isEmbeddableContent(actualUrl);
            console.log('[openInSplitScreen] Is embeddable content?', isEmbeddable);
            if (isEmbeddable) {
                console.log('[openInSplitScreen] Using known embeddable content');
                setReaderUrl(null);
                setIframeUrl(actualUrl);
                setOriginalUrl(displayOriginalUrl);
                setContentType('iframe');
                addToHistory({ url: actualUrl, originalUrl: displayOriginalUrl, type: 'iframe', isReaderMode: false });
                return;
            }

            // For other URLs, check headers to see if they can be embedded
            console.log('[openInSplitScreen] Checking iframe compatibility via API');
            try {
                const response = await fetch(`/api/check-iframe?url=${encodeURIComponent(actualUrl)}`);
                const data = await response.json();
                console.log('[openInSplitScreen] API response:', data);

                if (data.canEmbed === false) {
                    // Blocked - use reader mode directly
                    console.log('[openInSplitScreen] Using reader mode (blocked)');
                    setIframeUrl(null);
                    setReaderUrl(actualUrl);
                    setOriginalUrl(displayOriginalUrl);
                    setContentType(null);
                    addToHistory({ url: actualUrl, originalUrl: displayOriginalUrl, type: 'iframe', isReaderMode: true });
                } else {
                    // Can embed or unknown - try iframe
                    console.log('[openInSplitScreen] Trying iframe (allowed or unknown)');
                    setReaderUrl(null);
                    setIframeUrl(actualUrl);
                    setOriginalUrl(displayOriginalUrl);
                    setContentType('iframe');
                    addToHistory({ url: actualUrl, originalUrl: displayOriginalUrl, type: 'iframe', isReaderMode: false });
                }
            } catch (error) {
                // If check fails, default to trying iframe
                console.log('[openInSplitScreen] API check failed, defaulting to iframe', error);
                setReaderUrl(null);
                setIframeUrl(actualUrl);
                setOriginalUrl(displayOriginalUrl);
                setContentType('iframe');
                addToHistory({ url: actualUrl, originalUrl: displayOriginalUrl, type: 'iframe', isReaderMode: false });
            }
        } else {
            window.open(actualUrl, '_blank');
        }
    };

    const switchToReaderMode = () => {
        if (iframeUrl) {
            setReaderUrl(iframeUrl);
            setIframeUrl(null);
            // Update the current history entry to reflect reader mode
            if (currentHistoryIndex >= 0 && navigationHistory[currentHistoryIndex]) {
                const updatedHistory = [...navigationHistory];
                updatedHistory[currentHistoryIndex] = {
                    ...updatedHistory[currentHistoryIndex],
                    isReaderMode: true
                };
                setNavigationHistory(updatedHistory);
            }
        }
    };

    const openTextInSplitScreen = (content: string, title: string) => {
        // Always set the content - the layout component decides whether to show it
        setIframeUrl(null);
        setReaderUrl(null);
        setTextContent(content);
        setTextTitle(title);
        setContentType('text');
        addToHistory({ url: '', type: 'text', textContent: content, textTitle: title, isReaderMode: false });
    };

    const closeSplitScreen = () => {
        setIframeUrl(null);
        setOriginalUrl(null);
        setReaderUrl(null);
        setTextContent(null);
        setTextTitle(null);
        setContentType(null);
        setNavigationHistory([]);
        setCurrentHistoryIndex(-1);
    };

    const setCurrentTopic = (topicId: string | null, resourceUrls: string[]) => {
        setCurrentTopicId(topicId);
        setCurrentTopicResources(resourceUrls);
    };

    // Listen for navigation messages from iframes (e.g., search results)
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            console.log('[SplitScreen] Received postMessage:', event.data);
            if (event.data?.type === 'NAVIGATE_SPLIT_SCREEN' && event.data?.url) {
                console.log('[SplitScreen] Navigating to URL from iframe:', event.data.url);
                // Use the existing openInSplitScreen logic (handles iframe check, reader mode, etc.)
                openInSplitScreen(event.data.url);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [openInSplitScreen]);

    return (
        <SplitScreenContext.Provider value={{
            splitScreenEnabled,
            setSplitScreenEnabled,
            iframeUrl,
            originalUrl,
            readerUrl,
            textContent,
            textTitle,
            contentType,
            openInSplitScreen,
            openTextInSplitScreen,
            switchToReaderMode,
            closeSplitScreen,
            isDesktop,
            canGoBack,
            canGoForward,
            goBack,
            goForward,
            currentTopicId,
            currentTopicResources,
            setCurrentTopic,
            pendingResourceUrl,
            setPendingResourceUrl,
        }}>
            {children}
        </SplitScreenContext.Provider>
    );
}

export function useSplitScreen() {
    const context = useContext(SplitScreenContext);
    if (!context) {
        throw new Error('useSplitScreen must be used within a SplitScreenProvider');
    }
    return context;
}
