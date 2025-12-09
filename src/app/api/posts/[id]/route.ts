import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(['IDEA', 'DRAFT', 'APPROVED', 'SCHEDULED', 'POSTED', 'ARCHIVED']).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  postedAt: z.string().datetime().optional().nullable(),
});

const createVersionSchema = z.object({
  caption: z.string().min(1),
  hashtags: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string()).optional(),
  mediaDescription: z.string().optional(),
  source: z.enum(['AI_GENERATED', 'USER_EDITED']).default('USER_EDITED'),
});

// GET /api/posts/[id] - Get single post
export async function GET(
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

    const post = await prisma.post.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
      include: {
        brand: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        performance: {
          orderBy: { recordedAt: 'desc' },
        },
        reminders: {
          where: { status: 'PENDING' },
          orderBy: { scheduledSendAt: 'asc' },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error: any) {
    console.error('[Post GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PATCH /api/posts/[id] - Update post
export async function PATCH(
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
    const existingPost = await prisma.post.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = updatePostSchema.parse(body);

    // If marking as POSTED, set postedAt
    if (validatedData.status === 'POSTED' && !validatedData.postedAt) {
      validatedData.postedAt = new Date().toISOString();
    }

    const post = await prisma.post.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updatedByUserId: session.user.id,
      },
      include: {
        brand: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    console.log('[Post PATCH] Updated post:', post.title, 'Status:', post.status);

    return NextResponse.json({ post });
  } catch (error: any) {
    console.error('[Post PATCH] Error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - Delete post
export async function DELETE(
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
    const existingPost = await prisma.post.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Delete all related data (cascade)
    await prisma.post.delete({
      where: { id: params.id },
    });

    console.log('[Post DELETE] Deleted post:', existingPost.title);

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error: any) {
    console.error('[Post DELETE] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete post' },
      { status: 500 }
    );
  }
}
