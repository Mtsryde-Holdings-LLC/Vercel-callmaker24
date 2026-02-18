import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  async (request: NextRequest, { session, requestId }: ApiContext) => {
    const clientId =
      process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/callback/instagram`;
    const scope = "instagram_basic,instagram_content_publish";

    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${session.user.id}`;

    return NextResponse.redirect(authUrl);
  },
  { route: "GET /api/social/connect/instagram", requireOrg: false },
);
