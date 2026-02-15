import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { LoyaltyNotificationsService } from "./loyalty-notifications.service";
import { SmsService } from "./sms.service";
import { EmailService } from "./email.service";
import { TIER_BENEFITS } from "@/lib/constants";

/**
 * Tier thresholds in ascending order.
 * These match the defaults in /api/loyalty/tiers/initialize.
 * If an organization has custom tiers stored in the DB we use those instead.
 */
const DEFAULT_TIERS = [
  { tier: "BRONZE", minPoints: 0, discountPercent: 0, discountAmount: 0 },
  { tier: "SILVER", minPoints: 150, discountPercent: 10, discountAmount: 0 },
  { tier: "GOLD", minPoints: 300, discountPercent: 15, discountAmount: 0 },
  { tier: "DIAMOND", minPoints: 500, discountPercent: 15, discountAmount: 10 },
] as const;

const TIER_ORDER = ["BRONZE", "SILVER", "GOLD", "DIAMOND"];

export interface TierPromotionResult {
  promoted: boolean;
  previousTier: string;
  newTier: string;
  discountCode?: string;
}

export class TierPromotionService {
  /**
   * Check whether a customer's current points qualify them for a higher
   * tier. If so, upgrade the tier, create a congratulatory discount code,
   * and send an SMS notification.
   *
   * Call this **after** points have already been incremented on the customer.
   */
  static async checkAndPromote(params: {
    customerId: string;
    currentPoints: number;
    organizationId: string;
    dryRun?: boolean;
  }): Promise<TierPromotionResult> {
    const {
      customerId,
      currentPoints,
      organizationId,
      dryRun = false,
    } = params;

    // 1. Fetch current customer tier
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        loyaltyTier: true,
        loyaltyPoints: true,
        organizationId: true,
        organization: { select: { name: true } },
      },
    });

    if (!customer) {
      return { promoted: false, previousTier: "BRONZE", newTier: "BRONZE" };
    }

    const previousTier = customer.loyaltyTier || "BRONZE";

    // 2. Load organisation-specific tiers from DB, fall back to defaults
    const tiers = await this.getTierThresholds(organizationId);

    // 3. Determine the highest tier the customer now qualifies for
    const qualifiedTier = this.getQualifiedTier(currentPoints, tiers);

    if (!qualifiedTier || qualifiedTier.tier === previousTier) {
      // No promotion needed
      return { promoted: false, previousTier, newTier: previousTier };
    }

    // Only promote **upward** – never demote
    if (
      TIER_ORDER.indexOf(qualifiedTier.tier) <= TIER_ORDER.indexOf(previousTier)
    ) {
      return { promoted: false, previousTier, newTier: previousTier };
    }

    // In dry-run mode, return what *would* happen without mutating anything
    if (dryRun) {
      return {
        promoted: true,
        previousTier,
        newTier: qualifiedTier.tier,
      };
    }

    // 4. Update customer tier
    await prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyTier: qualifiedTier.tier as any },
    });

    console.log(
      `[TierPromotion] Customer ${customerId} promoted from ${previousTier} to ${qualifiedTier.tier}`,
    );

    // 5. Create a tier-promotion discount reward code
    let discountCode: string | undefined;
    if (qualifiedTier.discountPercent > 0 || qualifiedTier.discountAmount > 0) {
      discountCode = await this.createPromotionReward({
        customerId,
        organizationId,
        tierName: qualifiedTier.tier,
        discountPercent: qualifiedTier.discountPercent,
        discountAmount: qualifiedTier.discountAmount,
      });
    }

    // 6. Send tier upgrade SMS (non-blocking)
    LoyaltyNotificationsService.sendTierUpgradeSms({
      customerId,
      newTier: qualifiedTier.tier,
      organizationId,
    }).catch((err) =>
      console.error("[TierPromotion] Failed to send tier upgrade SMS:", err),
    );

    // 7. Send discount code SMS if one was created (non-blocking)
    if (discountCode && customer.phone) {
      this.sendPromotionDiscountSms({
        phone: customer.phone,
        firstName: customer.firstName || "Valued Customer",
        tierName: qualifiedTier.tier,
        discountPercent: qualifiedTier.discountPercent,
        discountAmount: qualifiedTier.discountAmount,
        discountCode,
        organizationName: customer.organization?.name || "our store",
        organizationId,
      }).catch((err) =>
        console.error("[TierPromotion] Failed to send discount code SMS:", err),
      );
    }

    // 8. Send tier promotion email (non-blocking)
    if (customer.email) {
      this.sendPromotionEmail({
        email: customer.email,
        firstName: customer.firstName || "Valued Customer",
        lastName: customer.lastName || "",
        tierName: qualifiedTier.tier,
        previousTier,
        discountPercent: qualifiedTier.discountPercent,
        discountAmount: qualifiedTier.discountAmount,
        discountCode,
        currentPoints: currentPoints,
        organizationName: customer.organization?.name || "our store",
        organizationId,
      }).catch((err) =>
        console.error("[TierPromotion] Failed to send promotion email:", err),
      );
    }

    return {
      promoted: true,
      previousTier,
      newTier: qualifiedTier.tier,
      discountCode,
    };
  }

  /**
   * Load tier thresholds from the DB for the organisation.
   * Falls back to hard-coded defaults if none exist.
   */
  private static async getTierThresholds(organizationId: string): Promise<
    {
      tier: string;
      minPoints: number;
      discountPercent: number;
      discountAmount: number;
    }[]
  > {
    try {
      const dbTiers = await prisma.loyaltyTier.findMany({
        where: { organizationId },
        orderBy: { minPoints: "asc" },
      });

      if (dbTiers.length > 0) {
        return dbTiers.map((t) => ({
          tier: t.tier,
          minPoints: t.minPoints,
          // Extract discount from benefits JSON, or use defaults
          discountPercent: this.extractDiscount(t.tier, t.benefits),
          discountAmount: this.extractDiscountAmount(t.tier, t.benefits),
        }));
      }
    } catch {
      // Fall through to defaults
    }

    return [...DEFAULT_TIERS];
  }

  /**
   * Extract the discount percentage from the benefits JSON stored on the tier,
   * falling back to the default tiers.
   */
  private static extractDiscount(tier: string, benefits: any): number {
    // Try to parse from benefits array (e.g., "5% discount")
    if (Array.isArray(benefits)) {
      for (const b of benefits) {
        if (typeof b === "string") {
          const match = b.match(/(\d+)%\s*discount/i);
          if (match) return parseInt(match[1], 10);
        }
      }
    }
    // Fall back to defaults
    const def = DEFAULT_TIERS.find((d) => d.tier === tier);
    return def?.discountPercent ?? 0;
  }

  /**
   * Extract the fixed dollar discount from the benefits JSON stored on the tier,
   * falling back to the default tiers.
   */
  private static extractDiscountAmount(tier: string, benefits: any): number {
    if (Array.isArray(benefits)) {
      for (const b of benefits) {
        if (typeof b === "string") {
          const match = b.match(/\$(\d+(?:\.\d+)?)\s*off/i);
          if (match) return parseFloat(match[1]);
        }
      }
    }
    const def = DEFAULT_TIERS.find((d) => d.tier === tier);
    return def?.discountAmount ?? 0;
  }

  /**
   * Return the highest tier the customer qualifies for based on their points.
   */
  private static getQualifiedTier(
    points: number,
    tiers: {
      tier: string;
      minPoints: number;
      discountPercent: number;
      discountAmount: number;
    }[],
  ) {
    // Sort descending by minPoints to find the highest qualifying tier
    const sorted = [...tiers].sort((a, b) => b.minPoints - a.minPoints);
    return sorted.find((t) => points >= t.minPoints) || tiers[0];
  }

  /**
   * Create a single-use discount reward and immediately redeem it as a
   * gift code for the customer's tier promotion.
   */
  private static async createPromotionReward(params: {
    customerId: string;
    organizationId: string;
    tierName: string;
    discountPercent: number;
    discountAmount: number;
  }): Promise<string> {
    const code = `TIER-${params.tierName}-${randomBytes(4).toString("hex").toUpperCase()}`;

    // Build reward name and description based on discount type
    const discountLabel = this.formatDiscountLabel(
      params.discountPercent,
      params.discountAmount,
    );
    const rewardName = `${params.tierName} Tier Promotion - ${discountLabel}`;

    // Determine reward type
    const hasPercent = params.discountPercent > 0;
    const hasFixed = params.discountAmount > 0;
    const rewardType =
      hasPercent && hasFixed
        ? "COMBO"
        : hasFixed
          ? "FIXED_AMOUNT_DISCOUNT"
          : "PERCENTAGE_DISCOUNT";

    let reward = await prisma.redemptionReward.findFirst({
      where: {
        name: rewardName,
        organizationId: params.organizationId,
      },
    });

    if (!reward) {
      reward = await prisma.redemptionReward.create({
        data: {
          name: rewardName,
          description: `Congratulations on reaching ${params.tierName} tier! Enjoy ${discountLabel} on your next purchase.`,
          pointsCost: 0, // Free – it's a tier promotion gift
          type: rewardType,
          discountPercent: hasPercent ? params.discountPercent : null,
          discountAmount: hasFixed ? params.discountAmount : null,
          isActive: true,
          isSingleUse: true,
          expiryDays: null, // Never expires
          organizationId: params.organizationId,
        },
      });
    }

    // Create a redemption record for the customer (no points deducted)
    await prisma.rewardRedemption.create({
      data: {
        customerId: params.customerId,
        rewardId: reward.id,
        pointsSpent: 0, // Gift – no cost
        code,
        status: "ACTIVE",
        expiresAt: null, // Never expires
        organizationId: params.organizationId,
      },
    });

    console.log(
      `[TierPromotion] Created discount code ${code} (${discountLabel}) for customer ${params.customerId}`,
    );

    return code;
  }

  /**
   * Format a human-readable discount label (e.g. "15% Off + $10 Off")
   */
  private static formatDiscountLabel(percent: number, amount: number): string {
    const parts: string[] = [];
    if (percent > 0) parts.push(`${percent}% Off`);
    if (amount > 0) parts.push(`$${amount} Off`);
    return parts.join(" + ") || "Special Offer";
  }

  /**
   * Send an SMS with the tier-promotion discount code.
   */
  private static async sendPromotionDiscountSms(params: {
    phone: string;
    firstName: string;
    tierName: string;
    discountPercent: number;
    discountAmount: number;
    discountCode: string;
    organizationName: string;
    organizationId: string;
  }): Promise<void> {
    const tierEmojis: Record<string, string> = {
      BRONZE: "🥉",
      SILVER: "🥈",
      GOLD: "🥇",
      DIAMOND: "👑",
    };

    const emoji = tierEmojis[params.tierName] || "⭐";
    const discountLabel = this.formatDiscountLabel(
      params.discountPercent,
      params.discountAmount,
    );

    const message =
      `🎉 ${params.firstName}, you've been promoted to ${emoji} ${params.tierName} tier!\n\n` +
      `As a reward, here's ${discountLabel} on your next purchase:\n\n` +
      `🎟️ Code: ${params.discountCode}\n` +
      `✅ This code never expires\n\n` +
      `Thank you for your loyalty at ${params.organizationName}!`;

    await SmsService.send({
      to: params.phone,
      message,
      organizationId: params.organizationId,
    });

    console.log(`[TierPromotion] Discount code SMS sent to ${params.phone}`);
  }

  /**
   * Send a beautifully formatted HTML email for tier promotion with discount code.
   */
  private static async sendPromotionEmail(params: {
    email: string;
    firstName: string;
    lastName: string;
    tierName: string;
    previousTier: string;
    discountPercent: number;
    discountAmount: number;
    discountCode?: string;
    currentPoints: number;
    organizationName: string;
    organizationId: string;
  }): Promise<void> {
    const tierEmojis: Record<string, string> = {
      BRONZE: "🥉",
      SILVER: "🥈",
      GOLD: "🥇",
      DIAMOND: "👑",
    };

    const tierColors: Record<
      string,
      { bg: string; text: string; accent: string }
    > = {
      BRONZE: { bg: "#FDF2E9", text: "#8B4513", accent: "#CD7F32" },
      SILVER: { bg: "#F0F0F5", text: "#4A4A6A", accent: "#C0C0C0" },
      GOLD: { bg: "#FFF8E1", text: "#6B5B00", accent: "#FFD700" },
      DIAMOND: { bg: "#F0F8FF", text: "#1A237E", accent: "#B9F2FF" },
    };

    const emoji = tierEmojis[params.tierName] || "⭐";
    const colors = tierColors[params.tierName] || tierColors.BRONZE;
    const discountLabel = this.formatDiscountLabel(
      params.discountPercent,
      params.discountAmount,
    );

    const benefits: Record<string, string[]> = {
      SILVER: TIER_BENEFITS.SILVER,
      GOLD: TIER_BENEFITS.GOLD,
      DIAMOND: TIER_BENEFITS.DIAMOND,
    };

    const tierBenefits = benefits[params.tierName] || [];

    const benefitsHtml =
      tierBenefits.length > 0
        ? tierBenefits
            .map((b) => `<li style="padding: 6px 0; color: #555;">${b}</li>`)
            .join("")
        : "";

    const discountSection = params.discountCode
      ? `
        <div style="background: ${colors.bg}; border: 2px dashed ${colors.accent}; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
          <p style="color: ${colors.text}; font-size: 14px; margin: 0 0 8px 0;">Your exclusive ${params.tierName} reward:</p>
          <p style="color: ${colors.text}; font-size: 22px; font-weight: bold; margin: 0 0 12px 0;">${discountLabel}</p>
          <div style="background: white; border-radius: 8px; padding: 16px; display: inline-block; margin: 8px 0;">
            <p style="color: #888; font-size: 12px; margin: 0 0 4px 0;">YOUR DISCOUNT CODE</p>
            <p style="color: ${colors.text}; font-size: 28px; font-weight: bold; letter-spacing: 3px; margin: 0; font-family: monospace;">${params.discountCode}</p>
          </div>
          <p style="color: #888; font-size: 13px; margin: 12px 0 0 0;">✅ This code never expires — use it any time!</p>
        </div>`
      : "";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${colors.accent}, ${colors.text}); padding: 40px 32px; text-align: center;">
              <p style="font-size: 48px; margin: 0 0 8px 0;">${emoji}</p>
              <h1 style="color: white; font-size: 28px; margin: 0 0 8px 0;">Tier Upgrade!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">You've reached <strong>${params.tierName}</strong> status</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Hi ${params.firstName},
              </p>
              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                Congratulations! 🎉 Your loyalty has been rewarded. You've been promoted from 
                <strong>${params.previousTier}</strong> to <strong>${emoji} ${params.tierName}</strong> tier 
                with <strong>${params.currentPoints.toLocaleString()} points</strong>.
              </p>
              
              ${discountSection}
              
              ${
                benefitsHtml
                  ? `
              <div style="margin: 24px 0;">
                <h3 style="color: #333; font-size: 16px; margin: 0 0 12px 0;">Your ${params.tierName} Benefits:</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  ${tierBenefits.map((b) => `<li style="padding: 6px 0; color: #555;">✨ ${b}</li>`).join("")}
                </ul>
              </div>`
                  : ""
              }
              
              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                Keep earning points with every purchase to unlock even more rewards!
              </p>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                Thank you for being a loyal customer! 💜
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fa; padding: 24px 32px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 13px; margin: 0;">
                ${params.organizationName} Loyalty Program
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const subject = `${emoji} Congratulations! You've been promoted to ${params.tierName} tier!`;

    await EmailService.send({
      to: params.email,
      subject,
      html,
      text: `Congratulations ${params.firstName}! You've been promoted from ${params.previousTier} to ${params.tierName} tier with ${params.currentPoints} points.${params.discountCode ? ` Your discount code: ${params.discountCode} (${discountLabel}) - never expires!` : ""} Thank you for your loyalty at ${params.organizationName}!`,
      organizationId: params.organizationId,
    });

    console.log(`[TierPromotion] Promotion email sent to ${params.email}`);
  }
}
