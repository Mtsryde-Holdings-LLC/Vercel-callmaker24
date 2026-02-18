import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  async (request: NextRequest, { session, requestId }: ApiContext) => {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/callback/twitter`;
    const scope = "tweet.read tweet.write users.read offline.access";

    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scope)}&state=${session.user.id}&code_challenge=challenge&code_challenge_method=plain`;

    return NextResponse.redirect(authUrl);
  },
  { route: "GET /api/social/connect/twitter", requireOrg: false },
);
