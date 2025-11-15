import { NextRequest, NextResponse } from 'next/server';

// OAuth configuration for each platform
const oauthConfig = {
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scopes: ['pages_manage_posts', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish'],
    clientId: process.env.FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/oauth/callback/facebook`,
  },
  instagram: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list'],
    clientId: process.env.FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/oauth/callback/instagram`,
  },
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    clientId: process.env.TWITTER_CLIENT_ID || 'YOUR_TWITTER_CLIENT_ID',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/oauth/callback/twitter`,
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    scopes: ['w_member_social', 'r_liteprofile', 'r_emailaddress'],
    clientId: process.env.LINKEDIN_CLIENT_ID || 'YOUR_LINKEDIN_CLIENT_ID',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/oauth/callback/linkedin`,
  },
  tiktok: {
    authUrl: 'https://www.tiktok.com/auth/authorize/',
    scopes: ['user.info.basic', 'video.publish', 'video.upload'],
    clientId: process.env.TIKTOK_CLIENT_KEY || 'YOUR_TIKTOK_CLIENT_KEY',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/oauth/callback/tiktok`,
  },
  youtube: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
    clientId: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/oauth/callback/youtube`,
  },
};

export async function POST(request: NextRequest) {
  try {
    const { platform } = await request.json();

    if (!platform || !oauthConfig[platform as keyof typeof oauthConfig]) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    const config = oauthConfig[platform as keyof typeof oauthConfig];
    const state = generateState(); // Random string for CSRF protection

    // Store state in session/database for verification on callback
    // For now, we'll include it in the URL

    let authUrl = '';

    switch (platform) {
      case 'facebook':
      case 'instagram':
        authUrl = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${config.scopes.join(',')}&state=${state}`;
        break;

      case 'twitter':
        authUrl = `${config.authUrl}?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${encodeURIComponent(config.scopes.join(' '))}&state=${state}&code_challenge=challenge&code_challenge_method=plain`;
        break;

      case 'linkedin':
        authUrl = `${config.authUrl}?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${encodeURIComponent(config.scopes.join(' '))}&state=${state}`;
        break;

      case 'tiktok':
        authUrl = `${config.authUrl}?client_key=${config.clientId}&scope=${config.scopes.join(',')}&response_type=code&redirect_uri=${encodeURIComponent(config.redirectUri)}&state=${state}`;
        break;

      case 'youtube':
        authUrl = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=${encodeURIComponent(config.scopes.join(' '))}&access_type=offline&state=${state}`;
        break;

      default:
        return NextResponse.json(
          { error: 'Platform not supported yet' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      authUrl,
      state,
      platform,
    });
  } catch (error) {
    console.error('OAuth authorization error:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}

function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
