import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/sms-campaigns/:id/send
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, organizationId: true },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: "Forbidden - No organization" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { sendNow, scheduledFor } = body;

    // Verify campaign belongs to user's organization
    const campaign = await prisma.smsCampaign.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft campaigns can be sent or scheduled" },
        { status: 400 }
      );
    }

    // Handle scheduling
    if (scheduledFor && !sendNow) {
      await prisma.smsCampaign.update({
        where: { id: campaign.id },
        data: {
          status: "SCHEDULED",
          scheduledAt: new Date(scheduledFor),
        },
      });

      return NextResponse.json({
        success: true,
        scheduled: true,
        scheduledAt: scheduledFor,
      });
    }

    // Handle immediate send
    // Get recipients from customer list (all customers with phone)
    const customers = await prisma.customer.findMany({
      where: {
        organizationId: user.organizationId,
        phone: { not: null },
        status: "ACTIVE",
      },
    });

    await prisma.smsCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "SENDING",
        totalRecipients: customers.length,
      },
    });

    // Send SMS
    console.log("Sending SMS now to", customers.length, "recipients");
    const { SmsService } = await import("@/services/sms.service");

    let successCount = 0;
    let failCount = 0;

    for (const customer of customers) {
      if (customer.phone) {
        try {
          const result = await SmsService.send({
            to: customer.phone,
            message: campaign.message,
            userId: user.id,
            organizationId: user.organizationId,
            campaignId: campaign.id,
          });

          if (result.success) {
            successCount++;
          } else {
            failCount++;
            console.error(`SMS failed for ${customer.phone}:`, result.error);
          }
        } catch (error: any) {
          failCount++;
          console.error(`Failed to send to ${customer.phone}:`, error.message);
        }
      }
    }

    console.log(
      `SMS Campaign ${campaign.id}: ${successCount} sent, ${failCount} failed`
    );

    // Update campaign final status
    await prisma.smsCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        totalRecipients: successCount,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sent: successCount,
        failed: failCount,
        total: customers.length,
      },
    });
  } catch (error: any) {
    console.error("Send SMS campaign error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
