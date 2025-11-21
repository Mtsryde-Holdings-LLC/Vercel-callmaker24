'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

export default function AnalyticsPage() {
  const { backgroundColor } = useTheme()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEmails: 0,
    totalSMS: 0,
    totalCalls: 0,
    totalCustomers: 0,
    emailOpenRate: 0,
    smsDeliveryRate: 0,
    callSuccessRate: 0
  })

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6" style={{backgroundColor}}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your marketing performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Emails</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEmails}</p>
              <p className="text-sm text-green-600 mt-1">{stats.emailOpenRate}% open rate</p>
            </div>
            <div className="text-4xl">📧</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total SMS</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalSMS}</p>
              <p className="text-sm text-green-600 mt-1">{stats.smsDeliveryRate}% delivered</p>
            </div>
            <div className="text-4xl">💬</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Calls</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCalls}</p>
              <p className="text-sm text-green-600 mt-1">{stats.callSuccessRate}% success</p>
            </div>
            <div className="text-4xl">☎️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCustomers}</p>
              <p className="text-sm text-gray-600 mt-1">Active contacts</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Performance</h2>
        <div className="text-center text-gray-500 py-8">
          Detailed analytics coming soon
        </div>
      </div>
    </div>
  )
}
