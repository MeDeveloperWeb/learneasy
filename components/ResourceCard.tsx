"use client";

import { useAdmin } from './AdminProvider';
import { useSplitScreen } from './SplitScreenProvider';
import { useUser } from './UserProvider';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TextContentModal } from './TextContentModal';
import { RichTextEditor } from './RichTextEditor';
import { Modal } from './Modal';

interface ResourceCardProps {
    resource: {
        id: string;
        name: string;
        contentType: 'LINK' | 'IMAGE' | 'TEXT' | 'PDF';
        url: string | null;
        description: string | null;
        imageUrl: string | null;
        fileUrl: string | null;
        textContent: string | null;
        userId?: string | null;
        username?: string | null;
    };
    index?: number;
}

export function ResourceCard({ resource, index = 0 }: ResourceCardProps) {
    const { isAdmin, adminCode } = useAdmin();
    const { openInSplitScreen, openTextInSplitScreen, splitScreenEnabled, isDesktop } = useSplitScreen();
    const { userId: currentUserId } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(resource.name);
    const [editedUrl, setEditedUrl] = useState(resource.url || '');
    const [editedTextContent, setEditedTextContent] = useState(resource.textContent || '');
    const [showTextModal, setShowTextModal] = useState(false);
    const router = useRouter();

    const isOwner = resource.userId && resource.userId === currentUserId;

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this resource?')) return;

        try {
            let res;
            if (isAdmin) {
                // Admin can delete any resource
                res = await fetch(`/api/resources/${resource.id}`, {
                    method: 'DELETE',
                    headers: {
                        'x-admin-code': adminCode || '',
                    },
                });
            } else if (isOwner) {
                // User can delete their own resource
                res = await fetch(`/api/resources?id=${resource.id}&userId=${currentUserId}`, {
                    method: 'DELETE',
                });
            } else {
                return;
            }

            if (res.ok) {
                router.refresh();
            } else {
                alert('Failed to delete resource');
            }
        } catch (error) {
            alert('Error deleting resource');
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Reset edited values to current resource values
        setEditedName(resource.name);
        setEditedUrl(resource.url || '');
        setEditedTextContent(resource.textContent || '');
        setIsEditing(true);
    };

    const handleSaveEdit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        e?.stopPropagation();

        try {
            const res = await fetch('/api/resources', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: resource.id,
                    userId: currentUserId,
                    name: editedName,
                    url: editedUrl,
                    textContent: resource.contentType === 'TEXT' ? editedTextContent : undefined,
                }),
            });

            if (res.ok) {
                setIsEditing(false);
                router.refresh();
            } else {
                alert('Failed to update resource');
            }
        } catch (error) {
            alert('Error updating resource');
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedName(resource.name);
        setEditedUrl(resource.url || '');
        setEditedTextContent(resource.textContent || '');
    };

    const handleClick = (e: React.MouseEvent) => {
        // Handle TEXT content type
        if (resource.contentType === 'TEXT') {
            e.preventDefault();
            if (splitScreenEnabled && isDesktop && resource.textContent) {
                // Open in split screen if enabled and on desktop
                openTextInSplitScreen(resource.textContent, resource.name);
            } else {
                // Otherwise open in modal
                setShowTextModal(true);
            }
            return;
        }

        // Get the target URL based on content type
        let targetUrl: string | null = null;

        if (resource.contentType === 'LINK' && resource.url) {
            targetUrl = resource.url;
        } else if ((resource.contentType === 'PDF' || resource.contentType === 'IMAGE') && resource.fileUrl) {
            targetUrl = resource.fileUrl;
        }

        if (!targetUrl) {
            e.preventDefault();
            return;
        }

        // If split screen is enabled and on desktop, open with appropriate viewer
        if (splitScreenEnabled && isDesktop && (resource.contentType === 'LINK' || resource.contentType === 'PDF' || resource.contentType === 'IMAGE')) {
            e.preventDefault();
            if (resource.contentType === 'PDF') {
                openInSplitScreen(targetUrl, 'pdf');
            } else if (resource.contentType === 'IMAGE') {
                openInSplitScreen(targetUrl, 'image');
            } else {
                openInSplitScreen(targetUrl);
            }
        }
        // Otherwise, default behavior (opens in new tab via href)
    };

    // Extract domain from URL for display
    const getDomain = (url: string) => {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url;
        }
    };

    // Determine if this should be a link or div
    const hasLink =
        (resource.contentType === 'LINK' && resource.url) ||
        (resource.contentType === 'PDF' && resource.fileUrl) ||
        (resource.contentType === 'IMAGE' && resource.fileUrl);

    const isClickable = hasLink || resource.contentType === 'TEXT';

    const linkHref =
        resource.contentType === 'LINK' ? resource.url :
        (resource.contentType === 'PDF' || resource.contentType === 'IMAGE') ? resource.fileUrl :
        null;

    const Wrapper = hasLink ? 'a' : 'div';
    const wrapperProps = hasLink && linkHref
        ? {
            href: linkHref,
            target: "_blank" as const,
            rel: "noopener noreferrer"
        }
        : {};

    return (
        <>
            <Wrapper
                {...wrapperProps}
                onClick={handleClick}
                className={`group block bg-white rounded-2xl shadow-sm overflow-hidden
                           gradient-border ${isClickable ? 'card-hover cursor-pointer' : ''} animate-slide-up
                           stagger-${Math.min(index + 1, 6)}`}
                style={{ opacity: 0 }}
            >
            {/* Image Section */}
            {resource.imageUrl && (
                <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                    <img
                        src={resource.imageUrl}
                        alt={resource.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                            e.currentTarget.parentElement!.style.display = 'none';
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 
                                   group-hover:opacity-100 transition-opacity" />
                </div>
            )}

            {/* Content Section */}
            <div className="p-5 relative">
                {/* Edit/Delete Buttons for Owner or Admin */}
                {(isAdmin || isOwner) && (
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        {isOwner && (
                            <button
                                onClick={handleEdit}
                                className="bg-blue-500 hover:bg-blue-600 text-white
                                         w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
                                title="Edit"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600 text-white
                                     w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
                            title="Delete"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                )}

                <h3 className="font-semibold text-gray-800 group-hover:text-purple-600
                             transition-colors mb-2 line-clamp-2 pr-16">
                    {resource.name}
                </h3>

                {!isEditing && resource.contentType === 'LINK' && resource.url && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span className="truncate">{getDomain(resource.url)}</span>
                    </div>
                )}

                {!isEditing && resource.contentType === 'IMAGE' && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Image</span>
                    </div>
                )}

                {!isEditing && resource.contentType === 'TEXT' && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Text Note</span>
                    </div>
                )}

                {!isEditing && resource.contentType === 'PDF' && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span>PDF Document</span>
                    </div>
                )}

                {!isEditing && resource.contentType === 'LINK' && resource.description && (
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                        {resource.description}
                    </p>
                )}

                {!isEditing && resource.contentType === 'TEXT' && resource.textContent && (
                    <div
                        className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none
                                   [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 line-clamp-4"
                        dangerouslySetInnerHTML={{ __html: resource.textContent }}
                    />
                )}

                {/* Bottom section - Username and Visit indicator */}
                {!isEditing && (
                    <div className="mt-4 flex items-center justify-between">
                        {/* Show username if available */}
                        {resource.username && (
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>{resource.username}</span>
                            </div>
                        )}

                        {/* Visit indicator - shows split screen hint when enabled */}
                        {hasLink && (
                            <div className="flex items-center text-xs text-purple-500 font-medium
                                           opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                <span>
                                    {splitScreenEnabled && isDesktop
                                        ? 'Open in panel'
                                        : resource.contentType === 'PDF'
                                        ? 'View PDF'
                                        : resource.contentType === 'IMAGE'
                                        ? 'View image'
                                        : 'Visit resource'}
                                </span>
                                <svg className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {splitScreenEnabled && isDesktop ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    )}
                                </svg>
                            </div>
                        )}

                        {/* Text content indicator */}
                        {resource.contentType === 'TEXT' && (
                            <div className="flex items-center text-xs text-purple-500 font-medium
                                           opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                <span>
                                    {splitScreenEnabled && isDesktop ? 'Open in panel' : 'Read more'}
                                </span>
                                <svg className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {splitScreenEnabled && isDesktop ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M9 5l7 7-7 7" />
                                    )}
                                </svg>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Wrapper>

        {/* Text Content Modal */}
        {resource.contentType === 'TEXT' && resource.textContent && (
            <TextContentModal
                isOpen={showTextModal}
                onClose={() => setShowTextModal(false)}
                title={resource.name}
                content={resource.textContent}
                username={resource.username}
            />
        )}

        {/* Edit Modal */}
        <Modal
            isOpen={isEditing}
            onClose={handleCancelEdit}
            title={`Edit ${resource.contentType === 'TEXT' ? 'Text' : 'Resource'}`}
            size={resource.contentType === 'TEXT' ? 'full' : 'lg'}
        >
            <form onSubmit={handleSaveEdit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {resource.contentType === 'TEXT' ? 'Title' : 'Resource Name'}
                    </label>
                    <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="input-modern"
                        placeholder="Resource name"
                        required
                    />
                </div>

                {resource.contentType === 'LINK' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Resource URL
                        </label>
                        <input
                            type="url"
                            value={editedUrl}
                            onChange={(e) => setEditedUrl(e.target.value)}
                            className="input-modern"
                            placeholder="Resource URL"
                            required
                        />
                    </div>
                )}

                {resource.contentType === 'TEXT' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content
                        </label>
                        <RichTextEditor
                            value={editedTextContent}
                            onChange={setEditedTextContent}
                            placeholder="Edit your text content..."
                        />
                    </div>
                )}

                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                    </button>
                    <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
        </>
    );
}
