"use client";

import { Modal } from './Modal';
import { RichTextViewer } from './RichTextViewer';

interface TextContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  username?: string | null;
}

export function TextContentModal({ isOpen, onClose, title, content, username }: TextContentModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="full">
      <div className="flex flex-col h-[calc(90vh-8rem)]">
        {/* Content with rich text editor (read-only) */}
        <div className="flex-1 overflow-hidden">
          <RichTextViewer content={content} />
        </div>

        {/* Author info at bottom */}
        {username && (
          <div className="flex-shrink-0 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Created by {username}</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
