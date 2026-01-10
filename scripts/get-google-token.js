/**
 * Script to get Google OAuth refresh token
 * Run: node scripts/get-google-token.js
 */

const { google } = require('googleapis');
const http = require('http');
const url = require('url');

// You'll need to fill these in from Google Cloud Console
const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000';

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

async function getToken() {
    if (CLIENT_ID === 'YOUR_CLIENT_ID' || CLIENT_SECRET === 'YOUR_CLIENT_SECRET') {
        console.error('❌ Please update CLIENT_ID and CLIENT_SECRET in this script first!');
        console.log('\nFollow these steps:');
        console.log('1. Go to https://console.cloud.google.com/');
        console.log('2. Select your project');
        console.log('3. Go to "APIs & Services" > "Credentials"');
        console.log('4. Click "Create Credentials" > "OAuth 2.0 Client ID"');
        console.log('5. Application type: "Web application"');
        console.log('6. Add authorized redirect URI: http://localhost:3000');
        console.log('7. Copy the Client ID and Client Secret into this script');
        console.log('8. Run this script again: node scripts/get-google-token.js\n');
        process.exit(1);
    }

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent', // Force to get refresh token
    });

    console.log('🔐 Authorize this app by visiting this URL:\n');
    console.log(authUrl);
    console.log('\n');

    // Try to open browser automatically
    try {
        await open(authUrl);
        console.log('✅ Browser opened automatically');
    } catch (e) {
        console.log('⚠️  Please open the URL manually');
    }

    // Start local server to receive callback
    const server = http.createServer(async (req, res) => {
        try {
            const queryObject = url.parse(req.url, true).query;

            if (queryObject.code) {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end('✅ Authorization successful! You can close this window and go back to terminal.');

                const { tokens } = await oauth2Client.getToken(queryObject.code);

                console.log('\n✅ Success! Add these to your .env file:\n');
                console.log('GOOGLE_CLIENT_ID=' + CLIENT_ID);
                console.log('GOOGLE_CLIENT_SECRET=' + CLIENT_SECRET);
                console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
                console.log('\n');

                server.close();
                process.exit(0);
            }
        } catch (e) {
            console.error('❌ Error:', e.message);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('❌ Error during authentication');
            process.exit(1);
        }
    });

    server.listen(3000, () => {
        console.log('🌐 Waiting for authorization... (listening on http://localhost:3000)');
    });
}

getToken().catch(console.error);
