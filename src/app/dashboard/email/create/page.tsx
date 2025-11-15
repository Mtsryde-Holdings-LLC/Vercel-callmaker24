'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateEmailCampaignPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    fromName: '',
    fromEmail: '',
    replyTo: '',
    preheader: '',
    content: '',
    scheduledFor: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      setError('Please enter a prompt for the AI')
      return
    }

    setAiLoading(true)
    setError('')

    try {
      const response = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: aiPrompt,
          subject: formData.subject,
          campaignName: formData.name 
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to generate content')
        setAiLoading(false)
        return
      }

      const data = await response.json()
      setFormData({ ...formData, content: data.content })
      setAiPrompt('')
      setShowAiPanel(false)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/email/campaigns', {
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
      router.push(`/dashboard/email/${campaign.id}`)
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Email Campaign</h1>
          <p className="text-gray-600 mt-1">Design and send email marketing campaigns</p>
        </div>
        <Link href="/dashboard/email" className="text-gray-600 hover:text-gray-900">
          ← Back
        </Link>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h2>
            <div className="space-y-4">
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
                  placeholder="e.g., Summer Sale 2024"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject *
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Get 50% off summer essentials!"
                />
              </div>

              <div>
                <label htmlFor="preheader" className="block text-sm font-medium text-gray-700 mb-2">
                  Preheader Text
                </label>
                <input
                  id="preheader"
                  name="preheader"
                  type="text"
                  value={formData.preheader}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Preview text that appears after the subject line"
                />
              </div>
            </div>
          </div>

          {/* Sender Information */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sender Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fromName" className="block text-sm font-medium text-gray-700 mb-2">
                  From Name *
                </label>
                <input
                  id="fromName"
                  name="fromName"
                  type="text"
                  value={formData.fromName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Your Company"
                />
              </div>

              <div>
                <label htmlFor="fromEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  From Email *
                </label>
                <input
                  id="fromEmail"
                  name="fromEmail"
                  type="email"
                  value={formData.fromEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="hello@yourcompany.com"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="replyTo" className="block text-sm font-medium text-gray-700 mb-2">
                  Reply-To Email
                </label>
                <input
                  id="replyTo"
                  name="replyTo"
                  type="email"
                  value={formData.replyTo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="support@yourcompany.com"
                />
              </div>
            </div>
          </div>

          {/* Email Content */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Email Content</h2>
              <button
                type="button"
                onClick={() => setShowAiPanel(!showAiPanel)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition"
              >
                <span className="mr-2">✨</span>
                AI Write
              </button>
            </div>

            {/* AI Writing Panel */}
            {showAiPanel && (
              <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">AI Email Generator</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Describe your email campaign and let AI craft professional content for you
                </p>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3"
                  placeholder="Example: Write a promotional email for our summer sale with 50% off all products. Emphasize limited time offer and include a friendly, exciting tone..."
                />
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">✨</span>
                        Generate Email
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAiPanel(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Email Body *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                placeholder="Enter your email content here (HTML supported)..."
              />
              <p className="mt-2 text-sm text-gray-500">
                You can use HTML to format your email content or use AI to generate it
              </p>
            </div>
          </div>

          {/* Scheduling */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h2>
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
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <Link
              href="/dashboard/email"
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
