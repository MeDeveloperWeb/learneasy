"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useAdmin } from './AdminProvider';
import { useRouter } from 'next/navigation';

interface TopicItemProps {
    topic: {
        id: string;
        title: string;
        _count: { resources: number };
    };
}

export function TopicItem({ topic }: TopicItemProps) {
    const { isAdmin, adminCode } = useAdmin();
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(topic.title);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!editTitle.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/topics/${topic.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-code': adminCode || '',
                },
                body: JSON.stringify({ title: editTitle }),
            });

            if (res.ok) {
                setIsEditing(false);
                router.refresh();
            } else {
                alert('Failed to update topic');
            }
        } catch (error) {
            alert('Error updating topic');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this topic?')) return;
        try {
            const res = await fetch(`/api/topics/${topic.id}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-code': adminCode || '',
                },
            });

            if (res.ok) {
                router.refresh();
            } else {
                alert('Failed to delete topic');
            }
        } catch (error) {
            alert('Error deleting topic');
        }
    };

    if (isEditing) {
        return (
            <li className="flex items-center gap-3 py-2 px-4 bg-gray-50 rounded-xl animate-fade-in">
                <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="input-modern flex-1 py-2 text-sm"
                    autoFocus
                />
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg 
                             hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
                >
                    Save
                </button>
                <button
                    onClick={() => setIsEditing(false)}
                    className="text-xs bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg 
                             hover:bg-gray-300 transition-colors font-medium"
                >
                    Cancel
                </button>
            </li>
        );
    }

    return (
        <li className="group flex items-center justify-between py-2.5 px-4 rounded-xl 
                      hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent 
                      transition-all duration-200">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-teal-400 
                               group-hover:scale-125 transition-transform" />
                <Link
                    href={`/topic/${topic.id}`}
                    className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
                >
                    {topic.title}
                </Link>
                {topic._count.resources > 0 && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full
                                   group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                        {topic._count.resources} resources
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                {isAdmin && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-xs text-gray-400 hover:text-purple-500 
                                     px-2 py-1 rounded hover:bg-purple-50 transition-all"
                        >
                            Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            className="text-xs text-red-400 hover:text-red-500 
                                     px-2 py-1 rounded hover:bg-red-50 transition-all"
                        >
                            Delete
                        </button>
                    </div>
                )}
                <svg
                    className="w-4 h-4 text-gray-300 group-hover:text-purple-400 
                              group-hover:translate-x-1 transition-all"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </li>
    );
}
