'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SocialPostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPost()
  }, [params.id])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/social/posts/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data)
      }
    } catch (error) {
      console.error('Failed to fetch post:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      FACEBOOK: '📘',
      INSTAGRAM: '📷',
      TWITTER: '🐦',
      LINKEDIN: '💼',
      TIKTOK: '🎵',
      YOUTUBE: '📹',
    }
    return icons[platform] || '📱'
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  if (!post) {
    return <div className="p-6">Post not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Social Media Post</h1>
          <p className="text-gray-600 mt-1">Post Details</p>
        </div>
        <Link href="/dashboard/social" className="text-blue-600 hover:text-blue-700">
          ← Back to Social
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-600">Platforms</label>
          <div className="flex items-center space-x-2 mt-1">
            {post.platforms?.map((platform: string) => (
              <span key={platform} className="text-2xl">
                {getPlatformIcon(platform)}
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Status</label>
          <p className="text-gray-900">{post.status}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Content</label>
          <p className="text-gray-900 bg-gray-50 p-4 rounded whitespace-pre-wrap">{post.content}</p>
        </div>
        {post.scheduledFor && (
          <div>
            <label className="text-sm font-medium text-gray-600">Scheduled For</label>
            <p className="text-gray-900">{new Date(post.scheduledFor).toLocaleString()}</p>
          </div>
        )}
        {post.publishedAt && (
          <div>
            <label className="text-sm font-medium text-gray-600">Published At</label>
            <p className="text-gray-900">{new Date(post.publishedAt).toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  )
}
