"use client";

import { useState } from 'react';
import { AddTopicForm } from './AddTopicForm';
import { Modal } from './Modal';

export function AddTopicButton({ unitId, isCustom }: { unitId: string; isCustom?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating Action Button - positioned within parent container */}
            <button
                onClick={() => setIsOpen(true)}
                className="absolute bottom-8 right-6 w-14 h-14 z-40
                          bg-gradient-to-br from-purple-500 to-teal-400
                          text-white rounded-2xl shadow-lg
                          shadow-purple-500/30 hover:shadow-purple-500/50
                          hover:scale-110 active:scale-100
                          transition-all duration-200
                          flex items-center justify-center
                          group"
                aria-label="Add Topic"
                title="Add Community Topic"
            >
                <svg
                    className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Community Topic">
                {isCustom && (
                    <div className="mb-4 p-3 bg-purple-50 rounded-xl border border-purple-100">
                        <p className="text-sm text-purple-600">
                            📝 Anyone can add topics to this community section.
                        </p>
                    </div>
                )}
                <AddTopicForm unitId={unitId} isCustom={isCustom} onSuccess={() => setIsOpen(false)} />
            </Modal>
        </>
    );
}
