import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const GET = withPublicApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/social?error=missing_params`,
      );
    }

    // Exchange code for access token
    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`,
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/social/callback/twitter`,
        code_verifier: "challenge",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error("No access token received");
    }

    // Get user info
    const userRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    const { data: userData } = await userRes.json();

    const user = await prisma.user.findUnique({ where: { id: state } });

    // Save to database
    await prisma.socialAccount.create({
      data: {
        platform: "TWITTER",
        platformUserId: userData.id,
        username: userData.username,
        displayName: userData.name || userData.username,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        userId: state,
        organizationId: user?.organizationId,
        isActive: true,
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/social?connected=Twitter&username=${userData.username}`,
    );
  },
  { route: "GET /api/social/callback/twitter" },
);
