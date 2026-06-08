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
    // Initialise from the class the inline script (in layout) already set on <html>,
    // so client state matches the pre-paint DOM and there is no flash / mismatch.
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
            return 'dark';
        }
        return 'light';
    });

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
