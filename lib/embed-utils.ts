// Convert various YouTube URL formats to embed URL
export function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    let videoId: string | null = null;

    // Handle youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch') {
      videoId = urlObj.searchParams.get('v');
    }

    // Handle youtu.be/VIDEO_ID
    else if (urlObj.hostname === 'youtu.be' || urlObj.hostname === 'www.youtu.be') {
      videoId = urlObj.pathname.slice(1); // Remove leading /
    }

    // Handle youtube.com/embed/VIDEO_ID (already embed format)
    else if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/embed/')) {
      return url; // Already in embed format
    }

    // Handle m.youtube.com/watch?v=VIDEO_ID
    else if (urlObj.hostname === 'm.youtube.com' && urlObj.pathname === '/watch') {
      videoId = urlObj.searchParams.get('v');
    }

    if (videoId) {
      // Add any timestamp if present
      const timestamp = urlObj.searchParams.get('t');
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      return timestamp ? `${embedUrl}?start=${timestamp}` : embedUrl;
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Check if URL is embeddable content
export function isEmbeddableContent(url: string): boolean {
  try {
    const urlLower = url.toLowerCase();

    return (
      urlLower.endsWith('.pdf') ||
      urlLower.includes('youtube.com') ||
      urlLower.includes('youtu.be') ||
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
