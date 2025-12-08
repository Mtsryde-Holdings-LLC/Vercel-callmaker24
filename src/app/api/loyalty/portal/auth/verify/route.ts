import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Verify magic link token and create session
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // Find customer by token
    const customer = await prisma.customer.findFirst({
      where: {
        portalToken: token,
        portalTokenExpiry: {
          gte: new Date(), // Token not expired
        },
      },
      include: {
        organization: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Clear token and update last login
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        portalToken: null,
        portalTokenExpiry: null,
        lastPortalLogin: new Date(),
      },
    });

    // Create JWT session token (valid for 24 hours)
    const sessionToken = jwt.sign(
      {
        customerId: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        organizationId: customer.organizationId,
      },
      process.env.NEXTAUTH_SECRET || "fallback-secret",
      { expiresIn: "24h" }
    );

    return NextResponse.json({
      success: true,
      sessionToken,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        loyaltyTier: customer.loyaltyTier,
        loyaltyPoints: customer.loyaltyPoints,
        loyaltyUsed: customer.loyaltyUsed,
        totalSpent: customer.totalSpent,
        orderCount: customer.orderCount,
        organization: {
          name: customer.organization?.name,
          slug: customer.organization?.slug,
        },
      },
    });
  } catch (error) {
    console.error("Portal auth verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify token" },
      { status: 500 }
    );
  }
}
