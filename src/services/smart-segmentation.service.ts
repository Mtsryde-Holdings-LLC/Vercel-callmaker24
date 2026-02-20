import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import OpenAI from "openai";
import { logger } from "@/lib/logger";

/**
 * Smart AI-Powered Segmentation Service
 *
 * Uses OpenAI to analyze customer cohorts and generate intelligent segments
 * based on: purchase history, engagement levels, demographics, browsing
 * behavior signals, and predicted lifetime value.
 *
 * Dynamic segments auto-update via the daily cron job.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SmartSegmentConfig {
  id?: string;
  name: string;
  description?: string;
  segmentType: string;
  /** Rule-based conditions (always evaluated) */
  conditions: SegmentCondition[];
  matchType: "all" | "any";
  /** Whether to also run AI analysis on cohort */
  useAiAnalysis: boolean;
  /** Auto-update on cron run */
  autoUpdate: boolean;
  /** Priority for campaign targeting */
  priority: number;
}

export interface SegmentCondition {
  field: string;
  operator: string;
  value: string;
}

interface _CustomerProfile {
  id: string;
  totalSpent: number;
  orderCount: number;
  avgOrderValue: number;
  daysSinceLastOrder: number;
  daysSinceFirstOrder: number;
  engagementScore: number;
  rfmScore: string;
  churnRisk: string;
  loyaltyTier: string | null;
  loyaltyPoints: number;
  emailEngaged: boolean;
  smsEngaged: boolean;
  source: string | null;
  predictedLtv: number;
}

interface AiSegmentInsight {
  segmentLabel: string;
  description: string;
  keyCharacteristics: string[];
  recommendedActions: string[];
  estimatedLtv: number;
  churnProbability: number;
}

// ─── Pre-defined Smart Segment Templates ─────────────────────────────────────

