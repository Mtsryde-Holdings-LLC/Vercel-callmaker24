/**
 * GET /api/shopify/callback
 *
 * Shopify OAuth Callback — handles the redirect after merchant approves scopes.
 *
 * Security:
 * 1. Verify HMAC signature (proves request came from Shopify)
 * 2. Verify nonce matches (prevents CSRF attacks)
 * 3. Exchange authorization code for access token
 * 4. Store credentials in database
 * 5. Register webhooks
 * 6. Redirect back to embedded app or billing
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyOAuthHmac } from "@/lib/shopify/verify-request";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");
  const state = searchParams.get("state");
  const hmac = searchParams.get("hmac");

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "https://callmaker24.com";

  // --- Validate required params ---
  if (!code || !shop || !state) {
    logger.warn("Missing OAuth callback params", {
      route: "shopify-callback",
      hasCode: !!code,
      hasShop: !!shop,
      hasState: !!state,
    });
    return NextResponse.redirect(`${appUrl}/shopify?error=missing_params`);
  }

  // --- Verify HMAC signature ---
  if (!verifyOAuthHmac(searchParams)) {
    logger.warn("HMAC verification failed in OAuth callback", {
      route: "shopify-callback",
      shop,
    });
    return NextResponse.redirect(
      `${appUrl}/shopify?error=invalid_hmac&shop=${encodeURIComponent(shop)}`,
    );
  }

  // --- Verify nonce (CSRF protection) ---
  let host = "";
  try {
    const stateData = JSON.parse(state);
    const nonce = stateData.nonce;
    host = stateData.host || "";

    const cookieStore = await cookies();
    const savedNonce = cookieStore.get("shopify_nonce")?.value;

    if (!savedNonce || savedNonce !== nonce) {
      logger.warn("Nonce mismatch in OAuth callback", {
        route: "shopify-callback",
        shop,
        hasStoredNonce: !!savedNonce,
      });
      return NextResponse.redirect(
        `${appUrl}/shopify?error=invalid_nonce&shop=${encodeURIComponent(shop)}`,
      );
    }
  } catch (e) {
    logger.warn("Failed to parse state in OAuth callback", {
      route: "shopify-callback",
      shop,
      state,
    });
    return NextResponse.redirect(
      `${appUrl}/shopify?error=invalid_state&shop=${encodeURIComponent(shop)}`,
    );
  }

  // --- Exchange code for access token ---
  let accessToken: string;
  try {
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

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      logger.error("Token exchange failed", {
        route: "shopify-callback",
        shop,
        status: tokenResponse.status,
        body: errText.substring(0, 200),
      });
      return NextResponse.redirect(
        `${appUrl}/shopify?error=token_exchange_failed&shop=${encodeURIComponent(shop)}`,
      );
    }

    const tokenData = await tokenResponse.json();
    accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error("No access_token in response");
    }
  } catch (error) {
    logger.error(
      "Token exchange error",
      { route: "shopify-callback", shop },
      error,
    );
    return NextResponse.redirect(
      `${appUrl}/shopify?error=token_exchange_error&shop=${encodeURIComponent(shop)}`,
    );
  }

  // --- Find or create organization for this shop ---
  // Look for existing integration first
  let organizationId: string;
  const existingIntegration = await prisma.integration.findFirst({
    where: {
      platform: "SHOPIFY",
      credentials: { path: ["shop"], equals: shop },
    },
  });

  if (existingIntegration) {
    organizationId = existingIntegration.organizationId || "";

    // Update the access token
    await prisma.integration.update({
      where: { id: existingIntegration.id },
      data: {
        credentials: { shop, accessToken },
        isActive: true,
      },
    });
  } else {
    // Check if there's a default organization to use
    // (In production, you'd create one per shop or use a lookup)
    const defaultOrg = await prisma.organization.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!defaultOrg) {
      logger.error("No organization found for new Shopify install", {
        route: "shopify-callback",
        shop,
      });
      return NextResponse.redirect(
        `${appUrl}/shopify?error=no_organization&shop=${encodeURIComponent(shop)}`,
      );
    }

    organizationId = defaultOrg.id;

    // Create the integration
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
        credentials: { shop, accessToken },
        isActive: true,
      },
      update: {
        credentials: { shop, accessToken },
        isActive: true,
      },
    });
  }

  // --- Register webhooks ---
  try {
    const webhookTopics = [
      "customers/create",
      "customers/update",
      "customers/delete",
      "app/uninstalled",
      "app_subscriptions/update",
    ];

    const webhookUrl = `${appUrl}/api/webhooks/shopify`;

    for (const topic of webhookTopics) {
      await fetch(`https://${shop}/admin/api/2025-01/webhooks.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address: webhookUrl,
            format: "json",
          },
        }),
      });
    }

    logger.info("Webhooks registered", {
      route: "shopify-callback",
      shop,
      topics: webhookTopics.length,
    });
  } catch (error) {
    // Non-fatal: log and continue
    logger.warn(
      "Webhook registration failed (non-fatal)",
      { route: "shopify-callback", shop },
      error,
    );
  }

  // --- Clear nonce cookie ---
  const response = host
    ? // Redirect back to embedded app
      NextResponse.redirect(
        `${appUrl}/shopify?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(host)}&installed=true`,
      )
    : // Redirect to dashboard
      NextResponse.redirect(
        `${appUrl}/dashboard/integrations/shopify?connected=true`,
      );

  response.cookies.set("shopify_nonce", "", {
    httpOnly: true,
    secure: true,
    maxAge: 0,
    path: "/",
  });

  logger.info("Shopify OAuth install completed successfully", {
    route: "shopify-callback",
    shop,
    organizationId,
    hasHost: !!host,
  });

  return response;
}
