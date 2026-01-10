"use client";

import { useAdmin } from './AdminProvider';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AddTopicForm({ unitId, isCustom, onSuccess }: { unitId: string, isCustom?: boolean, onSuccess?: () => void }) {
    const { isAdmin, adminCode } = useAdmin();
    const [title, setTitle] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    if (!isAdmin && !isCustom) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/topics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-code': adminCode || '',
                },
                body: JSON.stringify({ title, unitId }),
            });

            if (res.ok) {
                setTitle("");
                router.refresh();
                onSuccess?.();
            } else {
                alert("Failed to create topic");
            }
        } catch (e) {
            alert("Error creating topic");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic Name
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={isCustom ? "e.g. Practice Problems, Study Tips..." : "e.g. Process Scheduling, Memory Management..."}
                    className="input-modern"
                    disabled={isSubmitting}
                    autoFocus
                />
            </div>
            <button
                disabled={isSubmitting || !title}
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-2 
                          disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? (
                    <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Adding Topic...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Topic
                    </>
                )}
            </button>
        </form>
    );
}
