import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/segments/preview
 * Preview how many customers match a set of conditions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conditions, matchType } = body;

    const organizationId = session.user.organizationId!;

    if (!conditions?.rules || !Array.isArray(conditions.rules)) {
      // Handle direct array format from create page
      const rules = conditions || [];
      const where = buildWhereClause(
        Array.isArray(rules) ? rules : rules.rules || [],
        matchType || "all",
        organizationId,
      );

      const count = await prisma.customer.count({ where });
      return NextResponse.json({ success: true, count });
    }

    const where = buildWhereClause(
      conditions.rules,
      matchType || "all",
      organizationId,
    );

    const count = await prisma.customer.count({ where });
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Segment preview error:", error);
    return NextResponse.json(
      { error: "Failed to preview segment" },
      { status: 500 },
    );
  }
}

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
