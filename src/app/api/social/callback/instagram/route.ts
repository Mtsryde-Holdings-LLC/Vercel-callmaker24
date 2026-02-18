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

    const tokenRes = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id:
            process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_CLIENT_ID!,
          client_secret:
            process.env.INSTAGRAM_CLIENT_SECRET ||
            process.env.FACEBOOK_CLIENT_SECRET!,
          grant_type: "authorization_code",
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/social/callback/instagram`,
          code,
        }),
      },
    );
    const { access_token, user_id } = await tokenRes.json();

    const userRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${access_token}`,
    );
    const userData = await userRes.json();

    const user = await prisma.user.findUnique({ where: { id: state } });

    await prisma.socialAccount.create({
      data: {
        platform: "INSTAGRAM",
        platformUserId: user_id,
        username: userData.username,
        displayName: userData.username,
        accessToken: access_token,
        userId: state,
        organizationId: user?.organizationId,
        isActive: true,
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/social?connected=Instagram&username=${userData.username}`,
    );
  },
  { route: "GET /api/social/callback/instagram" },
);
