"use client";

import { useAdmin } from './AdminProvider';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AddPaperForm() {
    const { isAdmin, adminCode } = useAdmin();
    const [title, setTitle] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    if (!isAdmin) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/papers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-code': adminCode || '',
                },
                body: JSON.stringify({ title }),
            });

            if (res.ok) {
                setTitle("");
                router.refresh();
            } else {
                alert("Failed to create paper");
            }
        } catch (e) {
            alert("Error creating paper");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mb-10 p-5 bg-gradient-to-r from-purple-50 to-teal-50 
                       border border-purple-100 rounded-2xl animate-slide-down">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-purple-700">Admin</span>
                <span className="text-xs text-gray-400">• Add New Paper</span>
            </div>
            <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Paper Title (e.g. Data Structures & Algorithms)"
                    className="input-modern flex-1"
                />
                <button
                    disabled={isSubmitting}
                    type="submit"
                    className="btn-primary whitespace-nowrap disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Adding...
                        </span>
                    ) : 'Add Paper'}
                </button>
            </form>
        </div>
    );
}
