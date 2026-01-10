"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type AdminContextType = {
    isAdmin: boolean;
    adminCode: string | null;
    login: (code: string) => void;
    logout: () => void;
};

const AdminContext = createContext<AdminContextType>({
    isAdmin: false,
    adminCode: null,
    login: () => { },
    logout: () => { },
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const [adminCode, setAdminCode] = useState<string | null>(null);

    useEffect(() => {
        const storedCode = localStorage.getItem('adminCode');
        if (storedCode) {
            setAdminCode(storedCode);
        }
    }, []);

    const login = (code: string) => {
        localStorage.setItem('adminCode', code);
        setAdminCode(code);
    };

    const logout = () => {
        localStorage.removeItem('adminCode');
        setAdminCode(null);
    };

    // In a real app we might verify the code with an API, but for MVP local check + server 403 is enough
    // The server checks the code on write operations.
    // The client "isAdmin" just toggles visibility. 
    // We'll assume if code is present, we show the UI. 
    // If the code is wrong, the API will fail. 
    const isAdmin = !!adminCode;

    return (
        <AdminContext.Provider value={{ isAdmin, adminCode, login, logout }}>
            {children}
        </AdminContext.Provider>
    );
}

export const useAdmin = () => useContext(AdminContext);
