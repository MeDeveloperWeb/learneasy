"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

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
    const [userId] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            let storedUserId = localStorage.getItem('userId');
            if (!storedUserId) {
                storedUserId = generateUserId();
                localStorage.setItem('userId', storedUserId);
            }
            return storedUserId;
        }
        return '';
    });

    const [username, setUsernameState] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('username');
        }
        return null;
    });

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
