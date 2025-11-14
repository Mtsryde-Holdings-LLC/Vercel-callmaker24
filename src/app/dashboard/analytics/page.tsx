'use client'

import { useState, useEffect } from 'react'

interface AnalyticsData {
  emailStats: {
    totalSent: number
    openRate: number
    clickRate: number
    bounceRate: number
  }
  smsStats: {
    totalSent: number
    deliveryRate: number
    responseRate: number
  }
  socialStats: {
    totalPosts: number
    totalEngagement: number
    avgEngagementRate: number
  }
  customerStats: {
    total: number
    new: number
    active: number
    segments: number
  }
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?days=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Track performance across all channels</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Email Analytics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">📧</span>
          <h2 className="text-xl font-semibold text-gray-900">Email Campaign Performance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Total Sent</p>
            <p className="text-3xl font-bold text-gray-900">{analytics.emailStats.totalSent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Open Rate</p>
            <p className="text-3xl font-bold text-green-600">{analytics.emailStats.openRate.toFixed(1)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${analytics.emailStats.openRate}%` }}></div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Click Rate</p>
            <p className="text-3xl font-bold text-blue-600">{analytics.emailStats.clickRate.toFixed(1)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${analytics.emailStats.clickRate}%` }}></div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Bounce Rate</p>
            <p className="text-3xl font-bold text-red-600">{analytics.emailStats.bounceRate.toFixed(1)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: `${analytics.emailStats.bounceRate}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* SMS Analytics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">💬</span>
          <h2 className="text-xl font-semibold text-gray-900">SMS Campaign Performance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Total Sent</p>
            <p className="text-3xl font-bold text-gray-900">{analytics.smsStats.totalSent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Delivery Rate</p>
            <p className="text-3xl font-bold text-green-600">{analytics.smsStats.deliveryRate.toFixed(1)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${analytics.smsStats.deliveryRate}%` }}></div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Response Rate</p>
            <p className="text-3xl font-bold text-blue-600">{analytics.smsStats.responseRate.toFixed(1)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${analytics.smsStats.responseRate}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Media Analytics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">📱</span>
          <h2 className="text-xl font-semibold text-gray-900">Social Media Performance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Total Posts</p>
            <p className="text-3xl font-bold text-gray-900">{analytics.socialStats.totalPosts.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Total Engagement</p>
            <p className="text-3xl font-bold text-purple-600">{analytics.socialStats.totalEngagement.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Avg. Engagement Rate</p>
            <p className="text-3xl font-bold text-pink-600">{analytics.socialStats.avgEngagementRate.toFixed(1)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-pink-500 h-2 rounded-full" style={{ width: `${analytics.socialStats.avgEngagementRate}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Analytics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">👥</span>
          <h2 className="text-xl font-semibold text-gray-900">Customer Insights</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Total Customers</p>
            <p className="text-3xl font-bold text-gray-900">{analytics.customerStats.total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">New Customers</p>
            <p className="text-3xl font-bold text-green-600">{analytics.customerStats.new.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Active Customers</p>
            <p className="text-3xl font-bold text-blue-600">{analytics.customerStats.active.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Segments</p>
            <p className="text-3xl font-bold text-purple-600">{analytics.customerStats.segments}</p>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
          📊 Export Report
        </button>
      </div>
    </div>
  )
}
