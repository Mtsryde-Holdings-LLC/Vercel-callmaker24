import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";

export const POST = withWebhookHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    try {
      const body = await req.json();
      const { callSid, from, to, status } = body;

      await prisma.call.create({
        data: {
          twilioCallSid: callSid,
          direction: "INBOUND",
          status: status?.toUpperCase() || "IN_PROGRESS",
          from,
          to,
          organizationId: "cmirtl4590001j5m9wsq8va37",
          startedAt: new Date(),
        },
      });
    } catch {
      // Swallow to prevent webhook retries
    }

    return apiSuccess({ success: true }, { requestId });
  },
  { route: "POST /api/ivr/studio-webhook" },
);
