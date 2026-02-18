import { NextRequest, NextResponse } from "next/server";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";

export const GET = withPublicApiHandler(
  async (request: NextRequest, { requestId, params }: ApiContext) => {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const platform = params.platform;

    // Handle OAuth error
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/social?error=${encodeURIComponent(error)}`,
          request.url,
        ),
      );
    }

    // Validate code and state
    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/social?error=invalid_callback", request.url),
      );
    }

    // Exchange authorization code for access token
    const tokenData = await exchangeCodeForToken(platform, code);

    if (!tokenData) {
      return NextResponse.redirect(
        new URL("/dashboard/social?error=token_exchange_failed", request.url),
      );
    }

    // Get user profile information
    const profile = await getUserProfile(platform, tokenData.access_token);

    // Save account to database
    // In production, save to your database
    const accountData = {
      id: `${platform}_${profile.id || Date.now()}`,
      platform: platform.toUpperCase(),
      username: profile.username || profile.name || "Unknown",
      profileImage: profile.profile_image || profile.picture || "",
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in
        ? Date.now() + tokenData.expires_in * 1000
        : null,
      connectedAt: new Date().toISOString(),
    };

    // In production: await prisma.socialAccount.create({ data: accountData });

    // Redirect back to social media page with success
    return NextResponse.redirect(
      new URL(
        `/dashboard/social?connected=${platform}&username=${encodeURIComponent(accountData.username)}`,
        request.url,
      ),
    );
  },
  { route: "GET /api/social/oauth/callback/[platform]" },
);

async function exchangeCodeForToken(
  platform: string,
  code: string,
): Promise<any> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    switch (platform) {
      case "facebook":
      case "instagram": {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(`${appUrl}/api/social/oauth/callback/${platform}`)}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}`,
        );
        return await response.json();
      }

      case "twitter": {
        const response = await fetch("https://api.twitter.com/2/oauth2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString("base64")}`,
          },
          body: new URLSearchParams({
            code,
            grant_type: "authorization_code",
            client_id: process.env.TWITTER_CLIENT_ID || "",
            redirect_uri: `${appUrl}/api/social/oauth/callback/twitter`,
            code_verifier: "challenge",
          }),
        });
        return await response.json();
      }

      case "linkedin": {
        const response = await fetch(
          "https://www.linkedin.com/oauth/v2/accessToken",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code,
              client_id: process.env.LINKEDIN_CLIENT_ID || "",
              client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
              redirect_uri: `${appUrl}/api/social/oauth/callback/linkedin`,
            }),
          },
        );
        return await response.json();
      }

      case "youtube": {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID || "",
            client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
            redirect_uri: `${appUrl}/api/social/oauth/callback/youtube`,
            grant_type: "authorization_code",
          }),
        });
        return await response.json();
      }

      default:
        // Mock response for development
        return {
          access_token: `mock_token_${platform}_${Date.now()}`,
          refresh_token: `mock_refresh_${platform}`,
          expires_in: 3600,
        };
    }
  } catch {
    return null;
  }
}

async function getUserProfile(
  platform: string,
  accessToken: string,
): Promise<any> {
  try {
    switch (platform) {
      case "facebook": {
        const response = await fetch(
          `https://graph.facebook.com/me?fields=id,name,picture&access_token=${accessToken}`,
        );
        return await response.json();
      }

      case "instagram": {
        const response = await fetch(
          `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${accessToken}`,
        );
        return await response.json();
      }

      case "twitter": {
        const response = await fetch(
          "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        const data = await response.json();
        return data.data;
      }

      case "linkedin": {
        const response = await fetch("https://api.linkedin.com/v2/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return await response.json();
      }

      case "youtube": {
        const response = await fetch(
          "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        const data = await response.json();
        return data.items?.[0]?.snippet || {};
      }

      default:
        return {
          id: Date.now(),
          username: `${platform}_user`,
          name: `${platform} User`,
        };
    }
  } catch {
    return { id: Date.now(), username: "Unknown" };
  }
}
