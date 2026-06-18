"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { useSplitScreen } from "./SplitScreenProvider";
import { useUser } from "./UserProvider";
import { useAdmin } from "./AdminProvider";
import { UsernameModal } from "./UsernameModal";

interface MobileMenuSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenSearch: () => void;
}

/** Reusable on/off switch matching the desktop header toggle. */
function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            role="switch"
            aria-checked={on}
            aria-label={label}
            className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0
                       ${on ? "bg-gradient-to-r from-purple-500 to-teal-400" : "bg-gray-300"}`}
        >
            <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform
                           ${on ? "translate-x-6" : "translate-x-1"}`}
            />
        </button>
    );
}

export function MobileMenuSheet({ isOpen, onClose, onOpenSearch }: MobileMenuSheetProps) {
    const { theme, toggleTheme } = useTheme();
    const { splitScreenEnabled, setSplitScreenEnabled } = useSplitScreen();
    const { username, setUsername, clearUsername } = useUser();
    const { isAdmin, login, logout } = useAdmin();

    const [isClosing, setIsClosing] = useState(false);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [showAdminInput, setShowAdminInput] = useState(false);
    const [code, setCode] = useState("");

    const sheetRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const currentY = useRef(0);
    const dragging = useRef(false);

    // No `mounted` gate needed: the sheet renders null until opened (well after
    // hydration), so theme/admin/username are already correct client values.

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            setShowAdminInput(false);
            setCode("");
            onClose();
        }, 220); // matches animate-sheet-down
    };

    // Esc to close + lock body scroll while open.
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Swipe-down to dismiss.
    const onTouchStart = (e: React.TouchEvent) => {
        startY.current = e.touches[0].clientY;
        dragging.current = true;
    };
    const onTouchMove = (e: React.TouchEvent) => {
        if (!dragging.current || !sheetRef.current) return;
        currentY.current = e.touches[0].clientY;
        const diff = currentY.current - startY.current;
        if (diff > 0) {
            sheetRef.current.style.transform = `translateY(${diff}px)`;
            sheetRef.current.style.transition = "none";
        }
    };
    const onTouchEnd = () => {
        if (!dragging.current || !sheetRef.current) return;
        const diff = currentY.current - startY.current;
        sheetRef.current.style.transition = "";
        if (diff > 120) {
            handleClose();
        } else {
            sheetRef.current.style.transform = "translateY(0)";
        }
        dragging.current = false;
        startY.current = 0;
        currentY.current = 0;
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (code) {
            login(code);
            setCode("");
            setShowAdminInput(false);
        }
    };

    if (!isOpen) return null;

    const rowBtn =
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors";

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-50 bg-black/40 ${isClosing ? "opacity-0 transition-opacity duration-200" : "animate-fade-in"}`}
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Sheet */}
            <div
                ref={sheetRef}
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                className={`fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl shadow-2xl pb-safe
                           ${isClosing ? "animate-sheet-down" : "animate-sheet-up"}`}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <span className="w-10 h-1.5 rounded-full bg-gray-300" />
                </div>

                <div className="px-4 pb-4 max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between px-1 py-2">
                        <h2 className="text-base font-bold gradient-text">Menu</h2>
                        <button
                            type="button"
                            onClick={handleClose}
                            aria-label="Close menu"
                            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search */}
                    <button type="button" onClick={onOpenSearch} className={rowBtn}>
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search topics
                    </button>

                    {/* Dark mode */}
                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="flex items-center gap-3 text-sm font-medium text-gray-700">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                            Dark mode
                        </span>
                        <Switch on={theme === "dark"} onToggle={toggleTheme} label="Toggle dark mode" />
                    </div>

                    {/* Split view */}
                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="flex items-center gap-3 text-sm font-medium text-gray-700">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                            </svg>
                            Split view
                        </span>
                        <Switch
                            on={splitScreenEnabled}
                            onToggle={() => setSplitScreenEnabled(!splitScreenEnabled)}
                            label="Toggle split view"
                        />
                    </div>

                    <div className="border-t border-gray-100 my-2" />

                    {/* User */}
                    {username ? (
                        <>
                            <div className="px-4 py-2">
                                <p className="text-xs text-gray-500">Signed in as</p>
                                <p className="text-sm font-semibold text-gray-900 truncate">{username}</p>
                            </div>
                            <button type="button" onClick={() => setShowUsernameModal(true)} className={rowBtn}>
                                Change username
                            </button>
                            <button
                                type="button"
                                onClick={() => clearUsername()}
                                className={`${rowBtn} text-red-600 hover:bg-red-50`}
                            >
                                Clear username
                            </button>
                        </>
                    ) : (
                        <button type="button" onClick={() => setShowUsernameModal(true)} className={rowBtn}>
                            Set username
                        </button>
                    )}

                    <div className="border-t border-gray-100 my-2" />

                    {/* Admin */}
                    {isAdmin ? (
                        <button
                            type="button"
                            onClick={() => logout()}
                            className={`${rowBtn} text-red-600 hover:bg-red-50`}
                        >
                            Exit admin mode
                        </button>
                    ) : !showAdminInput ? (
                        <button type="button" onClick={() => setShowAdminInput(true)} className={rowBtn}>
                            Admin login
                        </button>
                    ) : (
                        <form onSubmit={handleLogin} className="px-4 py-2">
                            <input
                                type="password"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Admin code…"
                                className="w-full text-sm border-2 border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-purple-400 transition-colors mb-2"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 text-sm bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition-colors font-medium">
                                    Login
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAdminInput(false);
                                        setCode("");
                                    }}
                                    className="flex-1 text-sm bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <UsernameModal
                isOpen={showUsernameModal}
                onClose={() => setShowUsernameModal(false)}
                onSave={setUsername}
                currentUsername={username}
            />
        </>
    );
}
