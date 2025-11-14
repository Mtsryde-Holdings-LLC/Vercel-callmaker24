'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Stats {
  customers: number
  emailCampaigns: number
  smsCampaigns: number
  socialAccounts: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats>({
    customers: 0,
    emailCampaigns: 0,
    smsCampaigns: 0,
    socialAccounts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { name: 'Total Customers', value: stats.customers, icon: '👥', color: 'bg-blue-500', href: '/dashboard/customers' },
    { name: 'Email Campaigns', value: stats.emailCampaigns, icon: '📧', color: 'bg-green-500', href: '/dashboard/email' },
    { name: 'SMS Campaigns', value: stats.smsCampaigns, icon: '💬', color: 'bg-purple-500', href: '/dashboard/sms' },
    { name: 'Social Accounts', value: stats.socialAccounts, icon: '📱', color: 'bg-pink-500', href: '/dashboard/social' },
  ]

  const quickActions = [
    { name: 'Create Email Campaign', href: '/dashboard/email/create', icon: '📧', color: 'bg-green-500' },
    { name: 'Send SMS', href: '/dashboard/sms/create', icon: '💬', color: 'bg-purple-500' },
    { name: 'Schedule Social Post', href: '/dashboard/social/create', icon: '📱', color: 'bg-pink-500' },
    { name: 'Add Customer', href: '/dashboard/customers/create', icon: '👤', color: 'bg-blue-500' },
  ]

  const recentActivity = [
    { type: 'email', message: 'Email campaign "Summer Sale" sent to 1,250 contacts', time: '2 hours ago' },
    { type: 'sms', message: 'SMS campaign "Flash Deal" delivered to 500 customers', time: '4 hours ago' },
    { type: 'social', message: 'Posted to Facebook and Instagram', time: '6 hours ago' },
    { type: 'customer', message: '15 new customers added', time: '1 day ago' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {session?.user?.name || 'User'}! 👋
        </h1>
        <p className="text-primary-100">
          Here's what's happening with your marketing campaigns today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Link
            key={card.name}
            href={card.href}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{card.name}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : card.value}
                </p>
              </div>
              <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
                {card.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
            >
              <div className={`${action.color} w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-3`}>
                {action.icon}
              </div>
              <span className="font-medium text-gray-900">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary-500"></div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/analytics"
            className="block mt-4 text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all activity →
          </Link>
        </div>

        {/* Campaign Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Campaign Performance</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Email Open Rate</span>
                <span className="font-semibold text-gray-900">24.5%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '24.5%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">SMS Delivery Rate</span>
                <span className="font-semibold text-gray-900">98.2%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '98.2%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Social Engagement</span>
                <span className="font-semibold text-gray-900">12.8%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-pink-500 h-2 rounded-full" style={{ width: '12.8%' }}></div>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/analytics"
            className="block mt-4 text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View detailed analytics →
          </Link>
        </div>
      </div>
    </div>
  )
}
