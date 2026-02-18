import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  async (request: NextRequest, { session, requestId }: ApiContext) => {
    const clientId =
      process.env.FACEBOOK_CLIENT_ID || process.env.FACEBOOK_APP_ID;

    if (!clientId) {
      return apiError("Facebook Client ID not configured", {
        status: 500,
        requestId,
      });
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/callback/facebook`;
    const scope = "pages_manage_posts,pages_read_engagement,pages_show_list";

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&scope=${scope}&state=${session.user.id}`;

    return NextResponse.redirect(authUrl);
  },
  { route: "GET /api/social/connect/facebook", requireOrg: false },
);
