import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SocialMediaService } from '@/services/social-media.service'

// GET /api/social/posts - Get all posts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.organizationId) {
      return NextResponse.json({ error: 'No organization assigned' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const platform = searchParams.get('platform') as any
    const status = searchParams.get('status') as any
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const posts = await SocialMediaService.getPosts(session.user.id, {
      platform,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    })

    return NextResponse.json({ posts })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST /api/social/posts - Create a new post
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      platform,
      postType,
      content,
      mediaUrls,
      scheduledFor,
      socialAccountId,
    } = body

    if (!platform || !content || !socialAccountId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const post = await SocialMediaService.createPost({
      platform,
      postType: postType || 'TEXT',
      content,
      mediaUrls: mediaUrls || [],
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      socialAccountId,
      userId: session.user.id,
    })

    // Auto-publish if no schedule is set
    if (!scheduledFor) {
      await SocialMediaService.publishPost(post.id)
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create post' },
      { status: 500 }
    )
  }
}
