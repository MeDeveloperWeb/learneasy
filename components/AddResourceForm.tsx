"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from './UserProvider';
import { UsernameModal } from './UsernameModal';
import { RichTextEditor } from './RichTextEditor';

type ContentType = 'LINK' | 'IMAGE' | 'TEXT' | 'PDF';

export function AddResourceForm({
    topicId,
    onSuccess,
    onContentTypeChange,
    initialUrl = ""
}: {
    topicId: string;
    onSuccess?: () => void;
    onContentTypeChange?: (type: ContentType) => void;
    initialUrl?: string;
}) {
    const [contentType, setContentType] = useState<ContentType>('LINK');

    const handleContentTypeChange = (type: ContentType) => {
        setContentType(type);
        onContentTypeChange?.(type);
    };
    const [name, setName] = useState("");
    const [url, setUrl] = useState(initialUrl);
    const [textContent, setTextContent] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const { userId, username, setUsername } = useUser();
    const router = useRouter();

    // Debounce Logic
    useEffect(() => {
        if (!url) return;

        const isValidUrl = (string: string) => {
            try {
                new URL(string);
                return true;
            } catch (_) {
                return false;
            }
        };

        if (!isValidUrl(url)) return;

        const timer = setTimeout(async () => {
            fetchMetadata(url);
        }, 800);

        return () => clearTimeout(timer);
    }, [url]);

    const fetchMetadata = async (targetUrl: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/metadata?url=${encodeURIComponent(targetUrl)}`);
            const data = await res.json();
            if (data.title) {
                setName(data.title.trim());
            }
        } catch (error) {
            console.error("Failed to fetch metadata");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pastedUrl = e.clipboardData.getData('text');
        try {
            new URL(pastedUrl);
            fetchMetadata(pastedUrl);
        } catch (_) {
            // Invalid URL
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate based on content type
        if (!name) return;
        if (contentType === 'LINK' && !url) return;
        if (contentType === 'TEXT' && !textContent) return;
        if (contentType === 'IMAGE' && !imageFile) return;
        if (contentType === 'PDF' && !pdfFile) return;

        // Check if username is set
        if (!username) {
            setShowUsernameModal(true);
            return;
        }

        setIsSubmitting(true);
        try {
            let fileUrl = null;
            let imageUrl = null;

            // Upload file to Google Drive if it's an image or PDF
            if ((contentType === 'IMAGE' && imageFile) || (contentType === 'PDF' && pdfFile)) {
                setIsUploading(true);
                const fileToUpload = contentType === 'IMAGE' ? imageFile : pdfFile;

                const formData = new FormData();
                formData.append('file', fileToUpload!);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadRes.ok) {
                    const error = await uploadRes.json();
                    alert(error.error || 'Failed to upload file');
                    setIsUploading(false);
                    setIsSubmitting(false);
                    return;
                }

                const uploadData = await uploadRes.json();
                fileUrl = uploadData.fileUrl;

                // For images, also set imageUrl for thumbnail
                if (contentType === 'IMAGE') {
                    imageUrl = uploadData.fileUrl;
                }

                setIsUploading(false);
            }

            const res = await fetch('/api/resources', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    contentType,
                    url: contentType === 'LINK' ? url : null,
                    textContent: contentType === 'TEXT' ? textContent : null,
                    fileUrl: fileUrl,
                    imageUrl: imageUrl,
                    topicId,
                    userId,
                    username
                }),
            });

            if (res.ok) {
                setName("");
                setUrl("");
                setTextContent("");
                setImageFile(null);
                setPdfFile(null);
                router.refresh();
                onSuccess?.();
            } else {
                alert("Failed to add resource");
            }
        } catch (e) {
            alert("Error adding resource");
        } finally {
            setIsSubmitting(false);
            setIsUploading(false);
        }
    };

    const handleUsernameSaved = (newUsername: string) => {
        setUsername(newUsername);
        setShowUsernameModal(false);
        // After username is set, resubmit the form
        if (name && url) {
            const form = document.querySelector('form');
            form?.requestSubmit();
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200">
                    <button
                        type="button"
                        onClick={() => handleContentTypeChange('LINK')}
                        className={`px-4 py-2 font-medium text-sm transition-colors relative
                            ${contentType === 'LINK'
                                ? 'text-purple-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-purple-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Link
                    </button>
                    <button
                        type="button"
                        onClick={() => handleContentTypeChange('IMAGE')}
                        className={`px-4 py-2 font-medium text-sm transition-colors relative
                            ${contentType === 'IMAGE'
                                ? 'text-purple-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-purple-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Image
                    </button>
                    <button
                        type="button"
                        onClick={() => handleContentTypeChange('PDF')}
                        className={`px-4 py-2 font-medium text-sm transition-colors relative
                            ${contentType === 'PDF'
                                ? 'text-purple-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-purple-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        PDF
                    </button>
                    <button
                        type="button"
                        onClick={() => handleContentTypeChange('TEXT')}
                        className={`px-4 py-2 font-medium text-sm transition-colors relative
                            ${contentType === 'TEXT'
                                ? 'text-purple-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-purple-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Text
                    </button>
                </div>

                {/* Link Tab Content */}
                {contentType === 'LINK' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Resource URL
                            </label>
                            <div className="relative">
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onPaste={handlePaste}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="input-modern"
                                    style={{
                                        paddingLeft: '2.5rem',
                                        paddingRight: isLoading ? '9rem' : '1rem'
                                    }}
                                    required
                                />
                                {!isLoading && (
                                    <svg
                                        className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                )}
                                {isLoading && (
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="animate-spin h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    </div>
                                )}
                                {isLoading && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <span className="text-xs text-purple-500 whitespace-nowrap">Fetching title...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Resource Name
                                <span className="text-gray-400 font-normal ml-1">(auto-filled from URL)</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Operating Systems Tutorial - Part 1"
                                className="input-modern"
                                required
                            />
                        </div>
                    </>
                )}

                {/* Image Tab Content */}
                {contentType === 'IMAGE' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Image
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label htmlFor="image-upload" className="cursor-pointer">
                                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-gray-600 font-medium mb-1">Click to upload image</p>
                                    <p className="text-xs text-gray-400">JPEG, PNG, GIF, WebP (max 10MB)</p>
                                    {imageFile && (
                                        <p className="text-sm text-purple-600 mt-2">Selected: {imageFile.name}</p>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Image Title
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Process State Diagram"
                                className="input-modern"
                                required
                            />
                        </div>
                    </>
                )}

                {/* PDF Tab Content */}
                {contentType === 'PDF' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload PDF
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="pdf-upload"
                                />
                                <label htmlFor="pdf-upload" className="cursor-pointer">
                                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-gray-600 font-medium mb-1">Click to upload PDF</p>
                                    <p className="text-xs text-gray-400">PDF files only (max 10MB)</p>
                                    {pdfFile && (
                                        <p className="text-sm text-purple-600 mt-2">Selected: {pdfFile.name}</p>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                PDF Title
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Operating Systems Notes"
                                className="input-modern"
                                required
                            />
                        </div>
                    </>
                )}

                {/* Text Tab Content */}
                {contentType === 'TEXT' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Quick Notes on Process Scheduling"
                                className="input-modern"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Content
                            </label>
                            <RichTextEditor
                                value={textContent}
                                onChange={setTextContent}
                                placeholder="Enter your text content here..."
                                disabled={isSubmitting || isUploading}
                            />
                        </div>
                    </>
                )}

                {/* Submit Button */}
                <button
                    disabled={isSubmitting || isUploading || !name ||
                        (contentType === 'LINK' && !url) ||
                        (contentType === 'TEXT' && !textContent) ||
                        (contentType === 'IMAGE' && !imageFile) ||
                        (contentType === 'PDF' && !pdfFile)}
                    type="submit"
                    className="btn-primary w-full flex items-center justify-center gap-2
                              disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                    {isUploading ? (
                        <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Uploading...
                        </>
                    ) : isSubmitting ? (
                        <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Adding Resource...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Resource
                        </>
                    )}
                </button>
            </form>

            {/* Username Modal - Outside the form to avoid nesting */}
            <UsernameModal
                isOpen={showUsernameModal}
                onClose={() => setShowUsernameModal(false)}
                onSave={handleUsernameSaved}
                currentUsername={username}
            />
        </>
    );
}
