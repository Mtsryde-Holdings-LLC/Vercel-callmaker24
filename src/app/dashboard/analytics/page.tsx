'use client';

import { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import LockedFeature from '@/components/LockedFeature';
import { isUserOnTrial, getDaysRemainingInTrial } from '@/lib/trial-limits';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { backgroundColor } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Mock organization data - in production, fetch from API/session
  const organization = {
    subscriptionStatus: 'TRIALING' as const,
    subscriptionStartDate: new Date(),
  };
  
  const isOnTrial = isUserOnTrial(
    organization.subscriptionStatus,
    organization.subscriptionStartDate
  );
  
  const daysRemaining = getDaysRemainingInTrial(organization.subscriptionStartDate);

  // Mock data for demonstration
  useEffect(() => {
    const mockData: AnalyticsData = {
      emailStats: { totalSent: 10000, openRate: 25, clickRate: 5, bounceRate: 2 },
      smsStats: { totalSent: 5000, deliveryRate: 98, responseRate: 15 },
      callStats: { totalCalls: 2000, avgDuration: 5, successRate: 85, missedCalls: 300 },
      chatStats: { totalChats: 1500, avgResponseTime: 2, satisfactionRate: 90, resolvedRate: 85 },
      socialStats: {
        totalPosts: 500,
        totalEngagement: 50000,
        avgEngagementRate: 5,
        followers: 10000,
        platforms: {
          facebook: { posts: 150, engagement: 15000, followers: 3000 },
          twitter: { posts: 200, engagement: 20000, followers: 4000 },
          instagram: { posts: 100, engagement: 10000, followers: 2000 },
          linkedin: { posts: 50, engagement: 5000, followers: 1000 }
        }
      },
      ivrStats: { totalCalls: 3000, completedFlows: 2500, avgDuration: 3, completionRate: 83, dropoffRate: 17, topMenuOptions: [] },
      chatbotStats: { totalConversations: 5000, avgResponseTime: 1, resolutionRate: 80, humanHandoffRate: 20, avgMessagesPerSession: 5, topIntents: [] },
      trends: { dates: [], emailVolume: [], smsVolume: [], callVolume: [], socialEngagement: [], ivrCalls: [], chatbotConversations: [] },
      revenue: { total: 120000, byChannel: { email: 45000, sms: 32000, calls: 28000, chat: 15000 } },
      customers: { total: 5000, active: 3000, new: 500, segments: [] }
    };
    setAnalytics(mockData);
    setLoading(false);
  }, []);

  const chartOptions: any = { responsive: true, maintainAspectRatio: false };
  const socialEngagementData: any = { labels: [], datasets: [] };
  const socialPlatformsData: any = { labels: [], datasets: [] };

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{backgroundColor: backgroundColor}}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{backgroundColor: backgroundColor}}>
      {isOnTrial ? (
        <LockedFeature
          featureName="Advanced Analytics"
          daysRemaining={daysRemaining}
          icon="📊"
        >
          <div>
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
        </LockedFeature>
      ) : (
        <div>
          {activeTab === 'social' && (
            <div className="space-y-6">
              {/* Full analytics content will render here when not on trial */}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
