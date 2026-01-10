import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim() === '') {
    return NextResponse.json({ topics: [] });
  }

  try {
    const topics = await prisma.topic.findMany({
      where: {
        title: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        unit: {
          include: {
            paper: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        _count: {
          select: {
            resources: true,
          },
        },
      },
      take: 10,
      orderBy: {
        title: 'asc',
      },
    });

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search topics' },
      { status: 500 }
    );
  }
}
