"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    toggleTheme: () => { },
    setTheme: () => { },
});

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Deterministic initial value: SSR can't know the user's theme, so it always
    // renders 'light'. The first CLIENT render must match that, so we also start at
    // 'light' here (NOT by reading the DOM/localStorage) — otherwise theme-dependent
    // UI like the toggle (icon/label/aria) renders 'dark' on the client vs 'light'
    // on the server, a hydration mismatch that makes React regenerate <html> and
    // drop the pre-paint `.dark` class (the "reloads light / two clicks" + flash bug).
    // The real theme is applied to <html> pre-paint by the inline script (no visual
    // flash) and synced into React state in the mount effect below.
    const [theme, setThemeState] = useState<Theme>('light');

    const setTheme = (next: Theme) => {
        setThemeState(next);
        applyTheme(next);
        try {
            localStorage.setItem('theme', next);
        } catch {
            // ignore storage errors (private mode etc.)
        }
    };

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    // Re-assert the theme once, right after mount. A hydration mismatch on a page
    // (e.g. streamed/Suspense content) can make React regenerate <html>, dropping
    // the `.dark` class the inline script set pre-paint — leaving state='dark' but
    // the DOM in light mode (the "reloads light / needs two toggle clicks" bug).
    // localStorage is the source of truth, so read it and force DOM + state to agree.
    useEffect(() => {
        let saved: Theme | null = null;
        try {
            const v = localStorage.getItem('theme');
            if (v === 'dark' || v === 'light') saved = v;
        } catch {
            // ignore storage errors (private mode etc.)
        }
        const resolved: Theme =
            saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setThemeState(resolved);
        applyTheme(resolved);
    }, []);

    // Keep in sync if another tab changes the theme.
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
                setThemeState(e.newValue);
                applyTheme(e.newValue);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
