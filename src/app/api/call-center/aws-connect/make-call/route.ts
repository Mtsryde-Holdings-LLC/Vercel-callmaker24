import { NextRequest, NextResponse } from "next/server";
import { awsConnectService } from "@/lib/aws-connect.service";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

/**
 * Make an outbound call via AWS Connect
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber, contactFlowId, queueId, attributes } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!awsConnectService.isConfigured()) {
      return NextResponse.json(
        { error: "AWS Connect not configured" },
        { status: 400 }
      );
    }

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    // Use default contact flow if not provided
    const flowId = contactFlowId || process.env.AWS_CONNECT_CONTACT_FLOW_ID;

    if (!flowId) {
      return NextResponse.json(
        {
          error:
            "Contact flow ID required. Set AWS_CONNECT_CONTACT_FLOW_ID or provide contactFlowId",
        },
        { status: 400 }
      );
    }

    // Start the call
    const result = await awsConnectService.startOutboundCall({
      destinationPhoneNumber: phoneNumber,
      contactFlowId: flowId,
      queueId: queueId || process.env.AWS_CONNECT_QUEUE_ID,
      sourcePhoneNumber: process.env.AWS_CONNECT_PHONE_NUMBER,
      attributes: {
        ...attributes,
        organizationId: user.organizationId,
        userId: user.id,
        userName: user.name || user.email,
      },
      clientToken: `call_${Date.now()}_${user.id}`,
    });

    // Save call record to database
    const call = await prisma.call.create({
      data: {
        from: process.env.AWS_CONNECT_PHONE_NUMBER || "AWS Connect",
        to: phoneNumber,
        direction: "OUTBOUND",
        status: "INITIATED",
        startedAt: new Date(),
        organizationId: user.organizationId,
        assignedToId: user.id,
        twilioCallSid: result.contactId, // AWS Contact ID stored here
      },
    });

    return NextResponse.json({
      contactId: result.contactId,
      callId: call.id,
      status: "initiated",
      phoneNumber: phoneNumber,
      timestamp: new Date().toISOString(),
      message: "Call initiated successfully",
    });
  } catch (error) {
    console.error("Error making call via AWS Connect:", error);
    return NextResponse.json(
      {
        error: "Failed to initiate call",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