export const SMART_SEGMENT_TEMPLATES: SmartSegmentConfig[] = [
  {
    name: "VIP Whales",
    segmentType: "VIP_WHALES",
    description: "Top 10% spenders with high engagement and loyalty status",
    conditions: [
      { field: "totalSpent", operator: "gte", value: "500" },
      { field: "engagementScore", operator: "gte", value: "60" },
      { field: "loyaltyMember", operator: "eq", value: "true" },
    ],
    matchType: "all",
    useAiAnalysis: true,
    autoUpdate: true,
    priority: 1,
  },
  {
    name: "Rising Stars",
    segmentType: "RISING_STARS",
    description:
      "New customers showing strong purchase velocity and engagement growth",
    conditions: [
      { field: "orderCount", operator: "gte", value: "2" },
      { field: "daysSinceLastOrder", operator: "lte", value: "30" },
      { field: "engagementScore", operator: "gte", value: "40" },
    ],
    matchType: "all",
    useAiAnalysis: true,
    autoUpdate: true,
    priority: 2,
  },
  {
    name: "Win-Back Targets",
    segmentType: "WIN_BACK",
    description:
      "Previously active customers who have stopped purchasing — high churn risk",
    conditions: [
      { field: "orderCount", operator: "gte", value: "2" },
      { field: "daysSinceLastOrder", operator: "gte", value: "90" },
      { field: "churnRisk", operator: "eq", value: "HIGH" },
    ],
    matchType: "all",
    useAiAnalysis: true,
    autoUpdate: true,
    priority: 3,
  },
  {
    name: "Bargain Hunters",
    segmentType: "BARGAIN_HUNTERS",
    description:
      "Customers who only buy during sales/discounts with below-average order values",
    conditions: [
      { field: "orderCount", operator: "gte", value: "3" },
      { field: "totalSpent", operator: "lte", value: "150" },
    ],
    matchType: "all",
    useAiAnalysis: false,
    autoUpdate: true,
    priority: 5,
  },
  {
    name: "Loyal Advocates",
    segmentType: "LOYAL_ADVOCATES",
    description:
      "Long-term customers with loyalty tier Gold+ and consistent engagement",
    conditions: [
      { field: "loyaltyTier", operator: "eq", value: "GOLD" },
      { field: "engagementScore", operator: "gte", value: "50" },
      { field: "orderCount", operator: "gte", value: "5" },
    ],
    matchType: "all",
    useAiAnalysis: true,
    autoUpdate: true,
    priority: 2,
  },
  {
    name: "First-Time Buyers",
    segmentType: "FIRST_TIME",
    description:
      "Customers with exactly one purchase — critical nurture window",
    conditions: [
      { field: "orderCount", operator: "eq", value: "1" },
      { field: "daysSinceLastOrder", operator: "lte", value: "60" },
    ],
    matchType: "all",
    useAiAnalysis: false,
    autoUpdate: true,
    priority: 4,
  },
  {
    name: "Email Enthusiasts",
    segmentType: "EMAIL_ENGAGED",
    description:
      "Customers who consistently open and click emails — ideal for email campaigns",
    conditions: [
      { field: "emailOptIn", operator: "eq", value: "true" },
      { field: "engagementScore", operator: "gte", value: "50" },
    ],
    matchType: "all",
    useAiAnalysis: false,
    autoUpdate: true,
    priority: 4,
  },
  {
    name: "SMS Responsive",
    segmentType: "SMS_RESPONSIVE",
    description:
      "Customers who engage via SMS — ideal for text-based campaigns",
    conditions: [
      { field: "smsOptIn", operator: "eq", value: "true" },
      { field: "engagementScore", operator: "gte", value: "30" },
    ],
    matchType: "all",
    useAiAnalysis: false,
    autoUpdate: true,
    priority: 4,
  },
  {
    name: "Dormant High-Value",
    segmentType: "DORMANT_HIGH_VALUE",
    description:
      "Previously high-spending customers who've gone quiet — highest ROI win-back targets",
    conditions: [
      { field: "totalSpent", operator: "gte", value: "300" },
      { field: "daysSinceLastOrder", operator: "gte", value: "120" },
      { field: "engagementScore", operator: "lte", value: "30" },
    ],
    matchType: "all",
    useAiAnalysis: true,
    autoUpdate: true,
    priority: 2,
  },
  {
    name: "Birthday This Month",
    segmentType: "BIRTHDAY_MONTH",
    description: "Customers with a birthday in the current month",
    conditions: [{ field: "birthdayMonth", operator: "eq", value: "current" }],
    matchType: "all",
    useAiAnalysis: false,
    autoUpdate: true,
    priority: 3,
  },
];

// ─── Service ─────────────────────────────────────────────────────────────────

export class SmartSegmentationService {
  // ── Condition evaluation ────────────────────────────────────────────────

  /**
   * Build a Prisma `where` clause from smart segment conditions.
   */
  static buildWhereClause(
    conditions: SegmentCondition[],
    matchType: "all" | "any",
    organizationId: string,
  ): Record<string, unknown> {
    const clauses: Record<string, unknown>[] = [];

    for (const rule of conditions) {
      const clause = this.conditionToClause(rule);
      if (clause) clauses.push(clause);
    }

    const base: Record<string, unknown> = { organizationId, status: "ACTIVE" };

    if (clauses.length === 0) return base;

    return matchType === "any"
      ? { ...base, OR: clauses }
      : { ...base, AND: clauses };
  }

