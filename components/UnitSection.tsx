"use client";

import { useState } from 'react';
import { useAdmin } from './AdminProvider';
import { useRouter } from 'next/navigation';
import { TopicItem } from './TopicItem';

interface Topic {
    id: string;
    title: string;
    _count: { resources: number };
}

interface UnitSectionProps {
    unit: {
        id: string;
        title: string;
        topics: Topic[];
    };
    unitIndex: number;
}

interface NewTopicEntry {
    id: string;
    title: string;
}

export function UnitSection({ unit, unitIndex }: UnitSectionProps) {
    const { isAdmin, adminCode } = useAdmin();
    const router = useRouter();
    const [newEntries, setNewEntries] = useState<NewTopicEntry[]>([]);
    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

    const handleAddNew = () => {
        const newEntry: NewTopicEntry = {
            id: `new-${Date.now()}`,
            title: '',
        };
        setNewEntries([...newEntries, newEntry]);
    };

    const handleSave = async (entryId: string, title: string) => {
        if (!title.trim()) return;

        setSavingIds(new Set(savingIds).add(entryId));
        try {
            const res = await fetch('/api/topics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-code': adminCode || '',
                },
                body: JSON.stringify({ title, unitId: unit.id }),
            });

            if (res.ok) {
                setNewEntries(newEntries.filter(e => e.id !== entryId));
                router.refresh();
            } else {
                alert('Failed to create topic');
            }
        } catch (error) {
            alert('Error creating topic');
        } finally {
            setSavingIds(prev => {
                const next = new Set(prev);
                next.delete(entryId);
                return next;
            });
        }
    };

    const handleCancel = (entryId: string) => {
        setNewEntries(newEntries.filter(e => e.id !== entryId));
    };

    const handleTitleChange = (entryId: string, title: string) => {
        setNewEntries(newEntries.map(e => e.id === entryId ? { ...e, title } : e));
    };

    return (
        <div
            className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden
                       animate-slide-up stagger-${Math.min(unitIndex + 1, 6)}`}
            style={{ opacity: 0 }}
        >
            {/* Unit Header */}
            <div className="bg-gradient-to-r from-purple-50 to-teal-50 px-6 py-4
                           border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-800 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-white shadow-sm
                                       flex items-center justify-center text-sm font-bold
                                       text-purple-600">
                            {unitIndex + 1}
                        </span>
                        {unit.title}
                    </h2>
                    {isAdmin && (
                        <button
                            onClick={handleAddNew}
                            className="flex items-center gap-1.5 px-3 py-1.5
                                      text-sm font-medium text-purple-600
                                      bg-white hover:bg-purple-50
                                      border border-purple-200 hover:border-purple-300
                                      rounded-lg shadow-sm hover:shadow-md
                                      transition-all duration-200
                                      group"
                        >
                            <svg
                                className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="hidden sm:inline">Add Topic</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Topics List */}
            <div className="p-6">
                <ul className="space-y-2">
                    {unit.topics.map(topic => (
                        <TopicItem key={topic.id} topic={topic} />
                    ))}
                    {newEntries.map(entry => (
                        <li key={entry.id} className="flex items-center gap-3 py-2 px-4 bg-gray-50 rounded-xl animate-fade-in">
                            <input
                                type="text"
                                value={entry.title}
                                onChange={(e) => handleTitleChange(entry.id, e.target.value)}
                                placeholder="Enter topic name..."
                                className="input-modern flex-1 py-2 text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSave(entry.id, entry.title);
                                    if (e.key === 'Escape') handleCancel(entry.id);
                                }}
                            />
                            <button
                                onClick={() => handleSave(entry.id, entry.title)}
                                disabled={savingIds.has(entry.id) || !entry.title.trim()}
                                className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg
                                         hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => handleCancel(entry.id)}
                                className="text-xs bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg
                                         hover:bg-gray-300 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                        </li>
                    ))}
                </ul>
                {unit.topics.length === 0 && newEntries.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">
                        No topics in this unit yet.
                    </p>
                )}
            </div>
        </div>
    );
}
