import { google } from 'googleapis';
import { Readable } from 'stream';

/**
 * Initialize Google Drive API client using OAuth 2.0 with refresh token
 */
function getDriveClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Google OAuth credentials not configured. Need GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN');
    }

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'http://localhost:3000/api/auth/google/callback' // Redirect URI (not used for refresh tokens)
    );

    // Set the refresh token
    oauth2Client.setCredentials({
        refresh_token: refreshToken,
    });

    return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * Upload a file to Google Drive
 * @param fileBuffer - File buffer to upload
 * @param fileName - Name of the file
 * @param mimeType - MIME type of the file
 * @returns Object with fileId and webViewLink
 */
export async function uploadToGoogleDrive(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
): Promise<{ fileId: string; webViewLink: string; webContentLink: string }> {
    const drive = getDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
        throw new Error('GOOGLE_DRIVE_FOLDER_ID environment variable is not set');
    }

    // Convert buffer to readable stream
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);

    // Upload file to Drive
    const response = await drive.files.create({
        requestBody: {
            name: fileName,
            parents: [folderId],
        },
        media: {
            mimeType,
            body: bufferStream,
        },
        fields: 'id, webViewLink, webContentLink',
    });

    // Make the file publicly accessible
    await drive.permissions.create({
        fileId: response.data.id!,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
    });

    return {
        fileId: response.data.id!,
        webViewLink: response.data.webViewLink!,
        webContentLink: response.data.webContentLink!,
    };
}

/**
 * Delete a file from Google Drive
 * @param fileId - ID of the file to delete
 */
export async function deleteFromGoogleDrive(fileId: string): Promise<void> {
    const drive = getDriveClient();
    await drive.files.delete({ fileId });
}

/**
 * Get file metadata from Google Drive
 * @param fileId - ID of the file
 */
export async function getFileMetadata(fileId: string) {
    const drive = getDriveClient();
    const response = await drive.files.get({
        fileId,
        fields: 'id, name, mimeType, webViewLink, webContentLink, size',
    });
    return response.data;
}
