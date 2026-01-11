// Extract actual URL from Google redirect URLs
export function extractActualUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Check if it's a Google redirect URL
    if (urlObj.hostname.includes('google.com') && urlObj.pathname.includes('/url')) {
      const actualUrl = urlObj.searchParams.get('q');
      if (actualUrl) {
        console.log('[extractActualUrl] Extracted from Google redirect:', actualUrl);
        return actualUrl;
      }
    }

    return url;
  } catch (error) {
    return url;
  }
}

// Convert various YouTube URL formats to embed URL
export function getYouTubeEmbedUrl(url: string): string | null {
  console.log('[getYouTubeEmbedUrl] Processing URL:', url);

  // First, extract actual URL if it's a Google redirect
  const actualUrl = extractActualUrl(url);
  console.log('[getYouTubeEmbedUrl] Actual URL:', actualUrl);

  try {
    const urlObj = new URL(actualUrl);
    let videoId: string | null = null;

    // Check if it's a YouTube domain
    const isYouTube = urlObj.hostname.includes('youtube.com') ||
                      urlObj.hostname.includes('youtu.be');

    console.log('[getYouTubeEmbedUrl] Is YouTube?', isYouTube, 'Hostname:', urlObj.hostname);

    if (!isYouTube) {
      return null;
    }

    // Handle youtube.com/embed/VIDEO_ID (already embed format)
    if (urlObj.pathname.startsWith('/embed/')) {
      console.log('[getYouTubeEmbedUrl] Already in embed format');
      return actualUrl; // Already in embed format
    }

    // Handle youtube.com/watch?v=VIDEO_ID (most common format)
    if (urlObj.pathname === '/watch' || urlObj.pathname.startsWith('/watch')) {
      videoId = urlObj.searchParams.get('v');
    }

    // Handle youtu.be/VIDEO_ID
    else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1).split('/')[0].split('?')[0]; // Remove leading / and get first part
    }

    // Handle youtube.com/v/VIDEO_ID (old format)
    else if (urlObj.pathname.startsWith('/v/')) {
      videoId = urlObj.pathname.split('/')[2]?.split('?')[0]; // Get VIDEO_ID from /v/VIDEO_ID
    }

    // Handle youtube.com/shorts/VIDEO_ID
    else if (urlObj.pathname.startsWith('/shorts/')) {
      videoId = urlObj.pathname.split('/')[2]?.split('?')[0]; // Get VIDEO_ID from /shorts/VIDEO_ID
    }

    if (videoId) {
      // Clean video ID - remove any trailing query params or fragments
      videoId = videoId.split('&')[0];
      console.log('[getYouTubeEmbedUrl] Extracted video ID:', videoId);

      // Add any timestamp if present
      const timestamp = urlObj.searchParams.get('t') || urlObj.searchParams.get('start');
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      const finalUrl = timestamp ? `${embedUrl}?start=${timestamp}` : embedUrl;
      console.log('[getYouTubeEmbedUrl] Returning embed URL:', finalUrl);
      return finalUrl;
    }

    console.log('[getYouTubeEmbedUrl] No video ID found, returning null');
    return null;
  } catch (error) {
    console.error('[getYouTubeEmbedUrl] Error:', error);
    return null;
  }
}

// Check if URL is embeddable content
// Note: YouTube URLs are NOT included here - they're handled separately by getYouTubeEmbedUrl
export function isEmbeddableContent(url: string): boolean {
  try {
    const urlLower = url.toLowerCase();

    return (
      urlLower.endsWith('.pdf') ||
      urlLower.includes('vimeo.com') ||
      urlLower.includes('drive.google.com') ||
      urlLower.includes('docs.google.com') ||
      urlLower.includes('codesandbox.io') ||
      urlLower.includes('codepen.io') ||
      urlLower.includes('jsfiddle.net') ||
      urlLower.includes('replit.com')
    );
  } catch (error) {
    return false;
  }
}
