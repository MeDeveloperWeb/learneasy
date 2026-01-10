import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminAccess } from '@/lib/utils';
import { deleteFromSupabaseStorage } from '@/lib/supabaseStorage';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!checkAdminAccess(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { id } = await params;

        // Get resource to check if it has a file to delete
        const resource = await prisma.resource.findUnique({
            where: { id },
        });

        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
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
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
    }
}
