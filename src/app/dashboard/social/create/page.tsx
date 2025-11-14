'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateSocialPostPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    content: '',
    platforms: [] as string[],
    scheduledFor: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const platforms = [
    { id: 'FACEBOOK', name: 'Facebook', icon: '📘' },
    { id: 'INSTAGRAM', name: 'Instagram', icon: '📷' },
    { id: 'TWITTER', name: 'Twitter', icon: '🐦' },
    { id: 'LINKEDIN', name: 'LinkedIn', icon: '💼' },
    { id: 'TIKTOK', name: 'TikTok', icon: '🎵' },
  ]

  const handlePlatformToggle = (platform: string) => {
    setFormData({
      ...formData,
      platforms: formData.platforms.includes(platform)
        ? formData.platforms.filter((p) => p !== platform)
        : [...formData.platforms, platform],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.platforms.length === 0) {
      setError('Please select at least one platform')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to create post')
        setLoading(false)
        return
      }

      const post = await response.json()
      router.push(`/dashboard/social/${post.id}`)
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Social Post</h1>
          <p className="text-gray-600 mt-1">Post to multiple social platforms at once</p>
        </div>
        <Link href="/dashboard/social" className="text-gray-600 hover:text-gray-900">
          ← Back
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Platforms *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => handlePlatformToggle(platform.id)}
                  className={`flex items-center space-x-2 p-4 border-2 rounded-lg transition ${
                    formData.platforms.includes(platform.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{platform.icon}</span>
                  <span className="font-medium">{platform.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Post Content *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Write your post content here..."
            />
            <p className="mt-2 text-sm text-gray-500">
              {formData.content.length} characters
            </p>
          </div>

          <div>
            <label htmlFor="scheduledFor" className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Post (Optional)
            </label>
            <input
              id="scheduledFor"
              name="scheduledFor"
              type="datetime-local"
              value={formData.scheduledFor}
              onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-2 text-sm text-gray-500">
              Leave empty to save as draft, or select a date/time to schedule
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">💡 Social Media Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use relevant hashtags to increase reach</li>
              <li>• Include a call-to-action to drive engagement</li>
              <li>• Consider platform-specific character limits</li>
              <li>• Add emojis to make posts more engaging</li>
              <li>• Post during peak hours for better visibility</li>
            </ul>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <Link
              href="/dashboard/social"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : formData.scheduledFor ? 'Schedule Post' : 'Save as Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
