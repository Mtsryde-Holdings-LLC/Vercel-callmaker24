"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

interface Segment {
  id: string;
  name: string;
  description: string;
  segmentType: string;
  isAiPowered: boolean;
  autoUpdate: boolean;
  customerCount: number;
  avgLifetimeValue: number;
  avgEngagement: number;
  lastCalculated: string;
  customers: any[];
}

export default function SegmentsPage() {
  const { primaryColor } = useTheme();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcResult, setRecalcResult] = useState<string | null>(null);

  useEffect(() => {
    fetchSegments();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    setRecalcResult(null);
    try {
      const res = await fetch("/api/segments/recalculate", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setRecalcResult(
          `✅ Recalculated ${data.processed} customers${data.failed > 0 ? ` (${data.failed} failed)` : ""}`,
        );
        fetchSegments();
      } else {
        setRecalcResult(`❌ ${data.error || "Recalculation failed"}`);
      }
    } catch (err) {
      setRecalcResult("❌ Failed to recalculate");
    } finally {
      setRecalculating(false);
    }
  };

  const fetchSegments = async () => {
    try {
      const response = await fetch("/api/segments");
      if (response.ok) {
        const data = await response.json();
        setSegments(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch segments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentIcon = (type: string) => {
    switch (type) {
      case "CHAMPION":
        return "🏆";
      case "HIGH_VALUE":
        return "💎";
      case "AT_RISK":
        return "⚠️";
      case "ENGAGED":
        return "⭐";
      case "NEW":
        return "🌱";
      case "FREQUENT":
        return "🔄";
      default:
        return "📊";
    }
  };

  const getSegmentColor = (type: string) => {
    switch (type) {
      case "CHAMPION":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH_VALUE":
        return "bg-purple-100 text-purple-800";
      case "AT_RISK":
        return "bg-red-100 text-red-800";
      case "ENGAGED":
        return "bg-green-100 text-green-800";
      case "NEW":
        return "bg-blue-100 text-blue-800";
      case "FREQUENT":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            🎯 Smart Segmentation
          </h1>
          <p className="text-gray-600 mt-1">
            AI-powered customer segments updated automatically
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/action-plans"
            className="px-4 py-3 border-2 border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition text-sm font-medium"
          >
            📋 Action Plans
          </Link>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="px-4 py-3 border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition disabled:opacity-50 text-sm font-medium"
          >
            {recalculating ? "⏳ Recalculating..." : "🔄 Recalculate Now"}
          </button>
          <Link
            href="/dashboard/segments/create"
            className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition"
            style={{ backgroundColor: primaryColor }}
          >
            + Create Manual Segment
          </Link>
        </div>
      </div>

      {/* Recalculation Result */}
      {recalcResult && (
        <div
          className={`rounded-lg p-4 text-sm ${
            recalcResult.startsWith("✅")
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {recalcResult}
        </div>
      )}

      {/* AI Segmentation Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🤖</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI-Powered Segmentation Active
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Your customers are automatically segmented based on purchase
              history, engagement levels, RFM analysis, and predicted lifetime
              value. Segments update daily at 2 AM UTC.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700">
                📊 RFM Scoring
              </span>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700">
                🎯 Engagement Analysis
              </span>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700">
                💰 Lifetime Value Prediction
              </span>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700">
                ⚠️ Churn Risk Detection
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Segments Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: primaryColor }}
          ></div>
        </div>
      ) : segments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Segments Yet
          </h3>
          <p className="text-gray-600 mb-6">
            AI segmentation will run automatically to create customer segments
            based on behavior and engagement.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.map((segment) => (
            <Link
              key={segment.id}
              href={`/dashboard/segments/${segment.id}`}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {getSegmentIcon(segment.segmentType)}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {segment.name}
                    </h3>
                    {segment.isAiPowered && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        AI-Powered
                      </span>
                    )}
                  </div>
                </div>
                {segment.segmentType && (
                  <span
                    className={`text-xs px-2 py-1 rounded ${getSegmentColor(
                      segment.segmentType,
                    )}`}
                  >
                    {segment.segmentType.replace("_", " ")}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {segment.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Customers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {segment.customerCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg LTV</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${Math.round(segment.avgLifetimeValue)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Engagement: {Math.round(segment.avgEngagement)}%</span>
                {segment.autoUpdate && <span>🔄 Auto-update</span>}
              </div>

              {segment.lastCalculated && (
                <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                  Last updated:{" "}
                  {new Date(segment.lastCalculated).toLocaleDateString()}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
