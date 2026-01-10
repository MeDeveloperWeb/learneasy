import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminAccess } from '@/lib/utils';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get('paperId');

    if (!paperId) {
        return NextResponse.json({ error: 'paperId is required' }, { status: 400 });
    }

    try {
        // If fetching by paperId, we now need to go via Units?
        // Or we keep it simple return all topics?
        // Let's return all topics for the paper via units
        const units = await prisma.unit.findMany({
            where: { paperId },
            include: { topics: true }
        });

        // Flatten
        const topics = units.flatMap(u => u.topics);

        return NextResponse.json(topics);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, unitId } = body;

        if (!title || !unitId) {
            return NextResponse.json({ error: 'Title and unitId are required' }, { status: 400 });
        }

        // Check if unit is custom
        const unit = await prisma.unit.findUnique({
            where: { id: unitId },
            select: { isCustom: true }
        });

        if (!unit) {
            return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
        }

        // Check Admin Access ONLY if not custom
        if (!unit.isCustom) {
            if (!checkAdminAccess(request)) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
        }

        const topic = await prisma.topic.create({
            data: {
                title,
                unitId
            },
        });

        return NextResponse.json(topic, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
    }
}
