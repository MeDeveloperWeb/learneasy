"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import { useNav } from "./NavProvider";
import { useSplitScreen } from "./SplitScreenProvider";
import { useTheme } from "./ThemeProvider";
import { MobileMenuSheet } from "./MobileMenuSheet";
import { GlobalSearch } from "./GlobalSearch";

/* ----------------------------------------------------------------------------
 * Mobile-only contextual bottom bar (app tab-bar style). Hidden at md+ where the
 * desktop Header takes over. Anchors: Home (left) and Menu (right). The middle
 * slots change per page:
 *   /            -> Search
 *   /paper/[id]  -> Search, + (add topic, if available)
 *   /topic/[id]  -> Prev, + (add resource), Next
 * Prev/Next collapse to a faded placeholder at the ends of a unit.
 * ------------------------------------------------------------------------- */

const ICONS: Record<string, ReactNode> = {
    home: (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
    ),
    search: (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
    ),
    prev: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
    ),
    next: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
    ),
    add: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    ),
    menu: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    ),
    moon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    ),
    sun: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    ),
};

function Icon({ name, className = "w-6 h-6" }: { name: keyof typeof ICONS; className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            {ICONS[name]}
        </svg>
    );
}

/** A standard tappable slot: icon over a tiny label. */
function Slot({
    icon,
    label,
    active = false,
    onClick,
    href,
    ariaLabel,
}: {
    icon: keyof typeof ICONS;
    label: string;
    active?: boolean;
    onClick?: () => void;
    href?: string;
    ariaLabel?: string;
}) {
    const cls = `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium
                 transition-colors ${active ? "text-purple-600" : "text-gray-500 hover:text-gray-700"}`;
    const inner = (
        <>
            <Icon name={icon} className="w-6 h-6" />
            <span>{label}</span>
        </>
    );
    if (href) {
        return (
            <Link href={href} className={cls} aria-label={ariaLabel ?? label} aria-current={active ? "page" : undefined}>
                {inner}
            </Link>
        );
    }
    return (
        <button type="button" onClick={onClick} className={cls} aria-label={ariaLabel ?? label}>
            {inner}
        </button>
    );
}

/** A faded, non-interactive placeholder keeping bar spacing stable. */
function EmptySlot({ icon, label }: { icon: keyof typeof ICONS; label: string }) {
    return (
        <div
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-gray-300"
            aria-hidden="true"
        >
            <Icon name={icon} className="w-6 h-6" />
            <span>{label}</span>
        </div>
    );
}

/** The raised gradient "+" FAB built into the bar. */
function AddSlot({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-end pb-1">
            <button
                type="button"
                onClick={onClick}
                aria-label={label}
                className="-mt-7 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-teal-400
                           text-white shadow-lg shadow-purple-500/40 flex items-center justify-center
                           active:scale-95 transition-transform"
            >
                <Icon name="add" className="w-7 h-7" />
            </button>
            <span className="text-[10px] font-medium text-gray-500 mt-0.5">Add</span>
        </div>
    );
}

export function BottomBar() {
    const pathname = usePathname();
    const { prev, next, primaryAction, menuOpen, openMenu, closeMenu } = useNav();
    const { splitScreenEnabled } = useSplitScreen();
    const { theme, toggleTheme } = useTheme();
    const [searchOpen, setSearchOpen] = useState(false);

    // The app chrome is global, but the /search panel renders this whole layout
    // inside a same-origin iframe. The panel is narrow, so `md:hidden` trips the
    // mobile breakpoint and the bar/menu show *inside the Google panel*. The real
    // app is never iframed, so suppress the bar entirely when embedded.
    const [inIframe, setInIframe] = useState(false);
    useEffect(() => {
        setInIframe(window.self !== window.top);
    }, []);
    if (inIframe) return null;

    const isHome = pathname === "/";
    const isTopic = pathname?.startsWith("/topic/") ?? false;
    const isPaper = pathname?.startsWith("/paper/") ?? false;

    const searchSlot = (
        <Slot key="search" icon="search" label="Search" onClick={() => setSearchOpen(true)} />
    );

    const middle: ReactNode[] = [];
    if (isTopic) {
        middle.push(
            prev ? (
                <Slot key="prev" icon="prev" label="Prev" href={`/topic/${prev.id}`} ariaLabel={`Previous topic: ${prev.title}`} />
            ) : (
                <EmptySlot key="prev" icon="prev" label="Prev" />
            )
        );
        if (primaryAction) {
            middle.push(<AddSlot key="add" label={primaryAction.label} onClick={primaryAction.onClick} />);
        }
        middle.push(
            next ? (
                <Slot key="next" icon="next" label="Next" href={`/topic/${next.id}`} ariaLabel={`Next topic: ${next.title}`} />
            ) : (
                <EmptySlot key="next" icon="next" label="Next" />
            )
        );
    } else {
        middle.push(searchSlot);
        if (isPaper) {
            if (primaryAction) {
                middle.push(<AddSlot key="add" label={primaryAction.label} onClick={primaryAction.onClick} />);
            }
            // Dark-mode toggle — keeps the paper bar symmetric (FAB stays centred).
            middle.push(
                <Slot
                    key="theme"
                    icon={theme === "dark" ? "sun" : "moon"}
                    label={theme === "dark" ? "Light" : "Dark"}
                    onClick={toggleTheme}
                />
            );
        }
    }

    return (
        <>
            <nav
                className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-gray-200/70 pb-safe"
                aria-label="Primary"
            >
                <div className="flex items-stretch h-16">
                    <Slot icon="home" label="Home" href="/" active={isHome} />
                    {middle}
                    <Slot icon="menu" label="Menu" onClick={openMenu} active={menuOpen} />
                </div>
            </nav>

            <MobileMenuSheet
                isOpen={menuOpen}
                onClose={closeMenu}
                onOpenSearch={() => {
                    closeMenu();
                    setSearchOpen(true);
                }}
            />

            <GlobalSearch
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
                splitScreenEnabled={splitScreenEnabled}
            />
        </>
    );
}
