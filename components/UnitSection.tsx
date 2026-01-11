"use client";

import { useState, useEffect } from 'react';
import { useAdmin } from './AdminProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    insertAfterIndex?: number; // undefined means add at end
}

export function UnitSection({ unit, unitIndex }: UnitSectionProps) {
    const { isAdmin, adminCode } = useAdmin();
    const router = useRouter();
    const [newEntries, setNewEntries] = useState<NewTopicEntry[]>([]);
    const [editedTopics, setEditedTopics] = useState<Map<string, string>>(new Map());
    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
    const [localTopics, setLocalTopics] = useState<Topic[]>(unit.topics);
    const [hasReordered, setHasReordered] = useState(false);

    // Sync localTopics when unit.topics changes (after save/refresh)
    useEffect(() => {
        setLocalTopics(unit.topics);
    }, [unit.topics]);

    const handleAddNew = () => {
        const newEntry: NewTopicEntry = {
            id: `new-${Date.now()}`,
            title: '',
            insertAfterIndex: undefined, // Add at end
        };
        setNewEntries([...newEntries, newEntry]);
    };

    const handleInsertAfter = (index: number) => {
        const newEntry: NewTopicEntry = {
            id: `new-${Date.now()}`,
            title: '',
            insertAfterIndex: index,
        };
        setNewEntries([...newEntries, newEntry]);
    };

    // Build merged display array with new entries in correct positions
    const getMergedTopics = () => {
        const merged: Array<{ type: 'existing' | 'new'; data: Topic | NewTopicEntry; originalIndex?: number }> = [];

        // Add all existing topics with their new entries
        localTopics.forEach((topic, index) => {
            merged.push({ type: 'existing', data: topic, originalIndex: index });

            // Add any new entries that should come after this topic
            const entriesAfterThis = newEntries.filter(e => e.insertAfterIndex === index);
            entriesAfterThis.forEach(entry => {
                merged.push({ type: 'new', data: entry });
            });
        });

        // Add entries that should go at the end
        const entriesAtEnd = newEntries.filter(e => e.insertAfterIndex === undefined);
        entriesAtEnd.forEach(entry => {
            merged.push({ type: 'new', data: entry });
        });

        return merged;
    };

    const handleSaveAll = async () => {
        const validNewEntries = newEntries.filter(e => e.title.trim());
        const editedEntries = Array.from(editedTopics.entries())
            .map(([id, title]) => ({ id, title }))
            .filter(e => e.title.trim());

        if (validNewEntries.length === 0 && editedEntries.length === 0 && !hasReordered) return;

        const allIds = [...validNewEntries.map(e => e.id), ...editedEntries.map(e => e.id)];
        if (hasReordered || validNewEntries.length > 0) {
            allIds.push(...localTopics.map(t => t.id));
        }
        setSavingIds(new Set(allIds));

        try {
            const promises: Promise<Response>[] = [];

            // When we have new entries or reordering, we need to recalculate all orders
            if (validNewEntries.length > 0 || hasReordered) {
                const merged = getMergedTopics();

                merged.forEach((item, index) => {
                    const newOrder = (index + 1) * 1024;

                    if (item.type === 'new') {
                        const entry = item.data as NewTopicEntry;
                        if (entry.title.trim()) {
                            promises.push(
                                fetch('/api/topics', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'x-admin-code': adminCode || '',
                                    },
                                    body: JSON.stringify({
                                        title: entry.title,
                                        unitId: unit.id,
                                        order: newOrder
                                    }),
                                })
                            );
                        }
                    } else {
                        const topic = item.data as Topic;
                        // Update order for existing topics
                        promises.push(
                            fetch(`/api/topics/${topic.id}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'x-admin-code': adminCode || '',
                                },
                                body: JSON.stringify({ order: newOrder }),
                            })
                        );
                    }
                });
            }

            // Update edited topic titles (separate from order updates)
            editedEntries.forEach(entry => {
                promises.push(
                    fetch(`/api/topics/${entry.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-code': adminCode || '',
                        },
                        body: JSON.stringify({ title: entry.title }),
                    })
                );
            });

            const results = await Promise.all(promises);
            const allSuccess = results.every(res => res.ok);

            if (allSuccess) {
                setNewEntries([]);
                setEditedTopics(new Map());
                setHasReordered(false);
                router.refresh();
            } else {
                alert('Failed to save some topics');
            }
        } catch (error) {
            alert('Error saving topics');
        } finally {
            setSavingIds(new Set());
        }
    };

    const handleStartEdit = (topicId: string, currentTitle: string) => {
        setEditedTopics(new Map(editedTopics).set(topicId, currentTitle));
    };

    const handleCancelEdit = (topicId: string) => {
        const newMap = new Map(editedTopics);
        newMap.delete(topicId);
        setEditedTopics(newMap);
    };

    const handleEditTitleChange = (topicId: string, title: string) => {
        setEditedTopics(new Map(editedTopics).set(topicId, title));
    };

    const handleDeleteTopic = async (topicId: string) => {
        if (!confirm('Are you sure you want to delete this topic?')) return;
        try {
            const res = await fetch(`/api/topics/${topicId}`, {
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

    const handleReorder = (topicId: string, direction: 'up' | 'down') => {
        const currentIndex = localTopics.findIndex(t => t.id === topicId);
        if (currentIndex === -1) return;

        if (direction === 'up' && currentIndex === 0) return;
        if (direction === 'down' && currentIndex === localTopics.length - 1) return;

        const newTopics = [...localTopics];
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        // Swap
        [newTopics[currentIndex], newTopics[targetIndex]] = [newTopics[targetIndex], newTopics[currentIndex]];

        setLocalTopics(newTopics);
        setHasReordered(true);
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
                    {getMergedTopics().map((item, displayIndex) => {
                        if (item.type === 'new') {
                            const entry = item.data as NewTopicEntry;
                            return (
                                <li key={entry.id} className="flex items-center gap-3 py-2 px-4 bg-gray-50 rounded-xl animate-fade-in">
                                    <input
                                        type="text"
                                        value={entry.title}
                                        onChange={(e) => handleTitleChange(entry.id, e.target.value)}
                                        placeholder="Enter topic name..."
                                        className="input-modern flex-1 py-2 text-sm"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') handleCancel(entry.id);
                                        }}
                                    />
                                    <button
                                        onClick={() => handleCancel(entry.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                        title="Remove"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </li>
                            );
                        }

                        const topic = item.data as Topic;
                        const originalIndex = item.originalIndex!;
                        const isEditing = editedTopics.has(topic.id);
                        const editedTitle = editedTopics.get(topic.id) || topic.title;
                        const isFirst = originalIndex === 0;
                        const isLast = originalIndex === localTopics.length - 1;

                        if (isEditing) {
                            return (
                                <li key={topic.id} className="flex items-center gap-3 py-2 px-4 bg-gray-50 rounded-xl animate-fade-in">
                                    <input
                                        type="text"
                                        value={editedTitle}
                                        onChange={(e) => handleEditTitleChange(topic.id, e.target.value)}
                                        className="input-modern flex-1 py-2 text-sm"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') handleCancelEdit(topic.id);
                                        }}
                                    />
                                    <button
                                        onClick={() => handleCancelEdit(topic.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                        title="Cancel"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </li>
                            );
                        }

                        return (
                            <li key={topic.id} className="group flex items-center justify-between py-2.5 px-4 rounded-xl
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
                                            {topic._count.resources}<span className="hidden sm:inline"> resources</span>
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {isAdmin && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleInsertAfter(originalIndex)}
                                                className="text-gray-400 hover:text-green-500
                                                         px-1.5 py-1 rounded hover:bg-green-50 transition-all"
                                                title="Insert topic after this"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </button>
                                            <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                            <button
                                                onClick={() => handleReorder(topic.id, 'up')}
                                                disabled={isFirst}
                                                className="text-gray-400 hover:text-purple-500 disabled:opacity-30 disabled:cursor-not-allowed
                                                         px-1.5 py-1 rounded hover:bg-purple-50 transition-all"
                                                title="Move up"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleReorder(topic.id, 'down')}
                                                disabled={isLast}
                                                className="text-gray-400 hover:text-purple-500 disabled:opacity-30 disabled:cursor-not-allowed
                                                         px-1.5 py-1 rounded hover:bg-purple-50 transition-all"
                                                title="Move down"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                            <button
                                                onClick={() => handleStartEdit(topic.id, topic.title)}
                                                className="text-xs text-gray-400 hover:text-purple-500
                                                         px-2 py-1 rounded hover:bg-purple-50 transition-all"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTopic(topic.id)}
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
                    })}
                </ul>
                {localTopics.length === 0 && newEntries.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">
                        No topics in this unit yet.
                    </p>
                )}
                {(newEntries.length > 0 || editedTopics.size > 0 || hasReordered) && (
                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={handleSaveAll}
                            disabled={savingIds.size > 0 || (newEntries.every(e => !e.title.trim()) && editedTopics.size === 0 && !hasReordered)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg
                                     hover:bg-green-600 transition-colors font-medium disabled:opacity-50
                                     disabled:cursor-not-allowed text-sm"
                        >
                            {savingIds.size > 0 ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save All{hasReordered && ' + Reorder'}
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setNewEntries([]);
                                setEditedTopics(new Map());
                                setLocalTopics(unit.topics);
                                setHasReordered(false);
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg
                                     hover:bg-gray-300 transition-colors font-medium text-sm"
                        >
                            Cancel All
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
