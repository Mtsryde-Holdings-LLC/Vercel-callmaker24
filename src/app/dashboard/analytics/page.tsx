'use client'

import { useState, useEffect } from 'react'
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface AnalyticsData {
  emailStats: {
    totalSent: number
    openRate: number
    clickRate: number
    bounceRate: number
    trend: number[]
  }
  smsStats: {
    totalSent: number
    deliveryRate: number
    responseRate: number
    trend: number[]
  }
  callStats: {
    totalCalls: number
    avgDuration: string
    successRate: number
    trend: number[]
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
  revenueStats: {
    total: number
    growth: number
    byChannel: { channel: string; amount: number }[]
  }
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel')

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

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, dateRange, data: analytics })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-report-${dateRange}days.${format === 'excel' ? 'xlsx' : 'pdf'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export report:', error)
    }
  }

  // Chart configurations
  const emailTrendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Emails Sent',
        data: analytics?.emailStats.trend || [120, 190, 150, 220],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }

  const smsTrendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'SMS Sent',
        data: analytics?.smsStats.trend || [85, 95, 110, 125],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }

  const callTrendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Calls Made',
        data: analytics?.callStats.trend || [45, 52, 48, 60],
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }

  const channelPerformanceData = {
    labels: ['Email', 'SMS', 'Social', 'Calls'],
    datasets: [
      {
        label: 'Performance Score',
        data: [85, 92, 78, 88],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(249, 115, 22, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(168, 85, 247)',
          'rgb(249, 115, 22)'
        ],
        borderWidth: 2
      }
    ]
  }

  const revenueByChannelData = {
    labels: analytics?.revenueStats?.byChannel.map(c => c.channel) || ['Email', 'SMS', 'Calls', 'Social'],
    datasets: [
      {
        data: analytics?.revenueStats?.byChannel.map(c => c.amount) || [45000, 32000, 28000, 15000],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  }

  const customerSegmentData = {
    labels: ['Active', 'New', 'Churned', 'At Risk'],
    datasets: [
      {
        data: [1250, 340, 85, 125],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(251, 191, 36, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const
      }
    }
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
          <p className="text-gray-600 mt-1">Comprehensive performance metrics and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
          <button
            onClick={() => handleExport('excel')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
          >
            <span>📊</span>
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
          >
            <span>📄</span>
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'channels'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📈 Channel Performance
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'customers'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            👥 Customer Analytics
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'revenue'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            💰 Revenue Analysis
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">📧</span>
                <h3 className="text-sm font-medium text-gray-600">Email Campaigns</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{analytics.emailStats.totalSent.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">↑ {analytics.emailStats.openRate}% open rate</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">💬</span>
                <h3 className="text-sm font-medium text-gray-600">SMS Sent</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{analytics.smsStats.totalSent.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">↑ {analytics.smsStats.deliveryRate}% delivered</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">📞</span>
                <h3 className="text-sm font-medium text-gray-600">Total Calls</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{analytics.callStats.totalCalls.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">↑ {analytics.callStats.successRate}% success</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">💰</span>
                <h3 className="text-sm font-medium text-gray-600">Revenue</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">${(analytics.revenueStats.total / 1000).toFixed(0)}K</p>
              <p className="text-sm text-green-600 mt-1">↑ {analytics.revenueStats.growth}% growth</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Campaign Trend</h3>
              <div className="h-64">
                <Line data={emailTrendData} options={chartOptions} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SMS Campaign Trend</h3>
              <div className="h-64">
                <Line data={smsTrendData} options={chartOptions} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Activity</h3>
              <div className="h-64">
                <Line data={callTrendData} options={chartOptions} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Performance</h3>
              <div className="h-64">
                <Bar data={channelPerformanceData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Channel Performance Tab */}
      {activeTab === 'channels' && (
        <div className="space-y-6">
          {/* Email Analytics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">📧</span>
              <h2 className="text-xl font-semibold text-gray-900">Email Campaign Performance</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
            <div className="h-64">
              <Line data={emailTrendData} options={chartOptions} />
            </div>
          </div>

          {/* SMS Analytics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">💬</span>
              <h2 className="text-xl font-semibold text-gray-900">SMS Campaign Performance</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
            <div className="h-64">
              <Line data={smsTrendData} options={chartOptions} />
            </div>
          </div>

          {/* Call Center Analytics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">📞</span>
              <h2 className="text-xl font-semibold text-gray-900">Call Center Performance</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Total Calls</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.callStats.totalCalls.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Avg Duration</p>
                <p className="text-3xl font-bold text-blue-600">{analytics.callStats.avgDuration}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Success Rate</p>
                <p className="text-3xl font-bold text-green-600">{analytics.callStats.successRate.toFixed(1)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${analytics.callStats.successRate}%` }}></div>
                </div>
              </div>
            </div>
            <div className="h-64">
              <Line data={callTrendData} options={chartOptions} />
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
        </div>
      )}

      {/* Customer Analytics Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h3>
              <div className="h-80">
                <Doughnut data={customerSegmentData} options={doughnutOptions} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Stats</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Total Customers</span>
                    <span className="text-2xl font-bold text-gray-900">{analytics.customerStats.total.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">New Customers</span>
                    <span className="text-2xl font-bold text-green-600">{analytics.customerStats.new.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{ width: `${(analytics.customerStats.new / analytics.customerStats.total) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Active Customers</span>
                    <span className="text-2xl font-bold text-blue-600">{analytics.customerStats.active.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${(analytics.customerStats.active / analytics.customerStats.total) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Customer Segments</span>
                    <span className="text-2xl font-bold text-purple-600">{analytics.customerStats.segments}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Analysis Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Channel</h3>
              <div className="h-80">
                <Doughnut data={revenueByChannelData} options={doughnutOptions} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
              <div className="space-y-4">
                {(analytics.revenueStats.byChannel || [
                  { channel: 'Email', amount: 45000 },
                  { channel: 'SMS', amount: 32000 },
                  { channel: 'Calls', amount: 28000 },
                  { channel: 'Social', amount: 15000 }
                ]).map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">{item.channel}</span>
                      <span className="text-lg font-bold text-gray-900">${item.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' : 
                          index === 1 ? 'bg-green-500' : 
                          index === 2 ? 'bg-orange-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${(item.amount / analytics.revenueStats.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">Total Revenue</span>
                    <span className="text-2xl font-bold text-green-600">${analytics.revenueStats.total.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">↑ {analytics.revenueStats.growth}% growth this period</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
