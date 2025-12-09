"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";

export default function FunctionsPage() {
  const { data: session } = useSession();
  const { primaryColor, backgroundColor } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const handleConfigure = (title: string, description: string) => {
    setModalContent({ title, description });
    setShowModal(true);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6" style={{ backgroundColor }}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Advanced Functions</h1>
        <p className="text-gray-600 mt-1">
          Manage advanced platform features and automations
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes("✓")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Functions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Automation Functions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">🤖</div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              Active
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Campaign Automation
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Automatically trigger campaigns based on customer behavior and
            events
          </p>
          <button
            onClick={() =>
              handleConfigure(
                "Campaign Automation",
                "Set up automated campaigns triggered by customer actions like purchases, abandoned carts, birthdays, and more. Configure trigger conditions, timing delays, and campaign sequences."
              )
            }
            className="w-full px-4 py-2 text-sm font-medium text-white rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Configure
          </button>
        </div>

        {/* AI Functions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">🧠</div>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
              Active
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI Content Generation
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Use AI to generate email content, SMS messages, and social media
            posts
          </p>
          <button
            onClick={() => handleNavigate("/dashboard/posts")}
            className="w-full px-4 py-2 text-sm font-medium text-white rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Configure
          </button>
        </div>

        {/* Scheduled Functions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">⏰</div>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              Active
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Scheduled Tasks
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Set up recurring campaigns, reports, and data sync operations
          </p>
          <button
            onClick={() =>
              handleConfigure(
                "Scheduled Tasks",
                "Configure automated recurring tasks including: email campaigns, SMS broadcasts, report generation, and data synchronization. Set frequency (hourly, daily, weekly, monthly) and execution times."
              )
            }
            className="w-full px-4 py-2 text-sm font-medium text-white rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Configure
          </button>
        </div>

        {/* Data Sync Functions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">🔄</div>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              Active
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Shopify Sync
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Automatically sync customers and orders from Shopify hourly
          </p>
          <button
            onClick={() => handleNavigate("/dashboard/integrations/shopify")}
            className="w-full px-4 py-2 text-sm font-medium text-white rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            View Logs
          </button>
        </div>

        {/* Custom Webhooks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">🪝</div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              2 Active
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Webhooks</h3>
          <p className="text-sm text-gray-600 mb-4">
            Receive real-time notifications for events in your account
          </p>
          <button
            onClick={() =>
              handleConfigure(
                "Webhooks",
                "Configure webhooks to receive real-time HTTP POST notifications for events like: new customer, order created, campaign sent, SMS delivered, email opened, and more. Add your endpoint URLs and select events."
              )
            }
            className="w-full px-4 py-2 text-sm font-medium text-white rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Manage
          </button>
        </div>

        {/* API Functions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">🔌</div>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
              Available
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            API Access
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Connect external applications using REST API endpoints
          </p>
          <button
            onClick={() => handleNavigate("/dashboard/settings?tab=api")}
            className="w-full px-4 py-2 text-sm font-medium text-white rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            View Docs
          </button>
        </div>

        {/* Email Templates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">📧</div>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              12 Templates
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Email Templates
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Create reusable email templates with dynamic variables
          </p>
          <button
            onClick={() => handleNavigate("/dashboard/email-campaigns")}
            className="w-full px-4 py-2 text-sm font-medium text-white rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Manage
          </button>
        </div>

        {/* SMS Templates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">💬</div>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              8 Templates
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            SMS Templates
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Pre-configured SMS message templates for quick campaigns
          </p>
          <button
            onClick={() => handleNavigate("/dashboard/sms-campaigns")}
            className="w-full px-4 py-2 text-sm font-medium text-white rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Manage
          </button>
        </div>

        {/* Customer Segmentation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">🎯</div>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
              Pro
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Smart Segmentation
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            AI-powered customer segmentation based on behavior and engagement
          </p>
          <button
            onClick={() =>
              handleConfigure(
                "Smart Segmentation",
                "Use AI to automatically segment customers based on: purchase history, engagement levels, browsing behavior, demographics, and predicted lifetime value. Create dynamic segments that update automatically as customer behavior changes."
              )
            }
            className="w-full px-4 py-2 text-sm font-medium text-white rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Configure
          </button>
        </div>
      </div>

      {/* Active Functions Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Active Background Functions
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium text-gray-900">
                  Shopify Customer Sync
                </p>
                <p className="text-sm text-gray-500">
                  Runs hourly • Last run: 23 minutes ago
                </p>
              </div>
            </div>
            <span className="text-sm text-green-600 font-medium">Running</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium text-gray-900">
                  Scheduled Message Queue
                </p>
                <p className="text-sm text-gray-500">
                  Runs every minute • Last run: 42 seconds ago
                </p>
              </div>
            </div>
            <span className="text-sm text-green-600 font-medium">Running</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">
                  Email Campaign Processor
                </p>
                <p className="text-sm text-gray-500">
                  On-demand • Last run: 2 hours ago
                </p>
              </div>
            </div>
            <span className="text-sm text-gray-600 font-medium">Idle</span>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">
                  SMS Delivery Monitor
                </p>
                <p className="text-sm text-gray-500">
                  On-demand • Last run: 5 hours ago
                </p>
              </div>
            </div>
            <span className="text-sm text-gray-600 font-medium">Idle</span>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="text-3xl mb-2">📊</div>
          <p className="text-sm text-blue-700 font-medium mb-1">
            Total Functions
          </p>
          <p className="text-3xl font-bold text-blue-900">9</p>
          <p className="text-xs text-blue-600 mt-1">6 active, 3 available</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="text-3xl mb-2">⚡</div>
          <p className="text-sm text-green-700 font-medium mb-1">
            Background Jobs
          </p>
          <p className="text-3xl font-bold text-green-900">2</p>
          <p className="text-xs text-green-600 mt-1">Currently running</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="text-3xl mb-2">🔧</div>
          <p className="text-sm text-purple-700 font-medium mb-1">
            API Calls Today
          </p>
          <p className="text-3xl font-bold text-purple-900">1.2K</p>
          <p className="text-xs text-purple-600 mt-1">Within limits</p>
        </div>
      </div>

      {/* Configuration Modal */}
      {showModal && modalContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {modalContent.title}
                </h2>
                <p className="text-gray-600 mt-2">{modalContent.description}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <p className="font-semibold text-blue-900 mb-1">
                    Coming Soon
                  </p>
                  <p className="text-sm text-blue-700">
                    This advanced feature is currently in development. We're
                    working hard to bring you powerful automation capabilities.
                    Check back soon or contact support to join our beta
                    program!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setMessage(
                    "✓ We've added you to the notification list for this feature!"
                  );
                  setTimeout(() => setMessage(""), 5000);
                }}
                className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition"
                style={{ backgroundColor: primaryColor }}
              >
                Notify Me
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
