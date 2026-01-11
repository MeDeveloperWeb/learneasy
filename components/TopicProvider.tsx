"use client";

import { useEffect } from 'react';
import { useSplitScreen } from './SplitScreenProvider';

interface TopicProviderProps {
    topicId: string;
    resourceUrls: string[];
    children: React.ReactNode;
}

export function TopicProvider({ topicId, resourceUrls, children }: TopicProviderProps) {
    const { setCurrentTopic } = useSplitScreen();

    useEffect(() => {
        // Set the current topic context when component mounts
        setCurrentTopic(topicId, resourceUrls);

        // Clear the context when component unmounts
        return () => {
            setCurrentTopic(null, []);
        };
    }, [topicId, resourceUrls, setCurrentTopic]);

    return <>{children}</>;
}
