"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";

interface CampaignReport {
  id: string;
  name: string;
  type: "EMAIL" | "SMS" | "IVR" | "SOCIAL";
  status: string;
  createdAt: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  failed: number;
}

export default function ReportsPage() {
  const { backgroundColor, primaryColor } = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "ALL" | "EMAIL" | "SMS" | "IVR" | "SOCIAL"
  >("ALL");
  const [reports, setReports] = useState<CampaignReport[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchReports();
  }, [filter]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchReports(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, filter]);

  const fetchReports = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/reports/campaigns?type=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return "0%";
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "EMAIL":
        return "📧";
      case "SMS":
        return "💬";
      case "IVR":
        return "☎️";
      case "SOCIAL":
        return "📱";
      default:
        return "📊";
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "EMAIL":
        return "bg-blue-100 text-blue-800";
      case "SMS":
        return "bg-green-100 text-green-800";
      case "IVR":
        return "bg-purple-100 text-purple-800";
      case "SOCIAL":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const downloadExcel = () => {
    const headers = [
      "Campaign",
      "Type",
      "Date",
      "Status",
      "Sent",
      "Delivered",
      "Delivery Rate",
      "Opened",
      "Open Rate",
      "Clicked",
      "Click Rate",
      "Bounced",
      "Bounce Rate",
      "Unsubscribed",
    ];

    const rows = reports.map((report) => [
      report.name,
      report.type,
      new Date(report.createdAt).toLocaleDateString(),
      report.status,
      report.sent,
      report.delivered,
      calculateRate(report.delivered, report.sent),
      report.opened,
      calculateRate(report.opened, report.delivered),
      report.clicked,
      calculateRate(report.clicked, report.opened),
      report.bounced,
      calculateRate(report.bounced, report.sent),
      report.unsubscribed,
    ]);

    let csv = headers.join(",") + "\n";
    rows.forEach((row) => {
      csv += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-reports-${filter}-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const printContent = document.getElementById("reports-table");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Campaign Reports - ${filter}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #111; margin-bottom: 10px; }
            .meta { color: #666; margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: 600; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .summary-card { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; }
            .summary-card .label { font-size: 12px; color: #666; margin-bottom: 5px; }
            .summary-card .value { font-size: 24px; font-weight: bold; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Campaign Reports</h1>
          <div class="meta">
            Filter: ${filter} | Generated: ${new Date().toLocaleString()} | Total Campaigns: ${
      reports.length
    }
          </div>
          <div class="summary">
            <div class="summary-card">
              <div class="label">Total Campaigns</div>
              <div class="value">${reports.length}</div>
            </div>
            <div class="summary-card">
              <div class="label">Total Sent</div>
              <div class="value">${reports
                .reduce((sum, r) => sum + r.sent, 0)
                .toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <div class="label">Avg Delivery Rate</div>
              <div class="value" style="color: #059669">${calculateRate(
                reports.reduce((sum, r) => sum + r.delivered, 0),
                reports.reduce((sum, r) => sum + r.sent, 0)
              )}</div>
            </div>
            <div class="summary-card">
              <div class="label">Avg Open Rate</div>
              <div class="value" style="color: #2563eb">${calculateRate(
                reports.reduce((sum, r) => sum + r.opened, 0),
                reports.reduce((sum, r) => sum + r.delivered, 0)
              )}</div>
            </div>
          </div>
          ${printContent.outerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 p-8" style={{ backgroundColor: backgroundColor }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaign Reports</h1>
          <p className="text-gray-600 mt-1">
            Detailed performance metrics for all campaigns
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()} 
            {autoRefresh && " • Auto-refreshing every 30s"}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchReports()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            title="Refresh data"
          >
            <svg
              className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              autoRefresh
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </button
        <div className="flex gap-3">
          <button
            onClick={downloadExcel}
            disabled={reports.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download Excel
          </button>
          <button
            onClick={downloadPDF}
            disabled={reports.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Download PDF
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        {["ALL", "EMAIL", "SMS", "IVR", "SOCIAL"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type as any)}
            className={`px-4 py-2 font-medium transition ${
              filter === type
                ? "border-b-2 text-gray-900"
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={
              filter === type
                ? { borderColor: primaryColor, color: primaryColor }
                : {}
            }
          >
            {type === "ALL" ? "All Campaigns" : `${getTypeIcon(type)} ${type}`}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">
            Total Campaigns
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {reports.length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Total Sent</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {reports.reduce((sum, r) => sum + r.sent, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">
            Avg Delivery Rate
          </div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {calculateRate(
              reports.reduce((sum, r) => sum + r.delivered, 0),
              reports.reduce((sum, r) => sum + r.sent, 0)
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Avg Open Rate</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {calculateRate(
              reports.reduce((sum, r) => sum + r.opened, 0),
              reports.reduce((sum, r) => sum + r.delivered, 0)
            )}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: primaryColor }}
          ></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No campaigns found
          </h3>
          <p className="text-gray-600">
            Create your first campaign to see reports here
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto" id="reports-table">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Delivered
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Opened
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Clicked
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Bounced
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Unsubscribed
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Rates
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {report.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {report.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(
                          report.type
                        )}`}
                      >
                        {getTypeIcon(report.type)} {report.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {report.sent.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                      {report.delivered.toLocaleString()}
                      <div className="text-xs text-gray-500">
                        {calculateRate(report.delivered, report.sent)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                      {report.opened.toLocaleString()}
                      <div className="text-xs text-gray-500">
                        {calculateRate(report.opened, report.delivered)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600">
                      {report.clicked.toLocaleString()}
                      <div className="text-xs text-gray-500">
                        {calculateRate(report.clicked, report.opened)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {report.bounced.toLocaleString()}
                      <div className="text-xs text-gray-500">
                        {calculateRate(report.bounced, report.sent)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                      {report.unsubscribed.toLocaleString()}
                      <div className="text-xs text-gray-500">
                        {calculateRate(report.unsubscribed, report.delivered)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="space-y-1">
                        <div className="flex items-center justify-end space-x-2">
                          <span className="text-xs text-gray-500">
                            Delivery:
                          </span>
                          <span className="text-xs font-medium text-green-600">
                            {calculateRate(report.delivered, report.sent)}
                          </span>
                        </div>
                        <div className="flex items-center justify-end space-x-2">
                          <span className="text-xs text-gray-500">Open:</span>
                          <span className="text-xs font-medium text-blue-600">
                            {calculateRate(report.opened, report.delivered)}
                          </span>
                        </div>
                        <div className="flex items-center justify-end space-x-2">
                          <span className="text-xs text-gray-500">CTR:</span>
                          <span className="text-xs font-medium text-purple-600">
                            {calculateRate(report.clicked, report.opened)}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
