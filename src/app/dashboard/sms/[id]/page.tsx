"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SmsCampaignDetailPage() {
  const params = useParams()!;
  const router = useRouter();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/sms/campaigns/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCampaign(data.data);
        setFormData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch campaign:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveCampaign = async () => {
    try {
      const response = await fetch(`/api/sms/campaigns/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        alert("✅ Campaign updated!");
        setEditing(false);
        fetchCampaign();
      }
    } catch (error) {
      alert("❌ Failed to update campaign");
    }
  };

  const handleSendNow = async () => {
    if (!confirm("Send this SMS campaign now to all recipients?")) return;
    setSending(true);
    try {
      const response = await fetch(`/api/sms-campaigns/${params.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendNow: true }),
      });
      if (response.ok) {
        alert("✅ SMS campaign is being sent!");
        fetchCampaign();
      } else {
        alert("❌ Failed to send campaign");
      }
    } catch (error) {
      alert("❌ Failed to send campaign");
    } finally {
      setSending(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledFor) {
      alert("Please select a date and time");
      return;
    }
    setSending(true);
    try {
      const response = await fetch(`/api/sms-campaigns/${params.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledFor }),
      });
      if (response.ok) {
        alert("✅ SMS campaign scheduled!");
        setShowScheduleModal(false);
        setScheduledFor("");
        fetchCampaign();
      } else {
        alert("❌ Failed to schedule campaign");
      }
    } catch (error) {
      alert("❌ Failed to schedule campaign");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!campaign) {
    return <div className="p-6">Campaign not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
          <p className="text-gray-600 mt-1">SMS Campaign Details</p>
        </div>
        <div className="flex gap-3">
          {!editing && campaign.status === "DRAFT" && (
            <>
              <button
                onClick={handleSendNow}
                disabled={sending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {sending ? "⏳ Sending..." : "📱 Send Now"}
              </button>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                📅 Schedule
              </button>
            </>
          )}
          {!editing && campaign.status === "DRAFT" && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ✏️ Edit
            </button>
          )}
          <Link
            href="/dashboard/sms"
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        {editing ? (
          <>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Campaign Name
              </label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Message
              </label>
              <textarea
                value={formData.message || ""}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={4}
                maxLength={160}
                className="w-full px-4 py-2 border rounded-lg mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                {(formData.message || "").length}/160 characters
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={saveCampaign}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData(campaign);
                }}
                className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Status
              </label>
              <p className="text-gray-900">{campaign.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Recipients
              </label>
              <p className="text-gray-900">{campaign.totalRecipients || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Message Preview
              </label>
              <p className="text-gray-900 bg-gray-50 p-4 rounded">
                {campaign.message}
              </p>
            </div>
            {campaign.scheduledFor && (
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Scheduled For
                </label>
                <p className="text-gray-900">
                  {new Date(campaign.scheduledFor).toLocaleString()}
                </p>
              </div>
            )}
            {campaign.sentAt && (
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Sent At
                </label>
                <p className="text-gray-900">
                  {new Date(campaign.sentAt).toLocaleString()}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              📅 Schedule SMS Campaign
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSchedule}
                  disabled={sending}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {sending ? "⏳ Scheduling..." : "Schedule"}
                </button>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setScheduledFor("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
