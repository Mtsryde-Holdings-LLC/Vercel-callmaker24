import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isServiceConfigured } from "@/lib/env";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export const GET = withPublicApiHandler(
  async (_request: NextRequest, { requestId }: ApiContext) => {
    // Check database connectivity (don't leak connection details)
    let dbHealthy = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbHealthy = true;
    } catch {
      dbHealthy = false;
    }

    const status = dbHealthy ? "ok" : "degraded";

    return apiSuccess(
      {
        status,
        version: process.env.BUILD_ID || "unknown",
        uptime: process.uptime?.() ?? 0,
        services: {
          database: dbHealthy ? "connected" : "disconnected",
          email: isServiceConfigured("email") ? "configured" : "not_configured",
          sms: isServiceConfigured("twilio") ? "configured" : "not_configured",
          payments: isServiceConfigured("stripe")
            ? "configured"
            : "not_configured",
        },
        timestamp: new Date().toISOString(),
      },
      { status: dbHealthy ? 200 : 503, requestId },
    );
  },
  { route: "GET /api/health" },
);
