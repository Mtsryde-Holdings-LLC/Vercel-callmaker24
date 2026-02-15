import { prisma } from "@/lib/prisma";
import { SmsService } from "./sms.service";

export interface PointsEarnedData {
  customerId: string;
  pointsEarned: number;
  newBalance: number;
  reason?: string;
  organizationId: string;
}

export class LoyaltyNotificationsService {
  /**
   * Send SMS notification when customer earns points
   */
  static async sendPointsEarnedSms(data: PointsEarnedData): Promise<void> {
    try {
      // Get customer details
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
        select: {
          id: true,
          firstName: true,
          phone: true,
          loyaltyPoints: true,
          loyaltyTier: true,
          organization: {
            select: {
              name: true,
              id: true,
            },
          },
        },
      });

      if (!customer || !customer.phone) {
        console.log(
          `[Loyalty SMS] Customer ${data.customerId} has no phone number, skipping SMS`,
        );
        return;
      }

      // Format the message
      const message = this.formatPointsEarnedMessage({
        firstName: customer.firstName || "Valued Customer",
        pointsEarned: data.pointsEarned,
        newBalance: data.newBalance || customer.loyaltyPoints,
        tier: customer.loyaltyTier || "BRONZE",
        organizationName: customer.organization?.name || "our store",
        reason: data.reason,
      });

      // Send SMS
      const result = await SmsService.send({
        to: customer.phone,
        message,
        organizationId: data.organizationId,
      });

      if (result.success) {
        console.log(
          `[Loyalty SMS] Points earned notification sent to ${customer.phone}`,
        );
      } else {
        console.error(
          `[Loyalty SMS] Failed to send notification: ${result.error}`,
        );
      }
    } catch (error) {
      console.error(`[Loyalty SMS] Error sending points notification:`, error);
      // Don't throw - we don't want to break the main flow if SMS fails
    }
  }

  /**
   * Format the points earned message
   */
  private static formatPointsEarnedMessage(params: {
    firstName: string;
    pointsEarned: number;
    newBalance: number;
    tier: string;
    organizationName: string;
    reason?: string;
  }): string {
    const emoji = this.getTierEmoji(params.tier);
    const reasonText = params.reason ? ` for ${params.reason}` : "";

    return `🎉 Hi ${params.firstName}! You just earned ${params.pointsEarned} points${reasonText}!\n\n${emoji} ${params.tier} Member\n💰 New Balance: ${params.newBalance} points\n\nThank you for being a loyal customer at ${params.organizationName}!`;
  }

  /**
   * Get emoji for loyalty tier
   */
  private static getTierEmoji(tier: string): string {
    const emojiMap: Record<string, string> = {
      BRONZE: "🥉",
      SILVER: "🥈",
      GOLD: "🥇",
      DIAMOND: "👑",
    };
    return emojiMap[tier] || "⭐";
  }

  /**
   * Send SMS when customer redeems points
   */
  static async sendPointsRedeemedSms(params: {
    customerId: string;
    pointsSpent: number;
    newBalance: number;
    rewardName: string;
    organizationId: string;
  }): Promise<void> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: params.customerId },
        select: {
          firstName: true,
          phone: true,
          loyaltyTier: true,
          organization: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!customer || !customer.phone) {
        return;
      }

      const emoji = this.getTierEmoji(customer.loyaltyTier || "BRONZE");
      const message = `🎁 ${customer.firstName || "Hi"}! You've redeemed ${
        params.pointsSpent
      } points for: ${params.rewardName}\n\n${emoji} Balance: ${
        params.newBalance
      } points remaining\n\nEnjoy your reward from ${
        customer.organization?.name || "us"
      }!`;

      await SmsService.send({
        to: customer.phone,
        message,
        organizationId: params.organizationId,
      });

      console.log(
        `[Loyalty SMS] Redemption notification sent to ${customer.phone}`,
      );
    } catch (error) {
      console.error(
        `[Loyalty SMS] Error sending redemption notification:`,
        error,
      );
    }
  }

  /**
   * Send SMS for tier upgrade
   */
  static async sendTierUpgradeSms(params: {
    customerId: string;
    newTier: string;
    organizationId: string;
    discountCode?: string;
    discountPercent?: number;
  }): Promise<void> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: params.customerId },
        select: {
          firstName: true,
          phone: true,
          loyaltyPoints: true,
          organization: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!customer || !customer.phone) {
        return;
      }

      const emoji = this.getTierEmoji(params.newTier);
      const message = `🎊 Congratulations ${
        customer.firstName || ""
      }! You've been upgraded to ${emoji} ${
        params.newTier
      } tier!\n\n💰 Current Balance: ${
        customer.loyaltyPoints
      } points\n\nEnjoy exclusive benefits at ${
        customer.organization?.name || "our store"
      }!`;

      await SmsService.send({
        to: customer.phone,
        message,
        organizationId: params.organizationId,
      });

      console.log(
        `[Loyalty SMS] Tier upgrade notification sent to ${customer.phone}`,
      );
    } catch (error) {
      console.error(
        `[Loyalty SMS] Error sending tier upgrade notification:`,
        error,
      );
    }
  }
}
