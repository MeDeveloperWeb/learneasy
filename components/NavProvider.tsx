"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { usePathname } from "next/navigation";

/** A sibling topic used to build the Prev/Next bar links. */
export interface TopicLink {
    id: string;
    title: string;
}

/** The page's primary "+" action (add resource / add topic). */
export interface PrimaryAction {
    label: string;
    onClick: () => void;
}

interface NavContextValue {
    prev: TopicLink | null;
    next: TopicLink | null;
    setPrevNext: (prev: TopicLink | null, next: TopicLink | null) => void;

    primaryAction: PrimaryAction | null;
    setPrimaryAction: (action: PrimaryAction | null) => void;

    menuOpen: boolean;
    openMenu: () => void;
    closeMenu: () => void;
}

const NavContext = createContext<NavContextValue | null>(null);

/**
 * Holds the *contextual* mobile-nav state — what the bottom bar should show for
 * the current page (Prev/Next topic links, the "+" action) plus the Menu sheet
 * open state. Global controls (theme, split view, search, user) come from their
 * own existing providers, not here.
 *
 * Pages stay server components: each renders a tiny client config component
 * (e.g. TopicNavConfig) that pushes its data in via the hooks below.
 */
export function NavProvider({ children }: { children: ReactNode }) {
    const [prev, setPrev] = useState<TopicLink | null>(null);
    const [next, setNext] = useState<TopicLink | null>(null);
    const [primaryAction, setPrimaryAction] = useState<PrimaryAction | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();

    const setPrevNext = useCallback(
        (p: TopicLink | null, n: TopicLink | null) => {
            setPrev(p);
            setNext(n);
        },
        []
    );

    const openMenu = useCallback(() => setMenuOpen(true), []);
    const closeMenu = useCallback(() => setMenuOpen(false), []);

    // Close the sheet whenever the route changes (navigation is the external
    // event we're syncing to, so a setState here is intentional).
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMenuOpen(false);
    }, [pathname]);

    return (
        <NavContext.Provider
            value={{
                prev,
                next,
                setPrevNext,
                primaryAction,
                setPrimaryAction,
                menuOpen,
                openMenu,
                closeMenu,
            }}
        >
            {children}
        </NavContext.Provider>
    );
}

export function useNav() {
    const ctx = useContext(NavContext);
    if (!ctx) {
        throw new Error("useNav must be used within a NavProvider");
    }
    return ctx;
}
