import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const checkout = JSON.parse(body);

    const integration = await prisma.integration.findFirst({
      where: {
        platform: "SHOPIFY",
        credentials: {
          path: ["shop"],
          equals: req.headers.get("x-shopify-shop-domain"),
        },
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    const customer = await prisma.customer.findFirst({
      where: {
        email: checkout.email,
        organizationId: integration.organizationId,
      },
    });

    if (!customer) {
      return NextResponse.json({ success: true });
    }

    // Create abandoned cart record
    await prisma.abandonedCart.create({
      data: {
        customerId: customer.id,
        organizationId: integration.organizationId,
        total: parseFloat(checkout.total_price),
        cartUrl: checkout.abandoned_checkout_url,
        items: checkout.line_items,
        externalId: checkout.id.toString(),
      },
    });

    // Note: Recovery emails/SMS are handled by the abandoned-cart-recovery cron job
    // which runs every 30 minutes and sends messages to carts abandoned 1+ hours ago

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Abandoned cart webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
