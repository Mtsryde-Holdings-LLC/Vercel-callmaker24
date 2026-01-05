import { prisma } from "@/lib/prisma";

/**
 * AI-Powered Customer Segmentation Service
 * Calculates RFM scores, engagement metrics, and assigns customers to segments
 */

interface RFMScores {
  recency: number;
  frequency: number;
  monetary: number;
}

interface CustomerSegmentData {
  rfmRecency: number;
  rfmFrequency: number;
  rfmMonetary: number;
  rfmScore: string;
  engagementScore: number;
  predictedLtv: number;
  churnRisk: string;
  segmentTags: string[];
}

export class SegmentationService {
  /**
   * Calculate RFM scores for a customer
   */
  static calculateRFM(customer: any): RFMScores {
    // Recency: Days since last order (lower is better)
    let recencyScore = 1;
    if (customer.lastOrderAt) {
      const daysSinceLastOrder = Math.floor(
        (Date.now() - new Date(customer.lastOrderAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastOrder <= 30) recencyScore = 5;
      else if (daysSinceLastOrder <= 90) recencyScore = 4;
      else if (daysSinceLastOrder <= 180) recencyScore = 3;
      else if (daysSinceLastOrder <= 365) recencyScore = 2;
      else recencyScore = 1;
    }

    // Frequency: Number of orders (higher is better)
    let frequencyScore = 1;
    const orderCount = customer.orderCount || 0;
    if (orderCount >= 20) frequencyScore = 5;
    else if (orderCount >= 10) frequencyScore = 4;
    else if (orderCount >= 5) frequencyScore = 3;
    else if (orderCount >= 2) frequencyScore = 2;
    else frequencyScore = 1;

    // Monetary: Total spending (higher is better)
    let monetaryScore = 1;
    const totalSpent = customer.totalSpent || 0;
    if (totalSpent >= 1000) monetaryScore = 5;
    else if (totalSpent >= 500) monetaryScore = 4;
    else if (totalSpent >= 200) monetaryScore = 3;
    else if (totalSpent >= 50) monetaryScore = 2;
    else monetaryScore = 1;

    return {
      recency: recencyScore,
      frequency: frequencyScore,
      monetary: monetaryScore,
    };
  }

  /**
   * Calculate engagement score based on multiple factors
   */
  static calculateEngagementScore(customer: any, activities: any[]): number {
    let score = 0;

    // Email engagement (0-25 points)
    const emailOpens = activities.filter(
      (a) => a.type === "EMAIL_OPENED"
    ).length;
    const emailClicks = activities.filter(
      (a) => a.type === "EMAIL_CLICKED"
    ).length;
    score += Math.min(emailOpens * 2, 15);
    score += Math.min(emailClicks * 5, 10);

    // SMS engagement (0-15 points)
    const smsReceived = activities.filter(
      (a) => a.type === "SMS_RECEIVED"
    ).length;
    score += Math.min(smsReceived * 3, 15);

    // Purchase activity (0-30 points)
    const purchases = activities.filter((a) => a.type === "PURCHASE").length;
    score += Math.min(purchases * 6, 30);

    // Loyalty program participation (0-20 points)
    if (customer.loyaltyMember) {
      score += 10;
      if (customer.loyaltyPoints > 100) score += 5;
      if (customer.loyaltyPoints > 500) score += 5;
    }

    // Chat/support interaction (0-10 points)
    const chatSessions = activities.filter(
      (a) => a.type === "CHAT_STARTED"
    ).length;
    score += Math.min(chatSessions * 2, 10);

    return Math.min(score, 100);
  }

  /**
   * Predict customer lifetime value
   */
  static predictLTV(customer: any, rfmScores: RFMScores): number {
    const avgOrderValue =
      customer.orderCount > 0
        ? customer.totalSpent / customer.orderCount
        : customer.totalSpent;

    // Simple LTV prediction based on RFM
    const rfmMultiplier = (rfmScores.recency + rfmScores.frequency + rfmScores.monetary) / 3;
    
    // Base LTV on current spending with growth factor
    const baseLTV = customer.totalSpent;
    const growthFactor = 1 + (rfmMultiplier / 5);
    
    return Math.round(baseLTV * growthFactor);
  }

  /**
   * Assess churn risk
   */
  static assessChurnRisk(customer: any, engagementScore: number): string {
    // High risk if:
    // - No recent orders (recency > 180 days)
    // - Low engagement
    // - Not a loyalty member
    
    const daysSinceLastOrder = customer.lastOrderAt
      ? Math.floor(
          (Date.now() - new Date(customer.lastOrderAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 999;

    if (daysSinceLastOrder > 180 && engagementScore < 20) return "HIGH";
    if (daysSinceLastOrder > 90 && engagementScore < 40) return "MEDIUM";
    return "LOW";
  }

  /**
   * Generate segment tags based on customer behavior
   */
  static generateSegmentTags(
    customer: any,
    rfmScores: RFMScores,
    engagementScore: number,
    churnRisk: string
  ): string[] {
    const tags: string[] = [];

    // Value-based segments
    if (customer.totalSpent >= 1000) tags.push("HIGH_VALUE");
    else if (customer.totalSpent >= 500) tags.push("MEDIUM_VALUE");
    else if (customer.totalSpent < 50) tags.push("LOW_VALUE");

    // Engagement-based segments
    if (engagementScore >= 70) tags.push("HIGHLY_ENGAGED");
    else if (engagementScore >= 40) tags.push("MODERATELY_ENGAGED");
    else if (engagementScore < 20) tags.push("DISENGAGED");

    // Frequency-based segments
    if (rfmScores.frequency >= 4) tags.push("FREQUENT_BUYER");
    else if (rfmScores.frequency <= 2 && customer.orderCount > 0)
      tags.push("OCCASIONAL_BUYER");

    // Recency-based segments
    if (rfmScores.recency >= 4) tags.push("RECENT_CUSTOMER");
    else if (rfmScores.recency <= 2) tags.push("DORMANT");

    // Churn risk
    if (churnRisk === "HIGH") tags.push("AT_RISK");

    // Champions (best customers)
    if (rfmScores.recency >= 4 && rfmScores.frequency >= 4 && rfmScores.monetary >= 4) {
      tags.push("CHAMPION");
    }

    // New customers
    if (customer.orderCount <= 1) tags.push("NEW_CUSTOMER");

    // Loyalty program
    if (customer.loyaltyMember) {
      tags.push("LOYALTY_MEMBER");
      if (customer.loyaltyTier === "DIAMOND" || customer.loyaltyTier === "PLATINUM") {
        tags.push("VIP");
      }
    }

    return tags;
  }

  /**
   * Calculate all segmentation metrics for a customer
   */
  static async calculateCustomerSegmentation(
    customerId: string
  ): Promise<CustomerSegmentData> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        activities: {
          orderBy: { createdAt: "desc" },
          take: 100, // Last 100 activities
        },
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    const rfmScores = this.calculateRFM(customer);
    const engagementScore = this.calculateEngagementScore(
      customer,
      customer.activities
    );
    const predictedLtv = this.predictLTV(customer, rfmScores);
    const churnRisk = this.assessChurnRisk(customer, engagementScore);
    const segmentTags = this.generateSegmentTags(
      customer,
      rfmScores,
      engagementScore,
      churnRisk
    );

    const rfmRecency = customer.lastOrderAt
      ? Math.floor(
          (Date.now() - new Date(customer.lastOrderAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 999;

    return {
      rfmRecency,
      rfmFrequency: rfmScores.frequency,
      rfmMonetary: rfmScores.monetary,
      rfmScore: `${rfmScores.recency}${rfmScores.frequency}${rfmScores.monetary}`,
      engagementScore,
      predictedLtv,
      churnRisk,
      segmentTags,
    };
  }

  /**
   * Update customer with calculated segmentation data
   */
  static async updateCustomerSegmentation(customerId: string): Promise<void> {
    const segmentData = await this.calculateCustomerSegmentation(customerId);

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        rfmRecency: segmentData.rfmRecency,
        rfmFrequency: segmentData.rfmFrequency,
        rfmMonetary: segmentData.rfmMonetary,
        rfmScore: segmentData.rfmScore,
        engagementScore: segmentData.engagementScore,
        predictedLtv: segmentData.predictedLtv,
        churnRisk: segmentData.churnRisk,
        segmentTags: segmentData.segmentTags,
      },
    });
  }

  /**
   * Recalculate all customers for an organization
   */
  static async recalculateAllCustomers(organizationId: string): Promise<{
    processed: number;
    failed: number;
  }> {
    const customers = await prisma.customer.findMany({
      where: { organizationId },
      select: { id: true },
    });

    let processed = 0;
    let failed = 0;

    for (const customer of customers) {
      try {
        await this.updateCustomerSegmentation(customer.id);
        processed++;
      } catch (error) {
        console.error(
          `Failed to segment customer ${customer.id}:`,
          error
        );
        failed++;
      }
    }

    return { processed, failed };
  }

  /**
   * Auto-assign customers to AI-powered segments
   */
  static async assignToSegments(organizationId: string): Promise<void> {
    // Get all customers with segment tags
    const customers = await prisma.customer.findMany({
      where: { organizationId },
      include: { segments: true },
    });

    // Define AI segment mappings
    const segmentMappings = [
      {
        name: "Champions",
        type: "CHAMPION",
        tags: ["CHAMPION"],
        description: "Best customers - high value, high frequency, recent purchases",
      },
      {
        name: "High Value",
        type: "HIGH_VALUE",
        tags: ["HIGH_VALUE", "VIP"],
        description: "Customers with highest spending",
      },
      {
        name: "At Risk",
        type: "AT_RISK",
        tags: ["AT_RISK", "DORMANT"],
        description: "Customers at risk of churning",
      },
      {
        name: "Highly Engaged",
        type: "ENGAGED",
        tags: ["HIGHLY_ENGAGED"],
        description: "Active customers with high engagement",
      },
      {
        name: "New Customers",
        type: "NEW",
        tags: ["NEW_CUSTOMER"],
        description: "Recently acquired customers",
      },
      {
        name: "Frequent Buyers",
        type: "FREQUENT",
        tags: ["FREQUENT_BUYER"],
        description: "Customers who purchase regularly",
      },
    ];

    // Create or update segments
    for (const mapping of segmentMappings) {
      const segment = await prisma.segment.upsert({
        where: {
          organizationId_segmentType: {
            organizationId,
            segmentType: mapping.type,
          },
        },
        create: {
          name: mapping.name,
          description: mapping.description,
          segmentType: mapping.type,
          isAiPowered: true,
          autoUpdate: true,
          organizationId,
          conditions: {},
        },
        update: {
          lastCalculated: new Date(),
        },
      });

      // Find matching customers
      const matchingCustomers = customers.filter((customer) => {
        const tags = (customer.segmentTags as string[]) || [];
        return mapping.tags.some((tag) => tags.includes(tag));
      });

      // Update segment membership
      await prisma.segment.update({
        where: { id: segment.id },
        data: {
          customers: {
            set: matchingCustomers.map((c) => ({ id: c.id })),
          },
          customerCount: matchingCustomers.length,
          avgLifetimeValue:
            matchingCustomers.reduce((sum, c) => sum + (c.predictedLtv || 0), 0) /
            matchingCustomers.length,
          avgEngagement:
            matchingCustomers.reduce((sum, c) => sum + (c.engagementScore || 0), 0) /
            matchingCustomers.length,
        },
      });
    }
  }
}
