"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getYouTubeEmbedUrl, isEmbeddableContent } from '@/lib/embed-utils';

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
        }
    };

    const openInSplitScreen = async (url: string, type?: 'iframe' | 'pdf' | 'image') => {
        if (splitScreenEnabled && isDesktop) {
            // If type is specified (PDF or IMAGE), use it directly
            if (type === 'pdf' || type === 'image') {
                setReaderUrl(null);
                setIframeUrl(url);
                setContentType(type);
                return;
            }

            // Default to iframe behavior for links
            // Check if it's a YouTube URL and convert to embed format
            const youtubeEmbedUrl = getYouTubeEmbedUrl(url);
            if (youtubeEmbedUrl) {
                setReaderUrl(null);
                setIframeUrl(youtubeEmbedUrl);
                setContentType('iframe');
                return;
            }

            // Check if it's other known embeddable content
            if (isEmbeddableContent(url)) {
                setReaderUrl(null);
                setIframeUrl(url);
                setContentType('iframe');
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
                } else {
                    // Can embed or unknown - try iframe
                    setReaderUrl(null);
                    setIframeUrl(url);
                    setContentType('iframe');
                }
            } catch (error) {
                // If check fails, default to trying iframe
                setReaderUrl(null);
                setIframeUrl(url);
                setContentType('iframe');
            }
        } else {
            window.open(url, '_blank');
        }
    };

    const switchToReaderMode = () => {
        if (iframeUrl) {
            setReaderUrl(iframeUrl);
            setIframeUrl(null);
        }
    };

    const openTextInSplitScreen = (content: string, title: string) => {
        if (splitScreenEnabled && isDesktop) {
            setIframeUrl(null);
            setReaderUrl(null);
            setTextContent(content);
            setTextTitle(title);
            setContentType('text');
        }
    };

    const closeSplitScreen = () => {
        setIframeUrl(null);
        setReaderUrl(null);
        setTextContent(null);
        setTextTitle(null);
        setContentType(null);
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
