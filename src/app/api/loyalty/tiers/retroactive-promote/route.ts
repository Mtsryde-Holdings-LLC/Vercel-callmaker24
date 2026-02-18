import { NextRequest } from "next/server";
import { withAdminHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
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
export const POST = withAdminHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const body = await request.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    const customers = await prisma.customer.findMany({
      where: {
        organizationId,
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

    const results: {
      customerId: string;
      name: string;
      email: string | null;
      points: number;
      previousTier: string;
      newTier: string;
      discountCode?: string;
    }[] = [];

    const skipped: {
      customerId: string;
      name: string;
      tier: string;
      points: number;
    }[] = [];

    for (const customer of customers) {
      const name = [customer.firstName, customer.lastName]
        .filter(Boolean)
        .join(" ");

      if (dryRun) {
        const wouldPromote = await TierPromotionService.checkAndPromote({
          customerId: customer.id,
          currentPoints: customer.loyaltyPoints,
          organizationId,
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
        const result = await TierPromotionService.checkAndPromote({
          customerId: customer.id,
          currentPoints: customer.loyaltyPoints,
          organizationId,
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

    return apiSuccess(
      {
        dryRun,
        totalScanned: customers.length,
        promoted: results.length,
        unchanged: skipped.length,
        promotions: results,
        ...(dryRun
          ? {
              note: 'This was a dry run. No changes were made. POST again with { "dryRun": false } to apply.',
            }
          : {}),
      },
      { requestId },
    );
  },
  { route: "POST /api/loyalty/tiers/retroactive-promote" },
);
