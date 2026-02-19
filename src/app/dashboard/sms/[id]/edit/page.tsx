"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditSmsCampaignPage() {
  const router = useRouter();
  const params = useParams()!;
  const [formData, setFormData] = useState({
    name: "",
    message: "",
    scheduledFor: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/sms/campaigns/${params.id}`);
      if (response.ok) {
        const json = await response.json();
        const campaign = json.data;
        setFormData({
          name: campaign.name,
          message: campaign.message,
          scheduledFor: campaign.scheduledAt
            ? new Date(campaign.scheduledAt).toISOString().slice(0, 16)
            : "",
        });
        setCharCount(campaign.message.length);
      }
    } catch (error) {
      console.error("Failed to fetch campaign:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "message") {
      setCharCount(value.length);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/sms/campaigns/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        setError("Failed to update campaign");
        setSaving(false);
        return;
      }

      router.push(`/dashboard/sms/${params.id}`);
    } catch (err) {
      setError("An error occurred");
      setSaving(false);
    }
  };

  const messageCount = Math.ceil(charCount / 160);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Edit SMS Campaign
          </h1>
          <p className="text-gray-600 mt-1">Update your SMS campaign</p>
        </div>
        <Link
          href={`/dashboard/sms/${params.id}`}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Campaign Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="flex justify-between items-center mt-2 text-sm">
              <span
                className={
                  charCount > 160 ? "text-orange-600" : "text-gray-500"
                }
              >
                {charCount} characters • {messageCount} message
                {messageCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="scheduledFor"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Send Date & Time (Optional)
            </label>
            <input
              id="scheduledFor"
              name="scheduledFor"
              type="datetime-local"
              value={formData.scheduledFor}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <Link
              href={`/dashboard/sms/${params.id}`}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
