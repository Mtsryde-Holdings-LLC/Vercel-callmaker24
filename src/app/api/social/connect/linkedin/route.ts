import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  async (request: NextRequest, { session, requestId }: ApiContext) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/callback/linkedin`;
    const scope = "w_member_social r_liteprofile";

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scope)}&state=${session.user.id}`;

    return NextResponse.redirect(authUrl);
  },
  { route: "GET /api/social/connect/linkedin", requireOrg: false },
);
