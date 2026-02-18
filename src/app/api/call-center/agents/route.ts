import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/call-center/agents - Get agents for the organization
export const GET = withApiHandler(
  async (_request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const agents = await prisma.user.findMany({
      where: {
        organizationId,
        role: {
          in: ["AGENT", "SUB_ADMIN"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayCalls = await prisma.call.count({
          where: {
            organizationId,
            assignedToId: agent.id,
            createdAt: { gte: startOfDay },
          },
        });

        const avgDuration = await prisma.call.aggregate({
          where: {
            organizationId,
            assignedToId: agent.id,
            status: "COMPLETED",
            duration: { not: null },
          },
          _avg: { duration: true },
        });

        const activeCall = await prisma.call.findFirst({
          where: {
            organizationId,
            assignedToId: agent.id,
            status: "IN_PROGRESS",
          },
          select: { id: true, to: true },
        });

        let status: "Available" | "On Call" | "Break" | "Offline" = "Offline";
        if (activeCall) {
          status = "On Call";
        } else if (agent.lastLoginAt) {
          const lastLogin = new Date(agent.lastLoginAt);
          const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
          if (lastLogin > fifteenMinutesAgo) {
            status = "Available";
          }
        }

        const avgSeconds = avgDuration._avg.duration || 0;
        const avgMinutes = Math.floor(avgSeconds / 60);
        const avgSecondsRemainder = Math.floor(avgSeconds % 60);

        return {
          id: agent.id,
          name: agent.name || agent.email,
          email: agent.email,
          role: agent.role,
          status,
          currentCall: activeCall?.to,
          callsToday: todayCalls,
          avgHandleTime: `${avgMinutes}:${avgSecondsRemainder
            .toString()
            .padStart(2, "0")}`,
        };
      })
    );

    return apiSuccess(agentsWithStats, { requestId });
  },
  { route: 'GET /api/call-center/agents', rateLimit: RATE_LIMITS.standard }
);
