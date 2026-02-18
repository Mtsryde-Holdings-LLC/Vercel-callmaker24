import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/segments/preview
 * Preview how many customers match a set of conditions
 */
export const POST = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const body = await request.json();
    const { conditions, matchType } = body;

    if (!conditions?.rules || !Array.isArray(conditions.rules)) {
      // Handle direct array format from create page
      const rules = conditions || [];
      const where = buildWhereClause(
        Array.isArray(rules) ? rules : rules.rules || [],
        matchType || "all",
        organizationId,
      );

      const count = await prisma.customer.count({ where });
      return apiSuccess({ count }, { requestId });
    }

    const where = buildWhereClause(
      conditions.rules,
      matchType || "all",
      organizationId,
    );

    const count = await prisma.customer.count({ where });
    return apiSuccess({ count }, { requestId });
  },
  { route: "POST /api/segments/preview" },
);

function buildWhereClause(
  rules: any[],
  matchType: string,
  organizationId: string,
): any {
  const conditions: any[] = [];

  for (const rule of rules) {
    const { field, operator, value } = rule;

    if (!field || !value) continue;

    // Special case: daysSinceLastOrder
    if (field === "daysSinceLastOrder") {
      const daysAgo = new Date(
        Date.now() - parseInt(value) * 24 * 60 * 60 * 1000,
      );
      // "gt X days" means lastOrderAt is BEFORE that many days ago
      const inverted =
        operator === "gt" || operator === "gte"
          ? { [operator === "gt" ? "lt" : "lte"]: daysAgo }
          : { [operator === "lt" ? "gt" : "gte"]: daysAgo };
      conditions.push({ lastOrderAt: inverted });
      continue;
    }

    // Boolean fields
    if (
      field === "loyaltyMember" ||
      field === "smsOptIn" ||
      field === "emailOptIn"
    ) {
      conditions.push({ [field]: value === "true" });
      continue;
    }

    // Select/string fields
    if (
      field === "loyaltyTier" ||
      field === "churnRisk" ||
      field === "source" ||
      field === "rfmScore"
    ) {
      if (operator === "neq") {
        conditions.push({ [field]: { not: value } });
      } else if (operator === "contains") {
        conditions.push({ [field]: { contains: value, mode: "insensitive" } });
      } else if (operator === "startsWith") {
        conditions.push({
          [field]: { startsWith: value, mode: "insensitive" },
        });
      } else {
        conditions.push({ [field]: value });
      }
      continue;
    }

    // Numeric fields
    const numValue = parseFloat(value);
    if (isNaN(numValue)) continue;

    const prismaOp = mapOperator(operator);
    if (prismaOp === "equals") {
      conditions.push({ [field]: numValue });
    } else {
      conditions.push({ [field]: { [prismaOp]: numValue } });
    }
  }

  const baseWhere: any = { organizationId };

  if (conditions.length === 0) {
    return baseWhere;
  }

  if (matchType === "any") {
    return { ...baseWhere, OR: conditions };
  } else {
    return { ...baseWhere, AND: conditions };
  }
}

function mapOperator(op: string): string {
  switch (op) {
    case "gt":
      return "gt";
    case "gte":
      return "gte";
    case "lt":
      return "lt";
    case "lte":
      return "lte";
    case "eq":
      return "equals";
    default:
      return "equals";
  }
}
