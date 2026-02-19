import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const GET = withPublicApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const shop = searchParams.get("shop");
    const state = searchParams.get("state");
    const hmac = searchParams.get("hmac");

    if (!code || !shop || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_params`,
      );
    }

    const [organizationId] = state.split(":");

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_API_KEY,
          client_secret: process.env.SHOPIFY_API_SECRET,
          code,
        }),
      },
    );

    const { access_token } = await tokenResponse.json();

    // Save integration to database
    await prisma.integration.upsert({
      where: {
        organizationId_platform: {
          organizationId,
          platform: "SHOPIFY",
        },
      },
      create: {
        organizationId,
        name: "Shopify",
        type: "ECOMMERCE",
        platform: "SHOPIFY",
        credentials: { shop, accessToken: access_token },
        isActive: true,
      },
      update: {
        credentials: { shop, accessToken: access_token },
        isActive: true,
      },
    });

    // Check if the org already has an active paid subscription
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { subscriptionTier: true, subscriptionStatus: true },
    });

    const hasPaidPlan =
      org?.subscriptionTier &&
      org.subscriptionTier !== "FREE" &&
      org.subscriptionStatus &&
      ["ACTIVE", "TRIALING"].includes(org.subscriptionStatus);

    // If no active paid plan, redirect to subscription page so the merchant
    // can select a plan through Shopify billing (required for App Store).
    // Otherwise, redirect to the integrations page.
    if (!hasPaidPlan) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?shopify_connected=true`,
      );
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations/shopify?connected=true`,
    );
  },
  { route: "GET /api/integrations/shopify/callback" },
);
