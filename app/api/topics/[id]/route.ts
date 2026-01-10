import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminAccess } from '@/lib/utils';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!checkAdminAccess(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { title } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const topic = await prisma.topic.update({
            where: { id },
            data: { title },
        });

        return NextResponse.json(topic);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!checkAdminAccess(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { id } = await params;
        await prisma.topic.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 });
    }
}
