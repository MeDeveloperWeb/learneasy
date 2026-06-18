"use client";

import { useEffect } from 'react';
import { useSplitScreen } from './SplitScreenProvider';

interface TopicProviderProps {
    topicId: string;
    topicName?: string;
    paperName?: string;
    resourceUrls: string[];
    children: React.ReactNode;
}

export function TopicProvider({ topicId, topicName, paperName, resourceUrls, children }: TopicProviderProps) {
    const { setCurrentTopic } = useSplitScreen();

    useEffect(() => {
        // Set the current topic context when component mounts
        setCurrentTopic(topicId, resourceUrls, topicName ?? null, paperName ?? null);

        // Clear the context when component unmounts
        return () => {
            setCurrentTopic(null, []);
        };
    }, [topicId, topicName, paperName, resourceUrls, setCurrentTopic]);

    return <>{children}</>;
}
