"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

interface SegmentTemplate {
  name: string;
  segmentType: string;
  description: string;
  conditions: Array<{ field: string; operator: string; value: string }>;
  matchType: "all" | "any";
  useAiAnalysis: boolean;
  autoUpdate: boolean;
  priority: number;
  isActive: boolean;
  existingSegmentId: string | null;
  currentCustomerCount: number;
}

interface EvalResult {
  segmentId: string;
  name: string;
  customerCount: number;
  avgLtv: number;
}

export default function SmartSegmentationPage() {
  const { primaryColor } = useTheme();
  const [templates, setTemplates] = useState<SegmentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [evalResults, setEvalResults] = useState<EvalResult[] | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/segments/smart/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.data.templates);
      }
    } catch {
      setStatusMessage({ type: "error", text: "Failed to load templates" });
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async () => {
    setInitializing(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/segments/smart/initialize", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: "success",
          text: `✅ ${data.data.message}`,
        });
        fetchTemplates();
      } else {
        setStatusMessage({
          type: "error",
          text: `❌ ${data.error || "Initialization failed"}`,
        });
      }
    } catch {
      setStatusMessage({ type: "error", text: "❌ Network error" });
    } finally {
      setInitializing(false);
    }
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    setStatusMessage(null);
    setEvalResults(null);
    try {
      const res = await fetch("/api/segments/smart/evaluate", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: "success",
          text: `✅ ${data.data.message}`,
        });
        setEvalResults(data.data.segments || []);
        fetchTemplates();
      } else {
        setStatusMessage({
          type: "error",
          text: `❌ ${data.error || "Evaluation failed"}`,
        });
      }
    } catch {
      setStatusMessage({ type: "error", text: "❌ Network error" });
    } finally {
      setEvaluating(false);
    }
  };

  const activeCount = templates.filter((t) => t.isActive).length;
  const totalCustomers = templates.reduce(
    (sum, t) => sum + t.currentCustomerCount,
    0,
  );
  const aiPowered = templates.filter(
    (t) => t.isActive && t.useAiAnalysis,
  ).length;

  const getSegmentIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      VIP_WHALES: "🐋",
      RISING_STARS: "🌟",
      WIN_BACK: "🔙",
      BARGAIN_HUNTERS: "🏷️",
      LOYAL_ADVOCATES: "💪",
      FIRST_TIME: "👋",
      EMAIL_ENGAGED: "📧",
      SMS_RESPONSIVE: "📱",
      DORMANT_HIGH_VALUE: "💤",
      BIRTHDAY_MONTH: "🎂",
    };
    return iconMap[type] || "📊";
  };

  const getPriorityLabel = (p: number) => {
    if (p <= 2) return { text: "High", color: "text-red-600 bg-red-50" };
    if (p <= 3) return { text: "Medium", color: "text-yellow-700 bg-yellow-50" };
    return { text: "Normal", color: "text-gray-600 bg-gray-50" };
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            🧠 Smart AI Segmentation
          </h1>
          <p className="text-gray-600 mt-1">
            Configure AI-powered dynamic customer segments that
            auto-update based on behavior changes
          </p>
        </div>
        <Link
          href="/dashboard/segments"
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
        >
          ← Back to Segments
        </Link>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`rounded-lg p-4 text-sm ${
            statusMessage.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-purple-500">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Smart Segments
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {activeCount}
            <span className="text-base font-normal text-gray-500">
              /{templates.length}
            </span>
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Customers Segmented
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {totalCustomers}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            AI-Enhanced
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{aiPowered}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-amber-500">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Auto-Update
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">Daily 2AM</p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          🤖 How Smart Segmentation Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
          <div className="flex flex-col items-center text-center p-3">
            <span className="text-2xl mb-2">📊</span>
            <span className="font-medium">Purchase History</span>
            <span className="text-gray-500 text-xs mt-1">
              Total spend, order frequency, AOV, recency
            </span>
          </div>
          <div className="flex flex-col items-center text-center p-3">
            <span className="text-2xl mb-2">🎯</span>
            <span className="font-medium">Engagement Level</span>
            <span className="text-gray-500 text-xs mt-1">
              Email opens, SMS responses, app activity
            </span>
          </div>
          <div className="flex flex-col items-center text-center p-3">
            <span className="text-2xl mb-2">👤</span>
            <span className="font-medium">Demographics</span>
            <span className="text-gray-500 text-xs mt-1">
              Location, birthday, source, loyalty tier
            </span>
          </div>
          <div className="flex flex-col items-center text-center p-3">
            <span className="text-2xl mb-2">🔮</span>
            <span className="font-medium">Predicted LTV</span>
            <span className="text-gray-500 text-xs mt-1">
              AI-enhanced lifetime value projection
            </span>
          </div>
          <div className="flex flex-col items-center text-center p-3">
            <span className="text-2xl mb-2">⚠️</span>
            <span className="font-medium">Churn Risk</span>
            <span className="text-gray-500 text-xs mt-1">
              Early warning detection for at-risk customers
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleInitialize}
          disabled={initializing || activeCount === templates.length}
          className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 font-medium"
          style={{ backgroundColor: primaryColor }}
        >
          {initializing
            ? "⏳ Creating Segments..."
            : activeCount === templates.length
              ? "✅ All Templates Active"
              : `🚀 Activate All ${templates.length} Smart Segments`}
        </button>
        <button
          onClick={handleEvaluate}
          disabled={evaluating || activeCount === 0}
          className="px-6 py-3 border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition disabled:opacity-50 font-medium"
        >
          {evaluating
            ? "⏳ Evaluating..."
            : "🔄 Run AI Evaluation Now"}
        </button>
      </div>

      {/* Evaluation Results */}
      {evalResults && evalResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📈 Evaluation Results
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {evalResults.map((r) => (
              <div
                key={r.segmentId}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{r.name}</p>
                  <p className="text-sm text-gray-500">
                    Avg LTV: ${Math.round(r.avgLtv)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                    {r.customerCount}
                  </p>
                  <p className="text-xs text-gray-500">customers</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Segment Templates Grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📋 Smart Segment Templates
        </h3>
        {loading ? (
          <div className="flex justify-center py-12">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2"
              style={{ borderColor: primaryColor }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => {
              const priority = getPriorityLabel(template.priority);
              return (
                <div
                  key={template.segmentType}
                  className={`bg-white rounded-lg shadow-md p-5 border-l-4 ${
                    template.isActive
                      ? "border-green-500"
                      : "border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {getSegmentIcon(template.segmentType)}
                      </span>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {template.name}
                        </h4>
                        <div className="flex gap-2 mt-1">
                          {template.isActive ? (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                              Active
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                              Inactive
                            </span>
                          )}
                          {template.useAiAnalysis && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                              🤖 AI
                            </span>
                          )}
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${priority.color}`}
                          >
                            {priority.text} Priority
                          </span>
                        </div>
                      </div>
                    </div>
                    {template.isActive && (
                      <div className="text-right">
                        <p
                          className="text-2xl font-bold"
                          style={{ color: primaryColor }}
                        >
                          {template.currentCustomerCount}
                        </p>
                        <p className="text-xs text-gray-500">customers</p>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    {template.description}
                  </p>

                  {/* Conditions Preview */}
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                      Conditions ({template.matchType === "all" ? "ALL match" : "ANY match"})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {template.conditions.map((c, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-white border rounded text-gray-700"
                        >
                          {c.field} {c.operator} {c.value}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Auto-update indicator */}
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                    {template.autoUpdate && <span>🔄 Auto-updates daily</span>}
                    {template.existingSegmentId && (
                      <Link
                        href={`/dashboard/segments/${template.existingSegmentId}`}
                        className="text-purple-600 hover:underline ml-auto"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="bg-gray-50 rounded-lg p-5 border text-sm text-gray-600">
        <h4 className="font-medium text-gray-900 mb-2">
          💡 How Dynamic Segments Work
        </h4>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Segments automatically re-evaluate every day at 2 AM UTC via cron
            job
          </li>
          <li>
            Customers move between segments as their behavior changes (purchases,
            engagement, churn risk)
          </li>
          <li>
            AI-enhanced segments use GPT to generate deeper cohort insights and
            action recommendations
          </li>
          <li>
            Campaign sends respect segment targeting — only customers in
            selected segments receive messages
          </li>
          <li>
            Enhanced LTV predictions consider purchase velocity, engagement
            trajectory, and loyalty status
          </li>
        </ul>
      </div>
    </div>
  );
}
