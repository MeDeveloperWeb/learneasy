"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getYouTubeEmbedUrl, isEmbeddableContent } from '@/lib/embed-utils';

interface NavigationHistoryEntry {
    url: string;
    type: 'iframe' | 'pdf' | 'image' | 'text';
    textContent?: string;
    textTitle?: string;
    isReaderMode?: boolean;
}

interface SplitScreenContextType {
    splitScreenEnabled: boolean;
    setSplitScreenEnabled: (enabled: boolean) => void;
    iframeUrl: string | null;
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
    const [readerUrl, setReaderUrl] = useState<string | null>(null);
    const [textContent, setTextContent] = useState<string | null>(null);
    const [textTitle, setTextTitle] = useState<string | null>(null);
    const [contentType, setContentType] = useState<'iframe' | 'pdf' | 'image' | 'text' | null>(null);
    // Always start with false to prevent hydration mismatch
    const [isDesktop, setIsDesktop] = useState(false);

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
            setReaderUrl(null);
            setContentType('text');
        } else {
            setTextContent(null);
            setTextTitle(null);
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
        if (splitScreenEnabled) {
            // Clear text content when opening a link
            setTextContent(null);
            setTextTitle(null);

            // If type is specified (PDF or IMAGE), use it directly
            if (type === 'pdf' || type === 'image') {
                setReaderUrl(null);
                setIframeUrl(url);
                setContentType(type);
                addToHistory({ url, type, isReaderMode: false });
                return;
            }

            // Default to iframe behavior for links
            // Check if it's a YouTube URL and convert to embed format
            const youtubeEmbedUrl = getYouTubeEmbedUrl(url);
            if (youtubeEmbedUrl) {
                setReaderUrl(null);
                setIframeUrl(youtubeEmbedUrl);
                setContentType('iframe');
                addToHistory({ url: youtubeEmbedUrl, type: 'iframe', isReaderMode: false });
                return;
            }

            // Check if it's other known embeddable content
            if (isEmbeddableContent(url)) {
                setReaderUrl(null);
                setIframeUrl(url);
                setContentType('iframe');
                addToHistory({ url, type: 'iframe', isReaderMode: false });
                return;
            }

            // For other URLs, check headers to see if they can be embedded
            try {
                const response = await fetch(`/api/check-iframe?url=${encodeURIComponent(url)}`);
                const data = await response.json();

                if (data.canEmbed === false) {
                    // Blocked - use reader mode directly
                    setIframeUrl(null);
                    setReaderUrl(url);
                    setContentType(null);
                    addToHistory({ url, type: 'iframe', isReaderMode: true });
                } else {
                    // Can embed or unknown - try iframe
                    setReaderUrl(null);
                    setIframeUrl(url);
                    setContentType('iframe');
                    addToHistory({ url, type: 'iframe', isReaderMode: false });
                }
            } catch (error) {
                // If check fails, default to trying iframe
                setReaderUrl(null);
                setIframeUrl(url);
                setContentType('iframe');
                addToHistory({ url, type: 'iframe', isReaderMode: false });
            }
        } else {
            window.open(url, '_blank');
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
        setReaderUrl(null);
        setTextContent(null);
        setTextTitle(null);
        setContentType(null);
        setNavigationHistory([]);
        setCurrentHistoryIndex(-1);
    };

    return (
        <SplitScreenContext.Provider value={{
            splitScreenEnabled,
            setSplitScreenEnabled,
            iframeUrl,
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
