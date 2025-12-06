'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SocialPostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    fetchPost()
  }, [params.id])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/social/posts/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data)
        setFormData(data)
      }
    } catch (error) {
      console.error('Failed to fetch post:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePost = async () => {
    try {
      const response = await fetch(`/api/social/posts/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        alert('✅ Post updated!')
        setEditing(false)
        fetchPost()
      }
    } catch (error) {
      alert('❌ Failed to update post')
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
        <div className="flex gap-3">
          {!editing && (post.status === 'DRAFT' || post.status === 'SCHEDULED') && (
            <button onClick={() => setEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Edit
            </button>
          )}
          <Link href="/dashboard/social" className="text-blue-600 hover:text-blue-700">
            ← Back
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        {editing ? (
          <>
            <div>
              <label className="text-sm font-medium text-gray-600">Content</label>
              <textarea
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border rounded-lg mt-1"
                placeholder="What's on your mind?"
              />
            </div>
            {formData.scheduledFor && (
              <div>
                <label className="text-sm font-medium text-gray-600">Scheduled For</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledFor ? new Date(formData.scheduledFor).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, scheduledFor: new Date(e.target.value).toISOString() })}
                  className="w-full px-4 py-2 border rounded-lg mt-1"
                />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={savePost} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Save
              </button>
              <button onClick={() => { setEditing(false); setFormData(post) }} className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium text-gray-600">Platform</label>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-2xl">{getPlatformIcon(post.platform)}</span>
                <span className="text-gray-900">{post.platform}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <p className="text-gray-900">{post.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Content Preview</label>
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
          </>
        )}
      </div>
    </div>
  )
}
