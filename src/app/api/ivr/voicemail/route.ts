import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  withWebhookHandler,
  withApiHandler,
  ApiContext,
} from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";

export const POST = withWebhookHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    const formData = await req.formData();
    const RecordingUrl = formData.get("RecordingUrl") as string;
    const From = formData.get("From") as string;
    const orgId = formData.get("orgId") as string;

    await prisma.voicemail.create({
      data: {
        callerPhone: From,
        recordingUrl: RecordingUrl,
        organizationId: orgId,
      },
    });

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you for your message. We will get back to you soon.</Say>
  <Hangup/>
</Response>`,
      { headers: { "Content-Type": "text/xml" } },
    );
  },
  { route: "POST /api/ivr/voicemail" },
);

export const GET = withApiHandler(
  async (req: NextRequest, { requestId, session }: ApiContext) => {
    if (!session?.user) {
      return apiError("Unauthorized", { status: 401, requestId });
    }

    const voicemails = await prisma.voicemail.findMany({
      where: { organizationId: session.user.organizationId ?? undefined },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ data: voicemails }, { requestId });
  },
  { route: "GET /api/ivr/voicemail" },
);
