"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserContextType {
    userId: string;
    username: string | null;
    setUsername: (name: string) => void;
    clearUsername: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

function generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function UserProvider({ children }: { children: ReactNode }) {
    const [userId, setUserId] = useState<string>('');
    const [username, setUsernameState] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Load or generate userId
        let storedUserId = localStorage.getItem('userId');
        if (!storedUserId) {
            storedUserId = generateUserId();
            localStorage.setItem('userId', storedUserId);
        }
        setUserId(storedUserId);

        // Load username
        const storedUsername = localStorage.getItem('username');
        setUsernameState(storedUsername);

        setIsInitialized(true);
    }, []);

    const setUsername = (name: string) => {
        const trimmedName = name.trim();
        if (trimmedName) {
            localStorage.setItem('username', trimmedName);
            setUsernameState(trimmedName);
        }
    };

    const clearUsername = () => {
        localStorage.removeItem('username');
        setUsernameState(null);
    };

    // Don't render children until initialized to avoid hydration issues
    if (!isInitialized) {
        return null;
    }

    return (
        <UserContext.Provider value={{
            userId,
            username,
            setUsername,
            clearUsername,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
