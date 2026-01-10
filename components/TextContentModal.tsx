"use client";

import { Modal } from './Modal';

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
      <div className="max-h-[calc(90vh-8rem)] overflow-y-auto">
        {/* Content with rich text formatting */}
        <div
          className="prose prose-sm md:prose-base max-w-none
                     prose-headings:font-bold prose-headings:text-gray-900
                     prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                     prose-p:text-gray-700 prose-p:leading-relaxed
                     prose-a:text-purple-600 prose-a:underline hover:prose-a:text-purple-700
                     prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
                     prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg
                     prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:pl-4 prose-blockquote:italic
                     prose-strong:text-gray-900 prose-strong:font-semibold
                     prose-ul:list-disc prose-ol:list-decimal
                     prose-li:text-gray-700 prose-li:my-1"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Author info at bottom */}
        {username && (
          <div className="mt-8 pt-4 border-t border-gray-200">
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
