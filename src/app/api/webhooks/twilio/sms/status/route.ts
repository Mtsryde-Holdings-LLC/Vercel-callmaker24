import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Twilio SMS Status Webhook
 *
 * Receives delivery status updates from Twilio and updates message records.
 * This ensures real-time tracking of SMS delivery, failures, and replies.
 *
 * Configure in Twilio Console:
 * Messaging > Settings > Webhook URL for status callbacks
 * POST https://yourdomain.com/api/webhooks/twilio/sms/status
 */

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const messageSid = formData.get("MessageSid") as string;
    const messageStatus = formData.get("MessageStatus") as string;
    const errorCode = formData.get("ErrorCode") as string | null;
    const errorMessage = formData.get("ErrorMessage") as string | null;

    if (!messageSid || !messageStatus) {
      console.error("Missing required webhook parameters");
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    console.log(
      `Twilio webhook: ${messageSid} status=${messageStatus} error=${errorCode}`
    );

    // Find the message by Twilio SID
    const message = await prisma.smsMessage.findUnique({
      where: { twilioSid: messageSid },
      include: { campaign: true },
    });

    if (!message) {
      console.warn(`Message not found for SID: ${messageSid}`);
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Map Twilio status to our SMS status
    let status: string;
    switch (messageStatus.toLowerCase()) {
      case "delivered":
        status = "DELIVERED";
        break;
      case "sent":
      case "queued":
      case "sending":
        status = "SENT";
        break;
      case "failed":
      case "undelivered":
        status = "FAILED";
        break;
      case "received":
        status = "REPLIED";
        break;
      default:
        status = "PENDING";
    }

    // Update message status
    await prisma.smsMessage.update({
      where: { id: message.id },
      data: {
        status: status as any,
        errorCode: errorCode || undefined,
        errorMessage: errorMessage || undefined,
      },
    });

    // Update campaign counters if this message belongs to a campaign
    if (message.campaignId) {
      await updateCampaignMetrics(message.campaignId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Twilio webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Recalculate campaign metrics from actual message data
 */
async function updateCampaignMetrics(campaignId: string) {
  try {
    const messages = await prisma.smsMessage.findMany({
      where: { campaignId },
      select: { status: true },
    });

    const deliveredCount = messages.filter(
      (m) => m.status === "DELIVERED"
    ).length;
    const failedCount = messages.filter(
      (m) => m.status === "FAILED" || m.status === "UNDELIVERED"
    ).length;
    const repliedCount = messages.filter((m) => m.status === "REPLIED").length;
    const optOutCount = messages.filter((m) => m.status === "OPT_OUT").length;

    await prisma.smsCampaign.update({
      where: { id: campaignId },
      data: {
        deliveredCount,
        failedCount,
        repliedCount,
        optOutCount,
      },
    });

    console.log(
      `Updated campaign ${campaignId}: ${deliveredCount} delivered, ${failedCount} failed`
    );
  } catch (error) {
    console.error("Failed to update campaign metrics:", error);
  }
}
