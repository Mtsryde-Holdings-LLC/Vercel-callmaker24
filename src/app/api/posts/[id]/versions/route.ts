import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createVersionSchema = z.object({
  caption: z.string().min(1),
  hashtags: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string()).optional(),
  mediaDescription: z.string().optional(),
  source: z.enum(['AI_GENERATED', 'USER_EDITED']).default('USER_EDITED'),
});

// POST /api/posts/[id]/versions - Create new version
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    // Verify post exists and belongs to organization
    const post = await prisma.post.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = createVersionSchema.parse(body);

    // Get latest version number
    const latestVersion = await prisma.postVersion.findFirst({
      where: { postId: params.id },
      orderBy: { versionNumber: 'desc' },
    });

    const version = await prisma.postVersion.create({
      data: {
        postId: params.id,
        versionNumber: (latestVersion?.versionNumber || 0) + 1,
        caption: validatedData.caption,
        hashtags: validatedData.hashtags || [],
        mediaUrls: validatedData.mediaUrls || [],
        mediaDescription: validatedData.mediaDescription,
        source: validatedData.source,
        createdByUserId: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log('[Version POST] Created version', version.versionNumber, 'for post:', params.id);

    return NextResponse.json({ version }, { status: 201 });
  } catch (error: any) {
    console.error('[Version POST] Error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create version' },
      { status: 500 }
    );
  }
}
