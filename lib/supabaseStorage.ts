import { createClient } from '@supabase/supabase-js';

/**
 * Initialize Supabase client for storage operations
 */
function getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not configured. Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    }

    return createClient(supabaseUrl, supabaseKey);
}

/**
 * Upload a file to Supabase Storage
 * @param fileBuffer - File buffer to upload
 * @param fileName - Name of the file
 * @param mimeType - MIME type of the file
 * @param bucketName - Storage bucket name (default: 'uploads')
 * @returns Object with publicUrl
 */
export async function uploadToSupabaseStorage(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    bucketName: string = 'mission-cs'
): Promise<{ publicUrl: string; path: string }> {
    const supabase = getSupabaseClient();

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileBuffer, {
            contentType: mimeType,
            upsert: false,
        });

    if (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

    return {
        publicUrl,
        path: data.path,
    };
}

/**
 * Delete a file from Supabase Storage
 * @param filePath - Path of the file to delete
 * @param bucketName - Storage bucket name (default: 'mission-cs')
 */
export async function deleteFromSupabaseStorage(
    filePath: string,
    bucketName: string = 'mission-cs'
): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

    if (error) {
        throw new Error(`Failed to delete file: ${error.message}`);
    }
}

/**
 * Get public URL for a file in Supabase Storage
 * @param filePath - Path of the file
 * @param bucketName - Storage bucket name (default: 'mission-cs')
 */
export function getPublicUrl(filePath: string, bucketName: string = 'mission-cs'): string {
    const supabase = getSupabaseClient();

    const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

    return publicUrl;
}
