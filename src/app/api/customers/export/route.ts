import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";

    // Mock customer data - replace with actual database query scoped to organizationId
    const customers = [
      {
        id: "cust_001",
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
        phone: "+1-555-0101",
        tags: "VIP;Newsletter",
        acceptsMarketing: true,
        createdAt: "2024-01-15",
      },
      {
        id: "cust_002",
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.j@example.com",
        phone: "+1-555-0102",
        tags: "Repeat Customer",
        acceptsMarketing: true,
        createdAt: "2024-02-20",
      },
    ];

    if (format === "csv") {
      const headers = [
        "id",
        "firstName",
        "lastName",
        "email",
        "phone",
        "tags",
        "acceptsMarketing",
        "createdAt",
      ];
      const csvRows = [headers.join(",")];

      customers.forEach((customer) => {
        const row = headers.map((header) => {
          const value = customer[header as keyof typeof customer];
          return `"${value}"`;
        });
        csvRows.push(row.join(","));
      });

      const csv = csvRows.join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="customers_${Date.now()}.csv"`,
          "X-Request-Id": requestId,
        },
      });
    }

    // JSON format
    return apiSuccess(customers, { requestId });
  },
  {
    route: "GET /api/customers/export",
    rateLimit: RATE_LIMITS.standard,
  },
);
