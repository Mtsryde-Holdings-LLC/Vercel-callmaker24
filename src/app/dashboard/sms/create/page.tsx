'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateSmsCampaignPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    scheduledFor: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [charCount, setCharCount] = useState(0)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (name === 'message') {
      setCharCount(value.length)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/sms/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to create campaign')
        setLoading(false)
        return
      }

      const campaign = await response.json()
      router.push(`/dashboard/sms/${campaign.id}`)
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const messageCount = Math.ceil(charCount / 160)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create SMS Campaign</h1>
          <p className="text-gray-600 mt-1">Send text messages to your customers</p>
        </div>
        <Link href="/dashboard/sms" className="text-gray-600 hover:text-gray-900">
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Flash Sale Alert"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your SMS message here..."
            />
            <div className="flex justify-between items-center mt-2 text-sm">
              <span className={charCount > 160 ? 'text-orange-600' : 'text-gray-500'}>
                {charCount} characters • {messageCount} message{messageCount !== 1 ? 's' : ''}
              </span>
              {charCount > 160 && (
                <span className="text-orange-600">
                  ⚠️ Messages over 160 characters may be split
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="scheduledFor" className="block text-sm font-medium text-gray-700 mb-2">
              Send Date & Time (Optional)
            </label>
            <input
              id="scheduledFor"
              name="scheduledFor"
              type="datetime-local"
              value={formData.scheduledFor}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-2 text-sm text-gray-500">
              Leave empty to save as draft, or select a date/time to schedule
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">📱 SMS Best Practices</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Keep messages concise and actionable</li>
              <li>• Include a clear call-to-action</li>
              <li>• Avoid excessive punctuation and ALL CAPS</li>
              <li>• Always include opt-out instructions</li>
              <li>• Respect time zones when scheduling</li>
            </ul>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <Link
              href="/dashboard/sms"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : formData.scheduledFor ? 'Schedule Campaign' : 'Save as Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
