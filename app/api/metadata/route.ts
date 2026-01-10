import { NextResponse } from 'next/server';
import { fetchUrlMetadata } from '@/lib/metadata';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
        const metadata = await fetchUrlMetadata(url);
        return NextResponse.json(metadata);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
    }
}
