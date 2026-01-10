import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check if resource exists
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Check if like already exists
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_resourceId: {
          userId,
          resourceId,
        },
      },
    });

    if (existingLike) {
      // Unlike: Delete like and decrement count
      await prisma.$transaction([
        prisma.like.delete({
          where: { id: existingLike.id },
        }),
        prisma.resource.update({
          where: { id: resourceId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);

      return NextResponse.json({
        liked: false,
        likesCount: Math.max(0, resource.likesCount - 1),
      });
    } else {
      // Like: Create like and increment count
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId,
            resourceId,
          },
        }),
        prisma.resource.update({
          where: { id: resourceId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);

      return NextResponse.json({
        liked: true,
        likesCount: resource.likesCount + 1,
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like', details: (error as Error)?.message },
      { status: 500 }
    );
  }
}
