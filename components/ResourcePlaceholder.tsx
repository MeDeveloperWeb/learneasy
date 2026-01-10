interface ResourcePlaceholderProps {
    contentType: 'LINK' | 'IMAGE' | 'TEXT' | 'PDF';
    name: string;
}

export function ResourcePlaceholder({ contentType, name }: ResourcePlaceholderProps) {
    // Generate a consistent color based on the resource name
    const getColorFromName = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }

        // Array of gradient color combinations
        const gradients = [
            'from-purple-400 to-pink-500',
            'from-blue-400 to-indigo-500',
            'from-green-400 to-teal-500',
            'from-yellow-400 to-orange-500',
            'from-red-400 to-pink-500',
            'from-indigo-400 to-purple-500',
            'from-teal-400 to-cyan-500',
            'from-orange-400 to-red-500',
        ];

        const index = Math.abs(hash) % gradients.length;
        return gradients[index];
    };

    const gradientColor = getColorFromName(name);

    // Get icon based on content type
    const getIcon = () => {
        switch (contentType) {
            case 'LINK':
                return (
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                );
            case 'PDF':
                return (
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 12h6m-6 4h4" />
                    </svg>
                );
            case 'TEXT':
                return (
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            case 'IMAGE':
                return (
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                );
        }
    };

    return (
        <div className={`relative h-40 bg-gradient-to-br ${gradientColor} overflow-hidden flex items-center justify-center`}>
            {getIcon()}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
    );
}
