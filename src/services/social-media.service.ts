import { prisma } from '@/lib/prisma'
import axios from 'axios'

export type SocialPlatform = 'FACEBOOK' | 'INSTAGRAM' | 'TWITTER' | 'LINKEDIN' | 'TIKTOK' | 'YOUTUBE'
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'DELETED'
export type PostType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'STORY' | 'REEL'

interface CreatePostInput {
  platform: SocialPlatform
  postType: PostType
  content: string
  mediaUrls?: string[]
  scheduledFor?: Date
  socialAccountId: string
  userId: string
  organizationId?: string
}

interface SocialAccountInput {
  platform: SocialPlatform
  platformUserId: string
  username: string
  displayName?: string
  profileImage?: string
  accessToken: string
  refreshToken?: string
  tokenExpiresAt?: Date
  userId: string
  organizationId?: string
}

export class SocialMediaService {
  // ============================================
  // SOCIAL ACCOUNT MANAGEMENT
  // ============================================

  static async connectAccount(data: SocialAccountInput) {
    return await prisma.socialAccount.create({
      data: {
        ...data,
        isActive: true,
      },
    })
  }

  static async disconnectAccount(accountId: string) {
    return await prisma.socialAccount.update({
      where: { id: accountId },
      data: { isActive: false },
    })
  }

