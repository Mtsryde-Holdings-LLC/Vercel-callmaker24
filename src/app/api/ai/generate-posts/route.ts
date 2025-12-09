import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { aiService } from '@/lib/ai-service';
import { z } from 'zod';

const generatePostsSchema = z.object({
  brandId: z.string(),
  platforms: z.array(z.enum(['INSTAGRAM', 'FACEBOOK', 'TWITTER_X', 'LINKEDIN', 'TIKTOK', 'YOUTUBE_SHORTS', 'OTHER'])),
  goal: z.string(),
  contentPillar: z.string().optional(),
  productInfo: z.string().optional(),
  campaignTheme: z.string().optional(),
  numberOfVariations: z.number().min(1).max(10).default(3),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = generatePostsSchema.parse(body);

    // Get user and verify access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    // Get brand and verify ownership
    const brand = await prisma.brand.findFirst({
      where: {
        id: validatedData.brandId,
        organizationId: user.organizationId,
      },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    console.log('[AI Generate] Starting generation for brand:', brand.name);

    // Generate posts for each platform
    const allPosts = [];

    for (const platform of validatedData.platforms) {
      try {
        const posts = await aiService.generatePosts({
          brandContext: {
            name: brand.name,
            voice: brand.brandVoice,
            targetAudience: brand.targetAudience || 'General audience',
            description: brand.description || '',
          },
          platform,
          goal: validatedData.goal,
          contentPillar: validatedData.contentPillar,
          productInfo: validatedData.productInfo,
          campaignTheme: validatedData.campaignTheme,
          numberOfVariations: validatedData.numberOfVariations,
        });

        // Create Post records in database
        for (const postData of posts) {
          const post = await prisma.post.create({
            data: {
              organizationId: user.organizationId,
              brandId: brand.id,
              platform,
              title: postData.caption.substring(0, 100) + '...',
              contentType: postData.contentType || 'SINGLE_POST',
              status: 'DRAFT',
              aiPromptUsed: JSON.stringify({
                goal: validatedData.goal,
                contentPillar: validatedData.contentPillar,
                productInfo: validatedData.productInfo,
                campaignTheme: validatedData.campaignTheme,
              }),
              createdByUserId: session.user.id,
              updatedByUserId: session.user.id,
            },
          });

          // Create initial version
          await prisma.postVersion.create({
            data: {
              postId: post.id,
              caption: postData.caption,
              hashtags: postData.hashtags || [],
              mediaDescription: postData.mediaDescription,
              createdByUserId: session.user.id,
              source: 'AI_GENERATED',
            },
          });

          allPosts.push({
            ...post,
            latestVersion: {
              caption: postData.caption,
              hashtags: postData.hashtags,
              mediaDescription: postData.mediaDescription,
            },
          });
        }
      } catch (error: any) {
        console.error(`[AI Generate] Error for platform ${platform}:`, error);
        // Continue with other platforms even if one fails
      }
    }

    console.log('[AI Generate] Created', allPosts.length, 'posts');

    return NextResponse.json({
      success: true,
      posts: allPosts,
      message: `Generated ${allPosts.length} post variations across ${validatedData.platforms.length} platforms`,
    });
  } catch (error: any) {
    console.error('[AI Generate] Error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate posts' },
      { status: 500 }
    );
  }
}
