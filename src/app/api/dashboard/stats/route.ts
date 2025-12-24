import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";
const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: "No organization assigned" },
        { status: 403 }
      );
    }

    // Fetch stats filtered by organization
    const [customers, emailCampaigns, smsCampaigns, socialPosts] =
      await Promise.all([
        prisma.customer.count({
          where: { organizationId: user.organizationId },
        }),
        prisma.emailCampaign.count({
          where: { organizationId: user.organizationId },
        }),
        prisma.smsCampaign.count({
          where: { organizationId: user.organizationId },
        }),
        prisma.post.count({
          where: { organizationId: user.organizationId },
        }),
      ]);

    return NextResponse.json({
      customers,
      emailCampaigns,
      smsCampaigns,
      socialAccounts: socialPosts, // Use posts count for social accounts stat
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
