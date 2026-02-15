import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.redirect("/auth/signin");
    }

    const shop = process.env.SHOPIFY_SHOP_DOMAIN || "0brr4n-au.myshopify.com";
    const scopes =
      "read_customers,write_customers,read_orders,read_products,read_inventory";
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://callmaker24.com"}/api/integrations/shopify/callback`;
    const state = `${session.user.organizationId}:${Date.now()}`;

    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
