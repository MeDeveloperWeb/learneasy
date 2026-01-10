import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminAccess } from '@/lib/utils';

export async function GET() {
    try {
        const papers = await prisma.paper.findMany({
            orderBy: { createdAt: 'asc' },
        });
        return NextResponse.json(papers);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch papers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!checkAdminAccess(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { title } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const paper = await prisma.paper.create({
            data: { title },
        });

        return NextResponse.json(paper, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create paper' }, { status: 500 });
    }
}
