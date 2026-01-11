"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAdmin } from './AdminProvider';
import { useSplitScreen } from './SplitScreenProvider';
import { useUser } from './UserProvider';
import { UsernameModal } from './UsernameModal';
import { GlobalSearch } from './GlobalSearch';
import { useState, useEffect } from 'react';

export function Header() {
    const { isAdmin, login, logout } = useAdmin();
    const { splitScreenEnabled, setSplitScreenEnabled, isDesktop } = useSplitScreen();
    const { username, setUsername, clearUsername } = useUser();
    const [showAdminInput, setShowAdminInput] = useState(false);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [code, setCode] = useState("");
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const isHomePage = pathname === '/';

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (code) {
            login(code);
            setCode("");
            setShowAdminInput(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowSearch(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <header className="glass sticky top-0 z-50 px-4 md:px-6 py-3 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
                {/* Back Button - shown when not on home page */}
                {!isHomePage && (
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 
                                   flex items-center justify-center transition-colors
                                   text-gray-600 hover:text-gray-800"
                        title="Go back"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}

                <Link
                    href="/"
                    className="text-xl md:text-2xl font-bold gradient-text hover:opacity-80 transition-opacity"
                >
                    MissionCS
                </Link>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                {/* Search Button */}
                <button
                    onClick={() => setShowSearch(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200
                               hover:bg-gray-100 transition-colors group"
                    title="Search topics (Cmd+K)"
                >
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-sm text-gray-600 hidden md:inline">Search</span>
                    <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-xs font-semibold text-gray-500
                                   bg-white border border-gray-200 rounded">
                        ⌘K
                    </kbd>
                </button>

                {/* Split Screen Toggle - Desktop only */}
                {mounted && isDesktop && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-sm text-gray-700 font-medium hidden md:inline">Split Screen</span>
                        <button
                            onClick={() => setSplitScreenEnabled(!splitScreenEnabled)}
                            className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0
                                       ${splitScreenEnabled
                                    ? 'bg-gradient-to-r from-purple-500 to-teal-400'
                                    : 'bg-gray-300'}`}
                            title={splitScreenEnabled ? 'Disable split screen' : 'Enable split screen'}
                        >
                            <div
                                className={`absolute top-1 w-4 h-4 bg-white rounded-full
                                           shadow-sm transition-transform
                                           ${splitScreenEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                )}

                {/* User Section */}
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {mounted && username && (
                            <span className="text-sm font-medium text-gray-700 hidden md:inline max-w-[100px] truncate">
                                {username}
                            </span>
                        )}
                        {mounted && isAdmin && (
                            <span className="hidden md:inline-flex px-2 py-0.5 bg-gradient-to-r from-purple-500/10 to-teal-500/10
                                           rounded-full text-xs font-medium text-purple-700 border border-purple-200">
                                Admin
                            </span>
                        )}
                    </button>

                    {/* User Menu Dropdown */}
                    {showUserMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowUserMenu(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl
                                           border border-gray-100 p-2 z-50 animate-slide-down">
                                {/* Mobile Split Screen Toggle (only on mobile) */}
                                {mounted && !isDesktop && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setSplitScreenEnabled(!splitScreenEnabled);
                                                setShowUserMenu(false);
                                            }}
                                            className="w-full flex items-center justify-between px-3 py-2
                                                       text-sm text-gray-700 hover:bg-gray-50 rounded-lg
                                                       transition-colors"
                                        >
                                            <span className="font-medium">Split Screen</span>
                                            <div
                                                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0
                                                           ${splitScreenEnabled
                                                        ? 'bg-gradient-to-r from-purple-500 to-teal-400'
                                                        : 'bg-gray-300'}`}
                                            >
                                                <div
                                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full
                                                               shadow-sm transition-transform
                                                               ${splitScreenEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                                                />
                                            </div>
                                        </button>
                                        <div className="border-t border-gray-100 my-2" />
                                    </>
                                )}

                                {username ? (
                                    <>
                                        <div className="px-3 py-2 border-b border-gray-100 mb-2">
                                            <p className="text-xs text-gray-500">Signed in as</p>
                                            <p className="text-sm font-semibold text-gray-900 truncate">{username}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                setShowUsernameModal(true);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                        >
                                            Change Username
                                        </button>
                                        <button
                                            onClick={() => {
                                                clearUsername();
                                                setShowUserMenu(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            Clear Username
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            setShowUsernameModal(true);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        Set Username
                                    </button>
                                )}

                                {/* Admin Section in Dropdown */}
                                <div className="border-t border-gray-100 mt-2 pt-2">
                                    {isAdmin ? (
                                        <button
                                            onClick={() => {
                                                logout();
                                                setShowUserMenu(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            Exit Admin Mode
                                        </button>
                                    ) : (
                                        <>
                                            {!showAdminInput ? (
                                                <button
                                                    onClick={() => setShowAdminInput(true)}
                                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                                >
                                                    Admin Login
                                                </button>
                                            ) : (
                                                <form
                                                    onSubmit={handleLogin}
                                                    className="px-3 py-2"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <input
                                                        type="password"
                                                        value={code}
                                                        onChange={(e) => setCode(e.target.value)}
                                                        placeholder="Admin code..."
                                                        className="w-full text-sm border-2 border-gray-200 rounded-lg px-3 py-1.5
                                                                 outline-none focus:border-purple-400 transition-colors mb-2"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="submit"
                                                            className="flex-1 text-sm bg-purple-500 text-white px-3 py-1.5 rounded-lg
                                                                     hover:bg-purple-600 transition-colors font-medium"
                                                        >
                                                            Login
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowAdminInput(false);
                                                                setCode("");
                                                            }}
                                                            className="flex-1 text-sm bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg
                                                                     hover:bg-gray-300 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Username Modal */}
            <UsernameModal
                isOpen={showUsernameModal}
                onClose={() => setShowUsernameModal(false)}
                onSave={setUsername}
                currentUsername={username}
            />

            {/* Global Search Modal */}
            <GlobalSearch
                isOpen={showSearch}
                onClose={() => setShowSearch(false)}
                splitScreenEnabled={splitScreenEnabled}
            />
        </header>
    );
}
