import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminAccess } from '@/lib/utils';
import { fetchUrlMetadata } from '@/lib/metadata';
import { deleteFromSupabaseStorage } from '@/lib/supabaseStorage';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
        return NextResponse.json({ error: 'topicId is required' }, { status: 400 });
    }

    try {
        const resources = await prisma.resource.findMany({
            where: { topicId },
            orderBy: [
                { likesCount: 'desc' },
                { createdAt: 'desc' },
            ],
            include: {
                likes: {
                    select: { userId: true },
                },
            },
        });
        return NextResponse.json(resources);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    // Public access logic
    try {
        const body = await request.json();
        const { name, contentType, url, textContent, imageUrl, fileUrl, topicId, userId, username } = body;

        if (!name || !topicId) {
            return NextResponse.json({ error: 'Name and topicId are required' }, { status: 400 });
        }

        // Validate based on content type
        if (contentType === 'LINK' && !url) {
            return NextResponse.json({ error: 'URL is required for LINK type' }, { status: 400 });
        }
        if (contentType === 'TEXT' && !textContent) {
            return NextResponse.json({ error: 'Text content is required for TEXT type' }, { status: 400 });
        }
        if (contentType === 'IMAGE' && !fileUrl) {
            return NextResponse.json({ error: 'File URL is required for IMAGE type' }, { status: 400 });
        }
        if (contentType === 'PDF' && !fileUrl) {
            return NextResponse.json({ error: 'File URL is required for PDF type' }, { status: 400 });
        }

        const resourceData: {
            name: string;
            contentType: 'LINK' | 'IMAGE' | 'PDF' | 'TEXT';
            topicId: string;
            userId?: string;
            username?: string;
            url?: string;
            description?: string;
            textContent?: string;
            fileUrl?: string;
            imageUrl?: string;
        } = {
            name,
            contentType: (contentType || 'LINK') as 'LINK' | 'IMAGE' | 'PDF' | 'TEXT',
            topicId,
            userId: userId || undefined,
            username: username || undefined,
        };

        // Fetch metadata only for LINK type
        if (contentType === 'LINK' && url) {
            const { description: fetchedDescription, imageUrl: fetchedImageUrl } = await fetchUrlMetadata(url);
            resourceData.url = url;
            resourceData.description = fetchedDescription || undefined;
            resourceData.imageUrl = fetchedImageUrl || undefined;
        } else if (contentType === 'TEXT') {
            resourceData.textContent = textContent;
        } else if (contentType === 'IMAGE') {
            resourceData.fileUrl = fileUrl;
            resourceData.imageUrl = imageUrl || fileUrl; // Use fileUrl as fallback
        } else if (contentType === 'PDF') {
            resourceData.fileUrl = fileUrl;
        }

        const resource = await prisma.resource.create({
            data: resourceData,
        });

        return NextResponse.json(resource, { status: 201 });
    } catch (error) {
        console.error('Error creating resource:', error);
        return NextResponse.json({
            error: 'Failed to create resource',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const resourceId = searchParams.get('id');
        const userId = searchParams.get('userId');

        if (!resourceId || !userId) {
            return NextResponse.json({ error: 'Resource ID and User ID are required' }, { status: 400 });
        }

        // Check if resource exists and belongs to user
        const resource = await prisma.resource.findUnique({
            where: { id: resourceId },
        });

        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }

        if (resource.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Delete file from Supabase Storage if it exists
        if (resource.fileUrl) {
            try {
                // Extract file path from URL
                // URL format: https://xxx.supabase.co/storage/v1/object/public/mission-cs/filename
                const urlParts = resource.fileUrl.split('/mission-cs/');
                if (urlParts.length > 1) {
                    const filePath = urlParts[1];
                    await deleteFromSupabaseStorage(filePath);
                }
            } catch (storageError) {
                console.error('Error deleting file from storage:', storageError);
                // Continue with resource deletion even if storage deletion fails
            }
        }

        await prisma.resource.delete({
            where: { id: resourceId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, userId, name, url, description, textContent } = body;

        if (!id || !userId) {
            return NextResponse.json({ error: 'Resource ID and User ID are required' }, { status: 400 });
        }

        // Check if resource exists and belongs to user
        const resource = await prisma.resource.findUnique({
            where: { id },
        });

        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }

        if (resource.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Build update data
        const updateData: {
            name?: string;
            url?: string;
            description?: string;
            imageUrl?: string;
            textContent?: string;
        } = {};

        if (name) updateData.name = name;
        if (textContent !== undefined) updateData.textContent = textContent;
        if (description !== undefined) updateData.description = description;

        // Fetch new metadata if URL changed
        if (url && url !== resource.url) {
            const { description: fetchedDescription, imageUrl } = await fetchUrlMetadata(url);
            updateData.url = url;
            updateData.description = fetchedDescription || undefined;
            updateData.imageUrl = imageUrl || undefined;
        }

        const updatedResource = await prisma.resource.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updatedResource);
    } catch (_error) {
        return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
    }
}
