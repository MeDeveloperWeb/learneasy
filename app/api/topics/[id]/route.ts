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
        const { title, order } = body;

        // Build update data object
        const updateData: { title?: string; order?: number } = {};
        if (title !== undefined) updateData.title = title;
        if (order !== undefined) updateData.order = order;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const topic = await prisma.topic.update({
            where: { id },
            data: updateData,
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
