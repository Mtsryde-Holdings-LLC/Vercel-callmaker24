import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { SocialMediaService } from "@/services/social-media.service";

// POST /api/social/posts/[id]/publish - Publish a post immediately
export const POST = withApiHandler(
  async (request: NextRequest, { session, requestId, params }: ApiContext) => {
    const post = await SocialMediaService.publishPost(params.id);

    return apiSuccess({ post }, { requestId });
  },
  { route: "POST /api/social/posts/[id]/publish" },
);
