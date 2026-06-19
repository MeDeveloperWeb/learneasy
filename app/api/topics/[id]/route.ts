import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminAccess } from '@/lib/utils';
import { bustTopic, bustUnit, bustPaper, bustTopicTree } from '@/lib/revalidation';

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

        // Title/order change ripples to this page, sibling nav, and paper list.
        await bustTopicTree(id);

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

        // Capture the tree before the row is gone, so we know which caches to bust.
        const existing = await prisma.topic.findUnique({
            where: { id },
            select: { unitId: true, unit: { select: { paperId: true } } },
        });

        await prisma.topic.delete({
            where: { id },
        });

        bustTopic(id);
        if (existing?.unitId) bustUnit(existing.unitId);
        if (existing?.unit?.paperId) bustPaper(existing.unit.paperId);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 });
    }
}
