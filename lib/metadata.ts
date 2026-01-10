import * as cheerio from 'cheerio';

// Extract YouTube video ID from URL
function getYouTubeVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

// Get YouTube thumbnail URL from video ID
function getYouTubeThumbnail(videoId: string): string {
    // Try maxresdefault first (highest quality), will fallback in the UI if not available
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export async function fetchUrlMetadata(url: string) {
    try {
        // Special handling for YouTube URLs
        const youtubeVideoId = getYouTubeVideoId(url);
        if (youtubeVideoId) {
            try {
                // Use YouTube's oEmbed API to get metadata
                const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
                const oembedResponse = await fetch(oembedUrl);

                if (oembedResponse.ok) {
                    const data = await oembedResponse.json();
                    return {
                        title: data.title || null,
                        description: data.author_name ? `By ${data.author_name}` : null,
                        imageUrl: getYouTubeThumbnail(youtubeVideoId),
                    };
                }
            } catch (oembedError) {
                console.error('YouTube oEmbed fetch failed:', oembedError);
            }

            // Fallback to just thumbnail if oEmbed fails
            return {
                title: null,
                description: null,
                imageUrl: getYouTubeThumbnail(youtubeVideoId),
            };
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; MissionCSBot/1.0)',
            },
        });

        if (!response.ok) {
            return { title: null, description: null, imageUrl: null };
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const title = $('title').text() || $('meta[property="og:title"]').attr('content') || null;
        const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || null;
        const imageUrl = $('meta[property="og:image"]').attr('content') || null;

        return { title, description, imageUrl };
    } catch (error) {
        console.error(`Failed to fetch metadata for ${url}`, error);
        return { title: null, description: null, imageUrl: null };
    }
}
