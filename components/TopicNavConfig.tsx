"use client";

import { useEffect } from "react";
import { useNav, TopicLink } from "./NavProvider";

/**
 * Pushes the topic page's Prev/Next sibling links into NavProvider so the mobile
 * bottom bar can render them. Rendered by the (server) TopicPage; clears on
 * unmount so the links don't leak to other routes.
 */
export function TopicNavConfig({
    prev,
    next,
}: {
    prev: TopicLink | null;
    next: TopicLink | null;
}) {
    const { setPrevNext } = useNav();

    useEffect(() => {
        setPrevNext(prev, next);
        return () => setPrevNext(null, null);
    }, [prev, next, setPrevNext]);

    return null;
}
