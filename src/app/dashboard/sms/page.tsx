"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";

interface SmsCampaign {
  id: string;
  name: string;
  message: string;
  status: string;
  sentAt?: string;
  scheduledFor?: string;
  totalRecipients: number;
  deliveryRate?: number;
}

export default function SmsCampaignsPage() {
  const { primaryColor, backgroundColor } = useTheme();
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/sms/campaigns");
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const response = await fetch(`/api/sms/campaigns/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setCampaigns(campaigns.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete campaign:", error);
    }
  };

  const filteredCampaigns = statusFilter
    ? campaigns.filter((c) => c.status === statusFilter)
    : campaigns;

  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: "bg-gray-100 text-gray-800",
      SCHEDULED: "bg-blue-100 text-blue-800",
      SENT: "bg-green-100 text-green-800",
      SENDING: "bg-yellow-100 text-yellow-800",
      FAILED: "bg-red-100 text-red-800",
    };
    return styles[status as keyof typeof styles] || styles.DRAFT;
  };

  return (
    <div className="space-y-6" style={{ backgroundColor: backgroundColor }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("sms.title")}</h1>
          <p className="text-gray-600 mt-1">{t("sms.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/sms/templates"
            className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition"
          >
            📱 {t("sms.browseTemplates")}
          </Link>
          <Link
            href="/dashboard/sms/create"
            className="text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
            style={{ backgroundColor: primaryColor }}
          >
            + {t("sms.newCampaign")}
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2"
          style={{ "--tw-ring-color": primaryColor } as any}
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="SENDING">Sending</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {statusFilter
              ? "No campaigns found with this status."
              : "No SMS campaigns yet. Create your first campaign!"}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {campaign.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(campaign.status)}`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 bg-gray-50 p-3 rounded">
                      {campaign.message}
                    </p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span>💬 {campaign.totalRecipients} recipients</span>
                      {campaign.deliveryRate !== undefined && (
                        <span>✅ {campaign.deliveryRate}% delivered</span>
                      )}
                      {campaign.sentAt && (
                        <span>
                          📅 Sent{" "}
                          {new Date(campaign.sentAt).toLocaleDateString()}
                        </span>
                      )}
                      {campaign.scheduledFor && !campaign.sentAt && (
                        <span>
                          ⏰ Scheduled for{" "}
                          {new Date(campaign.scheduledFor).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      href={`/dashboard/sms/${campaign.id}`}
                      className="px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition"
                    >
                      View
                    </Link>
                    {campaign.status === "DRAFT" && (
                      <Link
                        href={`/dashboard/sms/${campaign.id}/edit`}
                        className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        Edit
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {campaigns.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600">Sent</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {campaigns.filter((c) => c.status === "SENT").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600">Scheduled</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {campaigns.filter((c) => c.status === "SCHEDULED").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600">Drafts</p>
          <p className="text-3xl font-bold text-gray-600 mt-2">
            {campaigns.filter((c) => c.status === "DRAFT").length}
          </p>
        </div>
      </div>
    </div>
  );
}