  private static conditionToClause(
    rule: SegmentCondition,
  ): Record<string, unknown> | null {
    const { field, operator, value } = rule;
    if (!field || value === undefined || value === "") return null;

    // ── Special fields ────────────────────────────────────────────────────

    if (field === "daysSinceLastOrder") {
      const daysAgo = new Date(
        Date.now() - parseInt(value) * 24 * 60 * 60 * 1000,
      );
      // "gte 90 days" → lastOrderAt is before 90 days ago
      const prismaOp =
        operator === "gt" || operator === "gte"
          ? { [operator === "gt" ? "lt" : "lte"]: daysAgo }
          : { [operator === "lt" ? "gt" : "gte"]: daysAgo };
      return { lastOrderAt: prismaOp };
    }

    if (field === "daysSinceFirstOrder") {
      const daysAgo = new Date(
        Date.now() - parseInt(value) * 24 * 60 * 60 * 1000,
      );
      const prismaOp =
        operator === "gt" || operator === "gte"
          ? { [operator === "gt" ? "lt" : "lte"]: daysAgo }
          : { [operator === "lt" ? "gt" : "gte"]: daysAgo };
      return { createdAt: prismaOp };
    }

    if (field === "birthdayMonth") {
      const now = new Date();
      const month = value === "current" ? now.getMonth() : parseInt(value) - 1;
      const year = now.getFullYear();
      return {
        birthday: {
          gte: new Date(year, month, 1),
          lt: new Date(year, month + 1, 1),
        },
      };
    }

    // ── Boolean fields ────────────────────────────────────────────────────

    if (
      field === "loyaltyMember" ||
      field === "smsOptIn" ||
      field === "emailOptIn"
    ) {
      return { [field]: value === "true" };
    }

    // ── Enum / string fields ──────────────────────────────────────────────

    if (
      field === "loyaltyTier" ||
      field === "churnRisk" ||
      field === "source" ||
      field === "rfmScore" ||
      field === "status"
    ) {
      // For loyaltyTier with gte, also match higher tiers
      if (
        field === "loyaltyTier" &&
        (operator === "gte" || operator === "gt")
      ) {
        const tierOrder = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];
        const idx = tierOrder.indexOf(value);
        if (idx >= 0) {
          const matchTiers =
            operator === "gte"
              ? tierOrder.slice(idx)
              : tierOrder.slice(idx + 1);
          return { loyaltyTier: { in: matchTiers } };
        }
      }
      if (operator === "eq") return { [field]: value };
      if (operator === "neq") return { [field]: { not: value } };
      if (operator === "contains")
        return { [field]: { contains: value, mode: "insensitive" } };
      return { [field]: value };
    }

    // ── Numeric fields ────────────────────────────────────────────────────

    const numericFields = [
      "totalSpent",
      "orderCount",
      "engagementScore",
      "loyaltyPoints",
      "predictedLtv",
      "rfmRecency",
      "rfmFrequency",
      "rfmMonetary",
    ];

    if (numericFields.includes(field)) {
      const numValue = parseFloat(value);
      const opMap: Record<string, string> = {
        gt: "gt",
        gte: "gte",
        lt: "lt",
        lte: "lte",
        eq: "equals",
        neq: "not",
      };
      return { [field]: { [opMap[operator] || "gte"]: numValue } };
    }

