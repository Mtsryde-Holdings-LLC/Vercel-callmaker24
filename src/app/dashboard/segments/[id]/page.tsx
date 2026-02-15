"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";

interface Customer {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  totalSpent: number;
  orderCount: number;
  engagementScore: number | null;
  rfmScore: string | null;
  churnRisk: string | null;
  segmentTags: string[] | null;
}

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
  lastCalculated: string | null;
  conditions: any;
  customers: Customer[];
  _count: { customers: number };
}

export default function SegmentDetailPage() {
  const { primaryColor } = useTheme();
  const params = useParams();
  const segmentId = params?.id as string;

  const [segment, setSegment] = useState<Segment | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"engagement" | "spent" | "orders">(
    "engagement",
  );

  useEffect(() => {
    if (segmentId) fetchSegment();
  }, [segmentId]);

  const fetchSegment = async () => {
    try {
      const res = await fetch(`/api/segments/${segmentId}`);
      if (res.ok) {
        const data = await res.json();
        setSegment(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch segment:", error);
    } finally {
      setLoading(false);
    }
  };

  const getChurnBadge = (risk: string | null) => {
    switch (risk) {
      case "HIGH":
        return (
          <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
            High Risk
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">
            Medium Risk
          </span>
        );
      case "LOW":
        return (
          <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
            Low Risk
          </span>
        );
      default:
        return null;
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

  const filteredCustomers = (segment?.customers || [])
    .filter((c) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.firstName?.toLowerCase().includes(q) ||
        c.lastName?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "spent":
          return (b.totalSpent || 0) - (a.totalSpent || 0);
        case "orders":
          return (b.orderCount || 0) - (a.orderCount || 0);
        case "engagement":
        default:
          return (b.engagementScore || 0) - (a.engagementScore || 0);
      }
    });

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: primaryColor }}
        ></div>
      </div>
    );
  }

  if (!segment) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Segment not found</p>
        <Link
          href="/dashboard/segments"
          className="text-blue-600 hover:underline mt-2 inline-block"
        >
          ← Back to Segments
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/dashboard/segments"
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back to Segments
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <span className="text-5xl">
            {getSegmentIcon(segment.segmentType)}
          </span>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{segment.name}</h1>
            <p className="text-gray-600 mt-1">{segment.description}</p>
            <div className="flex items-center gap-2 mt-2">
              {segment.isAiPowered && (
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                  🤖 AI-Powered
                </span>
              )}
              {segment.autoUpdate && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  🔄 Auto-Update
                </span>
              )}
              {segment.lastCalculated && (
                <span className="text-xs text-gray-500">
                  Last updated:{" "}
                  {new Date(segment.lastCalculated).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Customers
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {segment._count?.customers || segment.customers.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Avg Lifetime Value
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            ${Math.round(segment.avgLifetimeValue || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Avg Engagement
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {Math.round(segment.avgEngagement || 0)}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Total Revenue
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            $
            {segment.customers
              .reduce((sum, c) => sum + (c.totalSpent || 0), 0)
              .toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3 items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Customers in Segment ({filteredCustomers.length})
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="engagement">Sort by Engagement</option>
              <option value="spent">Sort by Spending</option>
              <option value="orders">Sort by Orders</option>
            </select>
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-4xl mb-2">🔍</p>
            <p>No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Total Spent</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Engagement</th>
                  <th className="px-4 py-3">RFM</th>
                  <th className="px-4 py-3">Churn Risk</th>
                  <th className="px-4 py-3">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {customer.firstName} {customer.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">
                        {customer.email}
                      </div>
                      {customer.phone && (
                        <div className="text-xs text-gray-400">
                          {customer.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      ${(customer.totalSpent || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {customer.orderCount || 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${customer.engagementScore || 0}%`,
                              backgroundColor: primaryColor,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {Math.round(customer.engagementScore || 0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-gray-700">
                        {customer.rfmScore || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getChurnBadge(customer.churnRisk)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {((customer.segmentTags as string[]) || [])
                          .slice(0, 3)
                          .map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded"
                            >
                              {tag.replace(/_/g, " ")}
                            </span>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
