import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withWebhookHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";

export const POST = withWebhookHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    const formData = await req.formData();
    const callSid = formData.get("CallSid") as string;
    const status = formData.get("CallStatus") as string;
    const duration = formData.get("CallDuration") as string;

    await prisma.call.update({
      where: { twilioCallSid: callSid },
      data: {
        status: status.toUpperCase() as any,
        duration: parseInt(duration) || 0,
        endedAt: new Date(),
      },
    });

    return apiSuccess({ success: true }, { requestId });
  },
  { route: "POST /api/voice/status" },
);