    return null;
  }

  // ── Evaluate & update a single smart segment ───────────────────────────

  /**
   * Evaluate a smart segment's conditions, find matching customers,
   * update membership, and optionally run AI analysis.
   */
  static async evaluateSegment(
    segmentId: string,
    organizationId: string,
  ): Promise<{
    customerCount: number;
    avgLtv: number;
    avgEngagement: number;
    aiInsight?: AiSegmentInsight;
  }> {
    const segment = await prisma.segment.findUnique({
      where: { id: segmentId },
    });

    if (!segment) throw new Error("Segment not found");

    const config = segment.conditions as Record<string, unknown>;
    const conditions = (config?.rules as SegmentCondition[]) || [];
    const matchType = (config?.matchType as "all" | "any") || "all";
    const useAi = (config?.useAiAnalysis as boolean) || false;

    const where = this.buildWhereClause(conditions, matchType, organizationId);

    // Find matching customers
    const matchingCustomers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        totalSpent: true,
        orderCount: true,
        lastOrderAt: true,
        engagementScore: true,
        predictedLtv: true,
        rfmScore: true,
        churnRisk: true,
        loyaltyTier: true,
        loyaltyPoints: true,
        loyaltyMember: true,
        emailOptIn: true,
        smsOptIn: true,
        source: true,
        createdAt: true,
      },
    });

    const customerCount = matchingCustomers.length;
    const avgLtv =
      customerCount > 0
        ? matchingCustomers.reduce((s, c) => s + (c.predictedLtv || 0), 0) /
          customerCount
        : 0;
    const avgEngagement =
      customerCount > 0
        ? matchingCustomers.reduce((s, c) => s + (c.engagementScore || 0), 0) /
          customerCount
        : 0;

    // Update segment membership via M2M
    await prisma.segment.update({
      where: { id: segmentId },
      data: {
        customers: {
          set: matchingCustomers.map((c) => ({ id: c.id })),
        },
        customerCount,
        avgLifetimeValue: Math.round(avgLtv),
        avgEngagement: Math.round(avgEngagement * 10) / 10,
        lastCalculated: new Date(),
      },
    });

    // Optional AI analysis for the cohort
    let aiInsight: AiSegmentInsight | undefined;
    if (useAi && customerCount > 0) {
      try {
        aiInsight = await this.generateAiInsight(
          segment.name,
          matchingCustomers,
        );
      } catch (err) {
        logger.error(
          "AI insight generation failed",
          { segmentId, segmentName: segment.name },
          err,
        );
      }
    }

    return { customerCount, avgLtv, avgEngagement, aiInsight };
  }

  // ── Evaluate ALL smart segments for an organization ────────────────────

  static async evaluateAllSegments(organizationId: string): Promise<{
    evaluated: number;
    totalCustomersSegmented: number;
    results: Array<{
      segmentId: string;
      name: string;
      customerCount: number;
      avgLtv: number;
    }>;
  }> {
    // Get all segments that should auto-update
    const segments = await prisma.segment.findMany({
      where: {
        organizationId,
        autoUpdate: true,
      },
    });

    const results: Array<{
      segmentId: string;
      name: string;
      customerCount: number;
      avgLtv: number;
    }> = [];

    let totalCustomersSegmented = 0;

    for (const segment of segments) {
      try {
        const result = await this.evaluateSegment(segment.id, organizationId);
        results.push({
          segmentId: segment.id,
          name: segment.name,
          customerCount: result.customerCount,
          avgLtv: result.avgLtv,
        });
        totalCustomersSegmented += result.customerCount;
      } catch (err) {
        logger.error(
          "Segment evaluation failed",
          { segmentId: segment.id, segmentName: segment.name },
          err,
        );
      }
    }

    return {
      evaluated: results.length,
      totalCustomersSegmented,
      results,
    };
  }

  // ── Initialize smart segments from templates  ──────────────────────────

  /**
   * Create all pre-defined smart segments for an organization if they
   * don't already exist. Called from the configuration UI.
   */
  static async initializeTemplates(
    organizationId: string,
  ): Promise<{ created: number; existing: number }> {
    let created = 0;
    let existing = 0;

    for (const template of SMART_SEGMENT_TEMPLATES) {
      const existingSegment = await prisma.segment.findFirst({
        where: { organizationId, segmentType: template.segmentType },
      });

      if (existingSegment) {
        existing++;
        continue;
      }

      await prisma.segment.create({
        data: {
          name: template.name,
          description: template.description || "",
          segmentType: template.segmentType,
          isAiPowered: template.useAiAnalysis,
          autoUpdate: template.autoUpdate,
          organizationId,
          conditions: JSON.parse(
            JSON.stringify({
              rules: template.conditions,
              matchType: template.matchType,
              useAiAnalysis: template.useAiAnalysis,
              priority: template.priority,
            }),
          ),
          customerCount: 0,
        },
      });
      created++;
    }

    return { created, existing };
  }

  // ── AI Insight Generation ──────────────────────────────────────────────

  private static async generateAiInsight(
    segmentName: string,
    customers: Array<{
      totalSpent: number;
      orderCount: number;
      lastOrderAt: Date | null;
      engagementScore: number | null;
      predictedLtv: number | null;
      rfmScore: string | null;
      churnRisk: string | null;
      loyaltyTier: string | null;
      loyaltyPoints: number;
      source: string | null;
    }>,
  ): Promise<AiSegmentInsight> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Return a simple rule-based insight when no API key
      return this.generateRuleBasedInsight(segmentName, customers);
    }

    const openai = new OpenAI({ apiKey });

    // Aggregate stats to keep tokens low
    const stats = this.aggregateCustomerStats(customers);

    const prompt = `You are a customer analytics expert. Analyze this customer segment and return actionable insights.

Segment Name: "${segmentName}"
Cohort Size: ${customers.length} customers

Aggregated Stats:
- Average Spend: $${stats.avgSpend.toFixed(2)}
- Median Spend: $${stats.medianSpend.toFixed(2)}
- Average Orders: ${stats.avgOrders.toFixed(1)}
- Average Engagement Score: ${stats.avgEngagement.toFixed(1)}/100
- Average Predicted LTV: $${stats.avgLtv.toFixed(2)}
- Churn Risk Distribution: HIGH=${stats.churnHigh}%, MEDIUM=${stats.churnMedium}%, LOW=${stats.churnLow}%
- Top Sources: ${stats.topSources.join(", ")}
- Loyalty Tier Distribution: ${stats.tierBreakdown}
- Avg Days Since Last Order: ${stats.avgDaysSinceLastOrder}

Return a JSON object (no markdown) with these exact keys:
{
  "segmentLabel": "A short marketing-friendly label for this cohort",
  "description": "2-3 sentence cohort summary",
  "keyCharacteristics": ["trait1", "trait2", "trait3"],
  "recommendedActions": ["action1", "action2", "action3"],
  "estimatedLtv": <number>,
  "churnProbability": <0-1 float>
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a CRM analytics expert. Always respond with valid JSON only, no markdown.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content || "{}";
      return JSON.parse(content) as AiSegmentInsight;
    } catch {
      return this.generateRuleBasedInsight(segmentName, customers);
    }
  }

  /**
   * Fallback insight when OpenAI is unavailable
   */
  private static generateRuleBasedInsight(
    segmentName: string,
    customers: Array<{
      totalSpent: number;
      orderCount: number;
      engagementScore: number | null;
      predictedLtv: number | null;
      churnRisk: string | null;
    }>,
  ): AiSegmentInsight {
    const stats = this.aggregateCustomerStats(customers);
    const highChurn = stats.churnHigh > 30;
    const highValue = stats.avgSpend > 200;

    return {
      segmentLabel: segmentName,
      description: `This segment contains ${customers.length} customers with an average spend of $${stats.avgSpend.toFixed(0)} and ${stats.avgEngagement.toFixed(0)}% engagement score.`,
      keyCharacteristics: [
        `Average ${stats.avgOrders.toFixed(1)} orders per customer`,
        highValue ? "High-value spenders" : "Standard-value spenders",
        highChurn
          ? "Elevated churn risk — needs attention"
          : "Healthy retention levels",
      ],
      recommendedActions: [
        highChurn
          ? "Launch a win-back email campaign with exclusive offers"
          : "Send a loyalty appreciation message",
        highValue
          ? "Offer VIP early access to new products"
          : "Encourage larger baskets with bundle deals",
        "Personalize communications based on purchase history",
      ],
      estimatedLtv: stats.avgLtv,
      churnProbability: stats.churnHigh / 100,
    };
  }

  private static aggregateCustomerStats(
    customers: Array<{
      totalSpent: number;
      orderCount: number;
      lastOrderAt?: Date | null;
      engagementScore?: number | null;
      predictedLtv?: number | null;
      rfmScore?: string | null;
      churnRisk?: string | null;
      loyaltyTier?: string | null;
      source?: string | null;
    }>,
  ) {
    const n = customers.length || 1;

    const spends = customers.map((c) => c.totalSpent).sort((a, b) => a - b);
    const avgSpend = spends.reduce((s, v) => s + v, 0) / n;
    const medianSpend = spends[Math.floor(n / 2)] || 0;
    const avgOrders = customers.reduce((s, c) => s + c.orderCount, 0) / n;
    const avgEngagement =
      customers.reduce((s, c) => s + (c.engagementScore || 0), 0) / n;
    const avgLtv = customers.reduce((s, c) => s + (c.predictedLtv || 0), 0) / n;

    const churnCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    customers.forEach((c) => {
      const risk = (c.churnRisk || "LOW") as keyof typeof churnCounts;
      churnCounts[risk] = (churnCounts[risk] || 0) + 1;
    });
    const churnHigh = Math.round((churnCounts.HIGH / n) * 100);
    const churnMedium = Math.round((churnCounts.MEDIUM / n) * 100);
    const churnLow = 100 - churnHigh - churnMedium;

    // Sources
    const sourceCounts: Record<string, number> = {};
    customers.forEach((c) => {
      const src = c.source || "Unknown";
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });
    const topSources = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([src, count]) => `${src} (${count})`);

    // Tier breakdown
    const tierCounts: Record<string, number> = {};
    customers.forEach((c) => {
      const tier = c.loyaltyTier || "None";
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    });
    const tierBreakdown = Object.entries(tierCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tier, count]) => `${tier}:${count}`)
      .join(", ");

    // Avg days since last order
    const now = Date.now();
    const daysSinceValues = customers
      .filter((c) => c.lastOrderAt)
      .map((c) =>
        Math.floor(
          (now - new Date(c.lastOrderAt!).getTime()) / (1000 * 60 * 60 * 24),
        ),
      );
    const avgDaysSinceLastOrder =
      daysSinceValues.length > 0
        ? Math.round(
            daysSinceValues.reduce((s, v) => s + v, 0) / daysSinceValues.length,
          )
        : 999;

    return {
      avgSpend,
      medianSpend,
      avgOrders,
      avgEngagement,
      avgLtv,
      churnHigh,
      churnMedium,
      churnLow,
      topSources,
      tierBreakdown,
      avgDaysSinceLastOrder,
    };
  }

  // ── Predicted LTV with Enhanced Model ──────────────────────────────────

  /**
   * Enhanced LTV prediction using a weighted model that considers
   * recency, frequency, monetary value, engagement, and loyalty status.
   */
  static predictEnhancedLTV(customer: {
    totalSpent: number;
    orderCount: number;
    lastOrderAt: Date | null;
    engagementScore: number | null;
    loyaltyMember: boolean;
    loyaltyTier: string | null;
    createdAt: Date;
  }): number {
    if (customer.orderCount === 0) return 0;

    const avgOrderValue = customer.totalSpent / customer.orderCount;
    const now = Date.now();

    // Recency factor (0.5–1.5): recent customers weighted higher
    const daysSince = customer.lastOrderAt
      ? (now - new Date(customer.lastOrderAt).getTime()) / (1000 * 86400)
      : 365;
    const recencyFactor = Math.max(0.5, 1.5 - daysSince / 365);

    // Frequency factor: annualized purchase rate
    const customerAgeDays = Math.max(
      30,
      (now - new Date(customer.createdAt).getTime()) / (1000 * 86400),
    );
    const annualRate = (customer.orderCount / customerAgeDays) * 365;

    // Engagement multiplier
    const engagementMult = 1 + ((customer.engagementScore || 0) / 100) * 0.3;

    // Loyalty multiplier
    const loyaltyMult = customer.loyaltyMember
      ? { DIAMOND: 1.5, PLATINUM: 1.4, GOLD: 1.3, SILVER: 1.2, BRONZE: 1.1 }[
          customer.loyaltyTier || "BRONZE"
        ] || 1.1
      : 1.0;

    // Project 2 years forward
    const projectedOrders = annualRate * 2;
    const ltv =
      avgOrderValue *
      projectedOrders *
      recencyFactor *
      engagementMult *
      loyaltyMult;

    return Math.round(Math.max(ltv, customer.totalSpent));
  }

  // ── Recalculate enhanced metrics for all customers ─────────────────────

  static async recalculateEnhancedMetrics(organizationId: string): Promise<{
    updated: number;
  }> {
    const customers = await prisma.customer.findMany({
      where: { organizationId },
      select: {
        id: true,
        totalSpent: true,
        orderCount: true,
        lastOrderAt: true,
        engagementScore: true,
        loyaltyMember: true,
        loyaltyTier: true,
        createdAt: true,
      },
    });

    let updated = 0;

    for (const customer of customers) {
      const ltv = this.predictEnhancedLTV(customer);

      await prisma.customer.update({
        where: { id: customer.id },
        data: { predictedLtv: ltv },
      });
      updated++;
    }

    return { updated };
  }
}