  static async getSocialAccounts(userId: string, platform?: SocialPlatform) {
    return await prisma.socialAccount.findMany({
      where: {
        userId,
        ...(platform && { platform }),
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async refreshAccessToken(accountId: string) {
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    })

    if (!account || !account.refreshToken) {
      throw new Error('Account not found or no refresh token')
    }

    // Platform-specific token refresh logic
    let newTokenData
    switch (account.platform) {
      case 'FACEBOOK':
      case 'INSTAGRAM':
        newTokenData = await this.refreshFacebookToken(account.refreshToken)
        break
      case 'TWITTER':
        newTokenData = await this.refreshTwitterToken(account.refreshToken)
        break
      case 'LINKEDIN':
        newTokenData = await this.refreshLinkedInToken(account.refreshToken)
        break
      default:
        throw new Error(`Platform ${account.platform} not supported`)
    }

    return await prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        accessToken: newTokenData.accessToken,
        refreshToken: newTokenData.refreshToken || account.refreshToken,
        tokenExpiresAt: newTokenData.expiresAt,
      },
    })
  }

  // ============================================
  // POST MANAGEMENT
  // ============================================

  static async createPost(data: CreatePostInput) {
    const status = data.scheduledFor ? 'SCHEDULED' : 'DRAFT'

    return await prisma.socialPost.create({
      data: {
        ...data,
        status,
      },
    })
  }

  static async updatePost(postId: string, data: Partial<CreatePostInput>) {
    return await prisma.socialPost.update({
      where: { id: postId },
      data,
    })
  }

  static async deletePost(postId: string) {
    return await prisma.socialPost.update({
      where: { id: postId },
      data: { status: 'DELETED' },
    })
  }

  static async getPosts(userId: string, filters?: {
    platform?: SocialPlatform
    status?: PostStatus
    startDate?: Date
    endDate?: Date
  }) {
    return await prisma.socialPost.findMany({
      where: {
        userId,
        ...(filters?.platform && { platform: filters.platform }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.startDate && {
          createdAt: { gte: filters.startDate },
        }),
        ...(filters?.endDate && {
          createdAt: { lte: filters.endDate },
        }),
      },
      include: {
        socialAccount: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async publishPost(postId: string) {
    const post = await prisma.socialPost.findUnique({
      where: { id: postId },
      include: { socialAccount: true },
    })

    if (!post) {
      throw new Error('Post not found')
    }

    try {
      let platformPostId: string
      let platformUrl: string

      switch (post.platform) {
        case 'FACEBOOK':
          ({ platformPostId, platformUrl } = await this.publishToFacebook(post))
          break
        case 'INSTAGRAM':
          ({ platformPostId, platformUrl } = await this.publishToInstagram(post))
          break
        case 'TWITTER':
          ({ platformPostId, platformUrl } = await this.publishToTwitter(post))
          break
        case 'LINKEDIN':
          ({ platformPostId, platformUrl } = await this.publishToLinkedIn(post))
          break
        case 'TIKTOK':
          ({ platformPostId, platformUrl } = await this.publishToTikTok(post))
          break
        default:
          throw new Error(`Platform ${post.platform} not supported`)
      }

      return await prisma.socialPost.update({
        where: { id: postId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          platformPostId,
          platformUrl,
        },
      })
    } catch (error: any) {
      return await prisma.socialPost.update({
        where: { id: postId },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      })
    }
  }

  // ============================================
  // ANALYTICS
  // ============================================

  static async syncPostEngagement(postId: string) {
    const post = await prisma.socialPost.findUnique({
      where: { id: postId },
      include: { socialAccount: true },
    })

    if (!post || !post.platformPostId) {
      throw new Error('Post not found or not published')
    }

    let engagement
    switch (post.platform) {
      case 'FACEBOOK':
        engagement = await this.getFacebookPostEngagement(
          post.platformPostId,
          post.socialAccount.accessToken
        )
        break
      case 'INSTAGRAM':
        engagement = await this.getInstagramPostEngagement(
          post.platformPostId,
          post.socialAccount.accessToken
        )
        break
      case 'TWITTER':
        engagement = await this.getTwitterPostEngagement(
          post.platformPostId,
          post.socialAccount.accessToken
        )
        break
      case 'LINKEDIN':
        engagement = await this.getLinkedInPostEngagement(
          post.platformPostId,
          post.socialAccount.accessToken
        )
        break
      default:
        throw new Error(`Platform ${post.platform} not supported`)
    }

    return await prisma.socialPost.update({
      where: { id: postId },
      data: {
        likes: engagement.likes,
        comments: engagement.comments,
        shares: engagement.shares,
        views: engagement.views,
        clicks: engagement.clicks,
        lastSyncedAt: new Date(),
      },
    })
  }

  static async getAccountAnalytics(accountId: string, startDate: Date, endDate: Date) {
    return await prisma.socialAnalytics.findMany({
      where: {
        socialAccountId: accountId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    })
  }

  static async syncAccountAnalytics(accountId: string) {
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    })

    if (!account) {
      throw new Error('Account not found')
    }

    let analytics
    switch (account.platform) {
      case 'FACEBOOK':
        analytics = await this.getFacebookAnalytics(account.accessToken)
        break
      case 'INSTAGRAM':
        analytics = await this.getInstagramAnalytics(account.accessToken, account.platformUserId)
        break
      case 'TWITTER':
        analytics = await this.getTwitterAnalytics(account.accessToken)
        break
      case 'LINKEDIN':
        analytics = await this.getLinkedInAnalytics(account.accessToken)
        break
      default:
        throw new Error(`Platform ${account.platform} not supported`)
    }

    return await prisma.socialAnalytics.upsert({
      where: {
        socialAccountId_date: {
          socialAccountId: accountId,
          date: new Date(),
        },
      },
      create: {
        socialAccountId: accountId,
        date: new Date(),
        ...analytics,
      },
      update: analytics,
    })
  }

  // ============================================
  // PLATFORM-SPECIFIC PUBLISHING
  // ============================================

  private static async publishToFacebook(post: any) {
    const { socialAccount, content, mediaUrls } = post
    const pageId = socialAccount.platformUserId
    const accessToken = socialAccount.accessToken

    let response
    if (mediaUrls && mediaUrls.length > 0) {
      // Photo/video post
      response = await axios.post(
        `https://graph.facebook.com/v18.0/${pageId}/photos`,
        {
          url: mediaUrls[0],
          caption: content,
          access_token: accessToken,
        }
      )
    } else {
      // Text post
      response = await axios.post(
        `https://graph.facebook.com/v18.0/${pageId}/feed`,
        {
          message: content,
          access_token: accessToken,
        }
      )
    }

    return {
      platformPostId: response.data.id,
      platformUrl: `https://facebook.com/${response.data.id}`,
    }
  }

  private static async publishToInstagram(post: any) {
    const { socialAccount, content, mediaUrls } = post
    const accessToken = socialAccount.accessToken
    const igUserId = socialAccount.platformUserId

    if (!mediaUrls || mediaUrls.length === 0) {
      throw new Error('Instagram posts require media')
    }

    // Create media container
    const containerResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igUserId}/media`,
      {
        image_url: mediaUrls[0],
        caption: content,
        access_token: accessToken,
      }
    )

    // Publish media container
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
      {
        creation_id: containerResponse.data.id,
        access_token: accessToken,
      }
    )

    return {
      platformPostId: publishResponse.data.id,
      platformUrl: `https://instagram.com/p/${publishResponse.data.id}`,
    }
  }

  private static async publishToTwitter(post: any) {
    const { socialAccount, content, mediaUrls } = post
    const accessToken = socialAccount.accessToken

    const response = await axios.post(
      'https://api.twitter.com/2/tweets',
      {
        text: content,
        ...(mediaUrls && mediaUrls.length > 0 && {
          media: { media_ids: mediaUrls },
        }),
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return {
      platformPostId: response.data.data.id,
      platformUrl: `https://twitter.com/i/web/status/${response.data.data.id}`,
    }
  }

  private static async publishToLinkedIn(post: any) {
    const { socialAccount, content, mediaUrls } = post
    const accessToken = socialAccount.accessToken
    const personId = socialAccount.platformUserId

    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: `urn:li:person:${personId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content,
            },
            shareMediaCategory: mediaUrls && mediaUrls.length > 0 ? 'IMAGE' : 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return {
      platformPostId: response.data.id,
      platformUrl: `https://linkedin.com/feed/update/${response.data.id}`,
    }
  }

  private static async publishToTikTok(post: any) {
    // TikTok API implementation
    throw new Error('TikTok publishing not yet implemented')
  }

  // ============================================
  // TOKEN REFRESH
  // ============================================

  private static async refreshFacebookToken(refreshToken: string) {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token`,
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          fb_exchange_token: refreshToken,
        },
      }
    )

    return {
      accessToken: response.data.access_token,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
    }
  }

  private static async refreshTwitterToken(refreshToken: string) {
    const response = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        client_id: process.env.TWITTER_CLIENT_ID!,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
    }
  }

  private static async refreshLinkedInToken(refreshToken: string) {
    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      })
    )

    return {
      accessToken: response.data.access_token,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
    }
  }

  // ============================================
  // ENGAGEMENT METRICS
  // ============================================

  private static async getFacebookPostEngagement(postId: string, accessToken: string) {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${postId}`,
      {
        params: {
          fields: 'likes.summary(true),comments.summary(true),shares',
          access_token: accessToken,
        },
      }
    )

    return {
      likes: response.data.likes?.summary?.total_count || 0,
      comments: response.data.comments?.summary?.total_count || 0,
      shares: response.data.shares?.count || 0,
      views: 0,
      clicks: 0,
    }
  }

  private static async getInstagramPostEngagement(postId: string, accessToken: string) {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${postId}`,
      {
        params: {
          fields: 'like_count,comments_count',
          access_token: accessToken,
        },
      }
    )

    return {
      likes: response.data.like_count || 0,
      comments: response.data.comments_count || 0,
      shares: 0,
      views: 0,
      clicks: 0,
    }
  }

  private static async getTwitterPostEngagement(postId: string, accessToken: string) {
    const response = await axios.get(
      `https://api.twitter.com/2/tweets/${postId}`,
      {
        params: {
          'tweet.fields': 'public_metrics',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    const metrics = response.data.data.public_metrics
    return {
      likes: metrics.like_count || 0,
      comments: metrics.reply_count || 0,
      shares: metrics.retweet_count || 0,
      views: metrics.impression_count || 0,
      clicks: 0,
    }
  }

  private static async getLinkedInPostEngagement(postId: string, accessToken: string) {
    const response = await axios.get(
      `https://api.linkedin.com/v2/socialActions/${postId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    return {
      likes: response.data.likesSummary?.totalLikes || 0,
      comments: response.data.commentsSummary?.totalComments || 0,
      shares: response.data.sharesSummary?.totalShares || 0,
      views: 0,
      clicks: 0,
    }
  }

  // ============================================
  // ACCOUNT ANALYTICS
  // ============================================

  private static async getFacebookAnalytics(accessToken: string) {
    // Implement Facebook Insights API
    return {
      followers: 0,
      following: 0,
      posts: 0,
      impressions: 0,
      reach: 0,
      engagement: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      profileViews: 0,
      websiteClicks: 0,
    }
  }

  private static async getInstagramAnalytics(accessToken: string, userId: string) {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${userId}/insights`,
      {
        params: {
          metric: 'impressions,reach,follower_count,profile_views',
          period: 'day',
          access_token: accessToken,
        },
      }
    )

    // Parse and return analytics
    return {
      followers: 0,
      following: 0,
      posts: 0,
      impressions: 0,
      reach: 0,
      engagement: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      profileViews: 0,
      websiteClicks: 0,
    }
  }

  private static async getTwitterAnalytics(accessToken: string) {
    // Implement Twitter Analytics API
    return {
      followers: 0,
      following: 0,
      posts: 0,
      impressions: 0,
      reach: 0,
      engagement: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      profileViews: 0,
      websiteClicks: 0,
    }
  }

  private static async getLinkedInAnalytics(accessToken: string) {
    // Implement LinkedIn Analytics API
    return {
      followers: 0,
      following: 0,
      posts: 0,
      impressions: 0,
      reach: 0,
      engagement: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      profileViews: 0,
      websiteClicks: 0,
    }
  }
}
