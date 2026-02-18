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
    const tokenRes = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/social/callback/linkedin`,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
      },
    );

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error("No access token received");
    }

    // Get user info
    const userRes = await fetch("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    const userData = await userRes.json();

    const displayName = `${userData.localizedFirstName || ""} ${
      userData.localizedLastName || ""
    }`.trim();

    const user = await prisma.user.findUnique({ where: { id: state } });

    // Save to database
    await prisma.socialAccount.create({
      data: {
        platform: "LINKEDIN",
        platformUserId: userData.id,
        username: displayName,
        displayName: displayName,
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
      `${process.env.NEXTAUTH_URL}/dashboard/social?connected=LinkedIn&username=${displayName}`,
    );
  },
  { route: "GET /api/social/callback/linkedin" },
);
