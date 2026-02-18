import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const GET = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, requestId }: ApiContext,
  ) => {
    const posts = await prisma.socialPost.findMany({
      where: { userId: session.user.id, organizationId },
      include: { socialAccount: true },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ posts }, { requestId });
  },
  { route: "GET /api/social/posts" },
);

export const POST = withApiHandler(
  async (
    request: NextRequest,
    { session, organizationId, requestId }: ApiContext,
  ) => {
    const formData = await request.formData();
    const content = formData.get("content") as string;
    const platforms = JSON.parse(formData.get("platforms") as string);
    const scheduleType = formData.get("scheduleType") as string;
    const scheduledFor = formData.get("scheduledFor") as string;

    for (const accountId of platforms) {
      const account = await prisma.socialAccount.findFirst({
        where: { id: accountId, userId: session.user.id },
      });

      if (!account) continue;

      await prisma.socialPost.create({
        data: {
          content,
          platform: account.platform,
          socialAccountId: accountId,
          userId: session.user.id,
          organizationId,
          status: scheduleType === "now" ? "PUBLISHED" : "SCHEDULED",
          scheduledFor:
            scheduleType === "schedule" ? new Date(scheduledFor) : null,
          publishedAt: scheduleType === "now" ? new Date() : null,
        },
      });

      if (scheduleType === "now") {
        await publishToSocial(account, content);
      }
    }

    return apiSuccess({ success: true }, { requestId });
  },
  { route: "POST /api/social/posts" },
);

async function publishToSocial(account: any, content: string) {
  try {
    if (account.platform === "FACEBOOK") {
      await fetch(
        `https://graph.facebook.com/v18.0/${account.platformUserId}/feed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            access_token: account.accessToken,
          }),
        },
      );
    } else if (account.platform === "TWITTER") {
      await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: content }),
      });
    } else if (account.platform === "LINKEDIN") {
      await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          author: `urn:li:person:${account.platformUserId}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: content },
              shareMediaCategory: "NONE",
            },
          },
          visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        }),
      });
    } else if (account.platform === "INSTAGRAM") {
      await fetch(
        `https://graph.instagram.com/v18.0/${account.platformUserId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caption: content,
            access_token: account.accessToken,
          }),
        },
      );
    } else if (account.platform === "TIKTOK") {
      await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_info: {
            title: content,
            privacy_level: "PUBLIC_TO_EVERYONE",
          },
        }),
      });
    }
  } catch (error) {
    logger.error(
      "Social publish error",
      { route: "POST /api/social/posts", platform: account.platform },
      error as Error,
    );
  }
}
