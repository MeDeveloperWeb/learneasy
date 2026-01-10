"use client";

import { useState } from 'react';
import { Modal } from './Modal';

interface UsernameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (username: string) => void;
    currentUsername?: string | null;
}

export function UsernameModal({ isOpen, onClose, onSave, currentUsername }: UsernameModalProps) {
    const [username, setUsername] = useState(currentUsername || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = username.trim();
        if (trimmed) {
            onSave(trimmed);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Set Username">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                        Choose a username
                    </label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        autoFocus
                        maxLength={30}
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        This will be displayed when you add resources
                    </p>
                </div>

                <div className="flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-teal-400 text-white rounded-lg hover:shadow-lg transition-all"
                    >
                        Save
                    </button>
                </div>
            </form>
        </Modal>
    );
}
