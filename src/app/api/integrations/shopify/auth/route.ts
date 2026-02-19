import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { RATE_LIMITS } from "@/lib/rate-limit";
import {
  sanitizeShopDomain,
  generateNonce,
} from "@/lib/shopify/verify-request";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  async (req: NextRequest, { organizationId }: ApiContext) => {
    // Accept shop from query param or fall back to env
    const shopParam =
      req.nextUrl.searchParams.get("shop") ||
      process.env.SHOPIFY_SHOP_DOMAIN ||
      "0brr4n-au.myshopify.com";
    const shop = sanitizeShopDomain(shopParam) || shopParam;

    const scopes =
      "read_customers,write_customers,read_orders,read_products,read_inventory,read_own_subscription_contracts,write_own_subscription_contracts";
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://callmaker24.com"}/api/integrations/shopify/callback`;
    const nonce = generateNonce();
    const state = `${organizationId}:${nonce}`;

    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;

    return NextResponse.redirect(authUrl);
  },
  {
    route: "GET /api/integrations/shopify/auth",
    rateLimit: RATE_LIMITS.standard,
  },
);
