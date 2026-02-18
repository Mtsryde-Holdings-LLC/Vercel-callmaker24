import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { awsConnectService } from "@/lib/aws-connect.service";
import { prisma } from "@/lib/prisma";

/**
 * Make an outbound call via AWS Connect
 */
export const POST = withApiHandler(
  async (request: NextRequest, { session, organizationId, requestId }: ApiContext) => {
    const body = await request.json();
    const { phoneNumber, contactFlowId, queueId, attributes } = body;

    if (!phoneNumber) {
      return apiError('Phone number is required', { status: 400, requestId });
    }

    if (!awsConnectService.isConfigured()) {
      return apiError('AWS Connect not configured', { status: 400, requestId });
    }

    const flowId = contactFlowId || process.env.AWS_CONNECT_CONTACT_FLOW_ID;

    if (!flowId) {
      return apiError(
        'Contact flow ID required. Set AWS_CONNECT_CONTACT_FLOW_ID or provide contactFlowId',
        { status: 400, requestId }
      );
    }

    const result = await awsConnectService.startOutboundCall({
      destinationPhoneNumber: phoneNumber,
      contactFlowId: flowId,
      queueId: queueId || process.env.AWS_CONNECT_QUEUE_ID,
      sourcePhoneNumber: process.env.AWS_CONNECT_PHONE_NUMBER,
      attributes: {
        ...attributes,
        organizationId,
        userId: session.user.id,
        userName: session.user.name || session.user.email,
      },
      clientToken: `call_${Date.now()}_${session.user.id}`,
    });

    const call = await prisma.call.create({
      data: {
        from: process.env.AWS_CONNECT_PHONE_NUMBER || 'AWS Connect',
        to: phoneNumber,
        direction: 'OUTBOUND',
        status: 'INITIATED',
        startedAt: new Date(),
        organizationId,
        assignedToId: session.user.id,
        twilioCallSid: result.contactId,
      },
    });

    return apiSuccess({
      contactId: result.contactId,
      callId: call.id,
      status: 'initiated',
      phoneNumber,
      timestamp: new Date().toISOString(),
      message: 'Call initiated successfully',
    }, { requestId });
  },
  { route: 'POST /api/call-center/aws-connect/make-call', rateLimit: RATE_LIMITS.standard }
);
