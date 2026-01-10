import * as cheerio from 'cheerio';

export async function fetchUrlMetadata(url: string) {
    try {
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
