import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  async (request: NextRequest, { session, requestId }: ApiContext) => {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/callback/tiktok`;
    const scope = "user.info.basic,video.publish";

    const authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}&state=${session.user.id}`;

    return NextResponse.redirect(authUrl);
  },
  { route: "GET /api/social/connect/tiktok", requireOrg: false },
);
