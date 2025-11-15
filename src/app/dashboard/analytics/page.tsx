'use client';

import { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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
  Filler,
} from 'chart.js';

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
);

interface AnalyticsData {
  emailStats: {
    totalSent: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
  smsStats: {
    totalSent: number;
    deliveryRate: number;
    responseRate: number;
  };
  callStats: {
    totalCalls: number;
    avgDuration: number;
    successRate: number;
    missedCalls: number;
  };
  chatStats: {
    totalChats: number;
    avgResponseTime: number;
    satisfactionRate: number;
    resolvedRate: number;
  };
  socialStats: {
    totalPosts: number;
    totalEngagement: number;
    avgEngagementRate: number;
    followers: number;
    platforms: {
      facebook: { posts: number; engagement: number; followers: number };
      twitter: { posts: number; engagement: number; followers: number };
      instagram: { posts: number; engagement: number; followers: number };
      linkedin: { posts: number; engagement: number; followers: number };
    };
  };
  ivrStats: {
    totalCalls: number;
    completedFlows: number;
    avgDuration: number;
    completionRate: number;
    dropoffRate: number;
    topMenuOptions: Array<{ option: string; count: number; percentage: number }>;
  };
  chatbotStats: {
    totalConversations: number;
    avgResponseTime: number;
    resolutionRate: number;
    humanHandoffRate: number;
    avgMessagesPerSession: number;
    topIntents: Array<{ intent: string; count: number; percentage: number }>;
  };
  trends: {
    dates: string[];
    emailVolume: number[];
    smsVolume: number[];
    callVolume: number[];
    socialEngagement: number[];
    ivrCalls: number[];
    chatbotConversations: number[];
  };
  revenue: {
    total: number;
    byChannel: {
      email: number;
      sms: number;
      calls: number;
      chat: number;
    };
  };
  customers: {
    total: number;
    active: number;
    new: number;
    segments: {
      label: string;
      count: number;
    }[];
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?days=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, dateRange, data: analytics }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${dateRange}days.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Chart data configurations
  const emailTrendData = {
    labels: analytics.trends.dates,
    datasets: [
      {
        label: 'Email Volume',
        data: analytics.trends.emailVolume,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const smsTrendData = {
    labels: analytics.trends.dates,
    datasets: [
      {
        label: 'SMS Volume',
        data: analytics.trends.smsVolume,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const callTrendData = {
    labels: analytics.trends.dates,
    datasets: [
      {
        label: 'Call Volume',
        data: analytics.trends.callVolume,
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const channelPerformanceData = {
    labels: ['Email', 'SMS', 'Calls', 'Chat'],
    datasets: [
      {
        label: 'Performance Rate',
        data: [
          analytics.emailStats.openRate,
          analytics.smsStats.deliveryRate,
          analytics.callStats.successRate,
          analytics.chatStats.satisfactionRate,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
      },
    ],
  };

  const revenueByChannelData = {
    labels: ['Email', 'SMS', 'Calls', 'Chat'],
    datasets: [
      {
        label: 'Revenue ($)',
        data: [
          analytics.revenue.byChannel.email,
          analytics.revenue.byChannel.sms,
          analytics.revenue.byChannel.calls,
          analytics.revenue.byChannel.chat,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
      },
    ],
  };

  const customerSegmentData = {
    labels: analytics.customers.segments.map((s) => s.label),
    datasets: [
      {
        data: analytics.customers.segments.map((s) => s.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
      },
    ],
  };

  const socialEngagementData = {
    labels: analytics.trends.dates,
    datasets: [
      {
        label: 'Social Engagement',
        data: analytics.trends.socialEngagement,
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const socialPlatformsData = {
    labels: ['Facebook', 'Twitter', 'Instagram', 'LinkedIn'],
    datasets: [
      {
        label: 'Posts',
        data: [
          analytics.socialStats.platforms.facebook.posts,
          analytics.socialStats.platforms.twitter.posts,
          analytics.socialStats.platforms.instagram.posts,
          analytics.socialStats.platforms.linkedin.posts,
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Engagement',
        data: [
          analytics.socialStats.platforms.facebook.engagement,
          analytics.socialStats.platforms.twitter.engagement,
          analytics.socialStats.platforms.instagram.engagement,
          analytics.socialStats.platforms.linkedin.engagement,
        ],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      },
    ],
  };

  const ivrCallsData = {
    labels: analytics.trends.dates,
    datasets: [
      {
        label: 'IVR Calls',
        data: analytics.trends.ivrCalls,
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const ivrMenuOptionsData = {
    labels: analytics.ivrStats.topMenuOptions.map((o) => o.option),
    datasets: [
      {
        data: analytics.ivrStats.topMenuOptions.map((o) => o.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
      },
    ],
  };

  const chatbotConversationsData = {
    labels: analytics.trends.dates,
    datasets: [
      {
        label: 'Chatbot Conversations',
        data: analytics.trends.chatbotConversations,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chatbotIntentsData = {
    labels: analytics.chatbotStats.topIntents.map((i) => i.intent),
    datasets: [
      {
        data: analytics.chatbotStats.topIntents.map((i) => i.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive performance metrics and insights
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>

          <button
            onClick={() => handleExport('excel')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Export Excel
          </button>

          <button
            onClick={() => handleExport('pdf')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ${analytics.revenue.total.toLocaleString()}
          </p>
          <p className="text-xs text-green-600 mt-1">↑ 12% from last period</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {analytics.customers.total.toLocaleString()}
          </p>
          <p className="text-xs text-green-600 mt-1">
            +{analytics.customers.new} new this period
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Social Engagement</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {analytics.socialStats.totalEngagement.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {analytics.socialStats.avgEngagementRate}% avg rate
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Chatbot Resolution</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {analytics.chatbotStats.resolutionRate}%
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {analytics.chatbotStats.totalConversations} conversations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'channels', 'social', 'ivr', 'chatbot', 'customers', 'revenue'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Email Campaign Trends
              </h3>
              <div className="h-80">
                <Line data={emailTrendData} options={chartOptions} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                SMS Campaign Trends
              </h3>
              <div className="h-80">
                <Line data={smsTrendData} options={chartOptions} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Call Volume Trends
              </h3>
              <div className="h-80">
                <Line data={callTrendData} options={chartOptions} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Channel Performance Comparison
              </h3>
              <div className="h-80">
                <Bar data={channelPerformanceData} options={chartOptions} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'channels' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Email Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Sent:</span>
                  <span className="font-semibold">
                    {analytics.emailStats.totalSent.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Open Rate:</span>
                  <span className="font-semibold">{analytics.emailStats.openRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Click Rate:</span>
                  <span className="font-semibold">{analytics.emailStats.clickRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bounce Rate:</span>
                  <span className="font-semibold text-red-600">
                    {analytics.emailStats.bounceRate}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SMS Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Sent:</span>
                  <span className="font-semibold">
                    {analytics.smsStats.totalSent.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Rate:</span>
                  <span className="font-semibold">
                    {analytics.smsStats.deliveryRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Rate:</span>
                  <span className="font-semibold">
                    {analytics.smsStats.responseRate}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Calls:</span>
                  <span className="font-semibold">
                    {analytics.callStats.totalCalls.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Duration:</span>
                  <span className="font-semibold">{analytics.callStats.avgDuration}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-semibold">
                    {analytics.callStats.successRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Missed Calls:</span>
                  <span className="font-semibold text-red-600">
                    {analytics.callStats.missedCalls}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Social Media Engagement Trends
                </h3>
                <div className="h-80">
                  <Line data={socialEngagementData} options={chartOptions} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Platform Performance
                </h3>
                <div className="h-80">
                  <Bar data={socialPlatformsData} options={chartOptions} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                <h4 className="text-sm font-medium opacity-90">Facebook</h4>
                <p className="text-2xl font-bold mt-2">
                  {analytics.socialStats.platforms.facebook.posts}
                </p>
                <p className="text-xs opacity-80 mt-1">
                  {analytics.socialStats.platforms.facebook.engagement.toLocaleString()} engagement
                </p>
                <p className="text-xs opacity-80">
                  {analytics.socialStats.platforms.facebook.followers.toLocaleString()} followers
                </p>
              </div>

              <div className="bg-gradient-to-br from-sky-400 to-sky-500 p-6 rounded-lg text-white">
                <h4 className="text-sm font-medium opacity-90">Twitter</h4>
                <p className="text-2xl font-bold mt-2">
                  {analytics.socialStats.platforms.twitter.posts}
                </p>
                <p className="text-xs opacity-80 mt-1">
                  {analytics.socialStats.platforms.twitter.engagement.toLocaleString()} engagement
                </p>
                <p className="text-xs opacity-80">
                  {analytics.socialStats.platforms.twitter.followers.toLocaleString()} followers
                </p>
              </div>

              <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-6 rounded-lg text-white">
                <h4 className="text-sm font-medium opacity-90">Instagram</h4>
                <p className="text-2xl font-bold mt-2">
                  {analytics.socialStats.platforms.instagram.posts}
                </p>
                <p className="text-xs opacity-80 mt-1">
                  {analytics.socialStats.platforms.instagram.engagement.toLocaleString()} engagement
                </p>
                <p className="text-xs opacity-80">
                  {analytics.socialStats.platforms.instagram.followers.toLocaleString()} followers
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-lg text-white">
                <h4 className="text-sm font-medium opacity-90">LinkedIn</h4>
                <p className="text-2xl font-bold mt-2">
                  {analytics.socialStats.platforms.linkedin.posts}
                </p>
                <p className="text-xs opacity-80 mt-1">
                  {analytics.socialStats.platforms.linkedin.engagement.toLocaleString()} engagement
                </p>
                <p className="text-xs opacity-80">
                  {analytics.socialStats.platforms.linkedin.followers.toLocaleString()} followers
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ivr' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Total IVR Calls</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {analytics.ivrStats.totalCalls.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 mt-1">Automated interactions</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {analytics.ivrStats.completionRate}%
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {analytics.ivrStats.completedFlows.toLocaleString()} completed
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Avg Duration</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {analytics.ivrStats.avgDuration} min
                </p>
                <p className="text-xs text-gray-600 mt-1">Per call</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Drop-off Rate</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {analytics.ivrStats.dropoffRate}%
                </p>
                <p className="text-xs text-red-600 mt-1">Needs improvement</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  IVR Call Volume Trends
                </h3>
                <div className="h-80">
                  <Line data={ivrCallsData} options={chartOptions} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Top Menu Options
                </h3>
                <div className="h-80">
                  <Doughnut data={ivrMenuOptionsData} options={doughnutOptions} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Menu Option Breakdown
              </h3>
              <div className="space-y-3">
                {analytics.ivrStats.topMenuOptions.map((option, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {option.option}
                        </span>
                        <span className="text-sm text-gray-600">
                          {option.count.toLocaleString()} calls ({option.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${option.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chatbot' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Total Conversations</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {analytics.chatbotStats.totalConversations.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 mt-1">AI-powered chats</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Resolution Rate</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {analytics.chatbotStats.resolutionRate}%
                </p>
                <p className="text-xs text-green-600 mt-1">Without human help</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Avg Response Time</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {analytics.chatbotStats.avgResponseTime}s
                </p>
                <p className="text-xs text-gray-600 mt-1">Lightning fast</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Human Handoff</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {analytics.chatbotStats.humanHandoffRate}%
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {analytics.chatbotStats.avgMessagesPerSession} avg messages
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Chatbot Conversation Trends
                </h3>
                <div className="h-80">
                  <Line data={chatbotConversationsData} options={chartOptions} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Intents</h3>
                <div className="h-80">
                  <Doughnut data={chatbotIntentsData} options={doughnutOptions} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Intent Distribution
              </h3>
              <div className="space-y-3">
                {analytics.chatbotStats.topIntents.map((intent, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {intent.intent}
                        </span>
                        <span className="text-sm text-gray-600">
                          {intent.count.toLocaleString()} queries ({intent.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${intent.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Customer Segments
              </h3>
              <div className="h-80">
                <Doughnut data={customerSegmentData} options={doughnutOptions} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Customer Insights
              </h3>
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <p className="text-sm text-gray-500">Total Customers</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics.customers.total.toLocaleString()}
                  </p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-sm text-gray-500">Active Customers</p>
                  <p className="text-3xl font-bold text-green-600">
                    {analytics.customers.active.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((analytics.customers.active / analytics.customers.total) * 100).toFixed(
                      1
                    )}
                    % of total
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">New This Period</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {analytics.customers.new.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Revenue by Channel
              </h3>
              <div className="h-80">
                <Bar data={revenueByChannelData} options={chartOptions} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Revenue Breakdown
              </h3>
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${analytics.revenue.total.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-semibold">
                      ${analytics.revenue.byChannel.email.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">SMS:</span>
                    <span className="font-semibold">
                      ${analytics.revenue.byChannel.sms.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Calls:</span>
                    <span className="font-semibold">
                      ${analytics.revenue.byChannel.calls.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Chat:</span>
                    <span className="font-semibold">
                      ${analytics.revenue.byChannel.chat.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
