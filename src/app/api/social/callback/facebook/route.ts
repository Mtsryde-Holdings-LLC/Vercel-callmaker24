import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorReason = searchParams.get("error_reason");
  const errorDescription = searchParams.get("error_description");

  // Handle user cancellation or errors from Facebook
  if (error) {
    console.error(
      "Facebook OAuth error:",
      error,
      errorReason,
      errorDescription
    );
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/social?error=${encodeURIComponent(
        error === "access_denied" ? "user_cancelled" : "oauth_error"
      )}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/social?error=missing_params`
    );
  }

  try {
    // Exchange code for access token
    const clientId =
      process.env.FACEBOOK_CLIENT_ID || process.env.FACEBOOK_APP_ID;
    const clientSecret =
      process.env.FACEBOOK_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Facebook credentials not configured");
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/social?error=facebook_not_configured`
      );
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/callback/facebook`;
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      console.error("Facebook token exchange error:", tokenData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/social?error=token_exchange_failed`
      );
    }

    if (!tokenData.access_token) {
      console.error("No access token in response:", tokenData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/social?error=no_access_token`
      );
    }

    // Get user info
    const userRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name&access_token=${tokenData.access_token}`
    );
    const userData = await userRes.json();

    if (!userRes.ok || userData.error) {
      console.error("Facebook user info error:", userData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/social?error=user_info_failed`
      );
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { id: state } });

    if (!user) {
      console.error("User not found for state:", state);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/social?error=user_not_found`
      );
    }

    // Check if account already exists
    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        platform: "FACEBOOK",
        platformUserId: userData.id,
        organizationId: user.organizationId,
      },
    });

    if (existingAccount) {
      // Update existing account
      await prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: tokenData.access_token,
          username: userData.name,
          displayName: userData.name,
          isActive: true,
        },
      });
    } else {
      // Create new account
      await prisma.socialAccount.create({
        data: {
          platform: "FACEBOOK",
          platformUserId: userData.id,
          username: userData.name,
          displayName: userData.name,
          accessToken: tokenData.access_token,
          userId: state,
          organizationId: user.organizationId,
          isActive: true,
        },
      });
    }

    return NextResponse.redirect(
      `${
        process.env.NEXTAUTH_URL
      }/dashboard/social?connected=Facebook&username=${encodeURIComponent(
        userData.name
      )}`
    );
  } catch (error) {
    console.error("Facebook OAuth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/social?error=connection_failed`
    );
  }
}
