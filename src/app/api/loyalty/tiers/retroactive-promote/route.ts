import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TierPromotionService } from "@/services/tier-promotion.service";

/**
 * POST /api/loyalty/tiers/retroactive-promote
 *
 * Scans all loyalty members in the organisation and promotes anyone whose
 * current points qualify them for a higher tier.  Each promoted customer
 * receives a discount code and SMS notification – exactly the same flow
 * that now runs automatically on every new purchase.
 *
 * Admin-only.  Pass `{ "dryRun": true }` to preview without making changes.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 },
      );
    }

    // Only admins / owners may trigger this
    if (!["ADMIN", "OWNER"].includes(user.role || "")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    // Fetch all loyalty members for this organisation
    const customers = await prisma.customer.findMany({
      where: {
        organizationId: user.organizationId,
        loyaltyMember: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        loyaltyPoints: true,
        loyaltyTier: true,
      },
      orderBy: { loyaltyPoints: "desc" },
    });

    console.log(
      `[Retroactive Promote] Scanning ${customers.length} loyalty members (dryRun=${dryRun})`,
    );

    const results: {
      customerId: string;
      name: string;
      email: string | null;
      points: number;
      previousTier: string;
      newTier: string;
      discountCode?: string;
    }[] = [];

    const skipped: { customerId: string; name: string; tier: string; points: number }[] = [];

    for (const customer of customers) {
      const name = [customer.firstName, customer.lastName]
        .filter(Boolean)
        .join(" ");

      if (dryRun) {
        // In dry-run mode, just check what *would* happen without mutating
        const wouldPromote = await TierPromotionService.checkAndPromote({
          customerId: customer.id,
          currentPoints: customer.loyaltyPoints,
          organizationId: user.organizationId,
          dryRun: true,
        });

        if (wouldPromote.promoted) {
          results.push({
            customerId: customer.id,
            name,
            email: customer.email,
            points: customer.loyaltyPoints,
            previousTier: wouldPromote.previousTier,
            newTier: wouldPromote.newTier,
          });
        } else {
          skipped.push({
            customerId: customer.id,
            name,
            tier: customer.loyaltyTier || "BRONZE",
            points: customer.loyaltyPoints,
          });
        }
      } else {
        // Real promotion
        const result = await TierPromotionService.checkAndPromote({
          customerId: customer.id,
          currentPoints: customer.loyaltyPoints,
          organizationId: user.organizationId,
        });

        if (result.promoted) {
          results.push({
            customerId: customer.id,
            name,
            email: customer.email,
            points: customer.loyaltyPoints,
            previousTier: result.previousTier,
            newTier: result.newTier,
            discountCode: result.discountCode,
          });
        } else {
          skipped.push({
            customerId: customer.id,
            name,
            tier: customer.loyaltyTier || "BRONZE",
            points: customer.loyaltyPoints,
          });
        }
      }
    }

    console.log(
      `[Retroactive Promote] Complete: ${results.length} promoted, ${skipped.length} already at correct tier`,
    );

    return NextResponse.json({
      success: true,
      dryRun,
      totalScanned: customers.length,
      promoted: results.length,
      unchanged: skipped.length,
      promotions: results,
      ...(dryRun ? { note: "This was a dry run. No changes were made. POST again with { \"dryRun\": false } to apply." } : {}),
    });
  } catch (error: any) {
    console.error("[Retroactive Promote] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to run retroactive promotions" },
      { status: 500 },
    );
  }
}
