"use client";

import { useState } from 'react';
import { AddResourceForm } from './AddResourceForm';
import { Modal } from './Modal';

type ContentType = 'LINK' | 'IMAGE' | 'TEXT' | 'PDF';

export function AddResourceButton({ topicId }: { topicId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [contentType, setContentType] = useState<ContentType>('LINK');

    const handleClose = () => {
        setIsOpen(false);
        // Reset to default tab after closing
        setTimeout(() => setContentType('LINK'), 300);
    };

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
                          group animate-pulse-glow"
                aria-label="Add Resource"
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

            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="Add New Resource"
                size={contentType === 'TEXT' ? 'full' : 'lg'}
            >
                <AddResourceForm
                    topicId={topicId}
                    onSuccess={handleClose}
                    onContentTypeChange={setContentType}
                />
            </Modal>
        </>
    );
}
