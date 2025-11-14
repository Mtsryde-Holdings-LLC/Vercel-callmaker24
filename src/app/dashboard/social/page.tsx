'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SocialAccount {
  id: string
  platform: string
  accountName: string
  isActive: boolean
}

interface SocialPost {
  id: string
  content: string
  platforms: string[]
  status: string
  scheduledFor?: string
  publishedAt?: string
}

export default function SocialMediaPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [accountsRes, postsRes] = await Promise.all([
        fetch('/api/social/accounts'),
        fetch('/api/social/posts'),
      ])

      if (accountsRes.ok) setAccounts(await accountsRes.json())
      if (postsRes.ok) setPosts(await postsRes.json())
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return

    try {
      const response = await fetch(`/api/social/accounts/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setAccounts(accounts.filter((a) => a.id !== id))
      }
    } catch (error) {
      console.error('Failed to disconnect account:', error)
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

  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
    }
    return styles[status as keyof typeof styles] || styles.DRAFT
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Social Media Management</h1>
          <p className="text-gray-600 mt-1">Manage your social media presence across platforms</p>
        </div>
        <Link
          href="/dashboard/social/create"
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
        >
          + Create Post
        </Link>
      </div>

      {/* Connected Accounts */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Connected Accounts</h2>
          <Link
            href="/dashboard/social/connect"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            + Connect Account
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No accounts connected. Connect your first social media account to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <div key={account.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getPlatformIcon(account.platform)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{account.accountName}</p>
                      <p className="text-xs text-gray-500">{account.platform}</p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
                <button
                  onClick={() => handleDisconnect(account.id)}
                  className="w-full mt-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition"
                >
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Posts */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Posts</h2>

        {posts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No posts yet. Create your first social media post!
          </div>
        ) : (
          <div className="space-y-4">
            {posts.slice(0, 5).map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {post.platforms.map((platform) => (
                        <span key={platform} className="text-lg">
                          {getPlatformIcon(platform)}
                        </span>
                      ))}
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(post.status)}`}>
                        {post.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                    <p className="text-xs text-gray-500">
                      {post.publishedAt
                        ? `Published ${new Date(post.publishedAt).toLocaleString()}`
                        : post.scheduledFor
                        ? `Scheduled for ${new Date(post.scheduledFor).toLocaleString()}`
                        : 'Draft'}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/social/${post.id}`}
                    className="ml-4 text-sm text-primary-600 hover:text-primary-700"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {posts.length > 5 && (
          <Link
            href="/dashboard/social/posts"
            className="block mt-4 text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all posts →
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600">Connected Accounts</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{accounts.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600">Total Posts</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{posts.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600">Scheduled</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {posts.filter((p) => p.status === 'SCHEDULED').length}
          </p>
        </div>
      </div>
    </div>
  )
}
