"use client";

import { useState, useEffect } from "react";

export default function ResponseTrackerPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [responses, setResponses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      fetchResponses();
    }
  }, [selectedCampaign]);

  const fetchCampaigns = async () => {
    const res = await fetch("/api/ivr/campaigns");
    if (res.ok) {
      const data = await res.json();
      setCampaigns(data.data || []);
    }
  };

  const fetchResponses = async () => {
    const res = await fetch(`/api/ivr/campaigns/${selectedCampaign}/responses`);
    if (res.ok) {
      const data = await res.json();
      setResponses(data.data?.responses || []);
      setStats(data.data?.stats);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Response Tracker</h1>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <label className="block text-sm font-medium mb-2">
          Select Campaign
        </label>
        <select
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        >
          <option value="">Choose a campaign...</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalResponses}
            </div>
            <div className="text-sm text-gray-600">Total Responses</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl font-bold text-green-600">
              {stats.confirmed || 0}
            </div>
            <div className="text-sm text-gray-600">Confirmed (Press 1)</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl font-bold text-orange-600">
              {stats.rescheduled || 0}
            </div>
            <div className="text-sm text-gray-600">Rescheduled (Press 2)</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl font-bold text-red-600">
              {stats.cancelled || 0}
            </div>
            <div className="text-sm text-gray-600">Cancelled (Press 3)</div>
          </div>
        </div>
      )}

      {responses.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Customer Responses</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Phone</th>
                  <th className="text-left py-3 px-4">Response</th>
                  <th className="text-left py-3 px-4">Duration</th>
                  <th className="text-left py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{r.customerName || "Unknown"}</td>
                    <td className="py-3 px-4">{r.customerPhone}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          r.response === "1"
                            ? "bg-green-100 text-green-800"
                            : r.response === "2"
                              ? "bg-orange-100 text-orange-800"
                              : r.response === "3"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {r.response === "1"
                          ? "Confirmed"
                          : r.response === "2"
                            ? "Reschedule"
                            : r.response === "3"
                              ? "Cancelled"
                              : `Pressed ${r.response}`}
                      </span>
                    </td>
                    <td className="py-3 px-4">{r.callDuration}s</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedCampaign && responses.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No responses yet for this campaign.</p>
        </div>
      )}
    </div>
  );
}
