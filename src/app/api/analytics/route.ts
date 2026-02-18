import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Generate mock date labels for the requested period
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(
        date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      );
    }

    // Generate realistic mock data with variation
    const generateTrendData = (base: number, variance: number) => {
      return Array.from({ length: days }, () =>
        Math.floor(base + (Math.random() * variance - variance / 2)),
      );
    };

    // Return comprehensive analytics data matching the page structure
    return apiSuccess(
      {
        emailStats: {
          totalSent: 15847,
          openRate: 24.8,
          clickRate: 3.2,
          bounceRate: 1.4,
        },
        smsStats: {
          totalSent: 8934,
          deliveryRate: 98.7,
          responseRate: 12.5,
        },
        callStats: {
          totalCalls: 3456,
          avgDuration: 8.3,
          successRate: 76.4,
          missedCalls: 234,
        },
        chatStats: {
          totalChats: 2187,
          avgResponseTime: 2.4,
          satisfactionRate: 91.3,
          resolvedRate: 88.7,
        },
        socialStats: {
          totalPosts: 1245,
          totalEngagement: 48920,
          avgEngagementRate: 8.7,
          followers: 25430,
          platforms: {
            facebook: { posts: 312, engagement: 12450, followers: 8920 },
            twitter: { posts: 428, engagement: 18320, followers: 12100 },
            instagram: { posts: 298, engagement: 14820, followers: 9450 },
            linkedin: { posts: 207, engagement: 3330, followers: 4960 },
          },
        },
        ivrStats: {
          totalCalls: 8765,
          completedFlows: 7234,
          avgDuration: 3.2,
          completionRate: 82.5,
          dropoffRate: 17.5,
          topMenuOptions: [
            { option: "Sales", count: 3210, percentage: 36.6 },
            { option: "Support", count: 2890, percentage: 33.0 },
            { option: "Billing", count: 1654, percentage: 18.9 },
            { option: "Other", count: 1011, percentage: 11.5 },
          ],
        },
        chatbotStats: {
          totalConversations: 5432,
          avgResponseTime: 1.8,
          resolutionRate: 85.3,
          humanHandoffRate: 14.7,
          avgMessagesPerSession: 8.4,
          topIntents: [
            { intent: "Product Info", count: 1876, percentage: 34.5 },
            { intent: "Order Status", count: 1354, percentage: 24.9 },
            { intent: "Technical Support", count: 987, percentage: 18.2 },
            { intent: "Pricing", count: 765, percentage: 14.1 },
            { intent: "Other", count: 450, percentage: 8.3 },
          ],
        },
        trends: {
          dates: dates,
          emailVolume: generateTrendData(500, 200),
          smsVolume: generateTrendData(300, 150),
          callVolume: generateTrendData(120, 50),
          socialEngagement: generateTrendData(1600, 400),
          ivrCalls: generateTrendData(290, 80),
          chatbotConversations: generateTrendData(180, 60),
        },
        revenue: {
          total: 487650,
          byChannel: {
            email: 185000,
            sms: 124300,
            calls: 156200,
            chat: 22150,
          },
        },
        customers: {
          total: 12847,
          active: 9635,
          new: 437,
          segments: [
            { label: "Enterprise", count: 1250 },
            { label: "SMB", count: 4580 },
            { label: "Startup", count: 3240 },
            { label: "Individual", count: 2890 },
            { label: "Non-Profit", count: 887 },
          ],
        },
      },
      { requestId },
    );
  },
  {
    route: "GET /api/analytics",
    rateLimit: RATE_LIMITS.standard,
  },
);
