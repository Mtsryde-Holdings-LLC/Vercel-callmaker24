"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Customer {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  tags?: string[];
  loyaltyMember?: boolean;
  orderCount?: number;
  totalSpent?: number;
  lastOrderAt?: string;
  abandonedCarts?: any[];
  activities?: any[];
}

function CreateEmailCampaignPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    fromName: "",
    fromEmail: "",
    replyTo: "",
    preheader: "",
    content: "",
    scheduledFor: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [filterInteraction, setFilterInteraction] = useState("ALL");

  useEffect(() => {
    fetchCustomers();

    // Check if a template was selected
    const templateId = searchParams?.get("template");
    if (templateId) {
      const templateData = localStorage.getItem("selectedEmailTemplate");
      if (templateData) {
        const template = JSON.parse(templateData);
        setFormData((prev) => ({
          ...prev,
          name: template.name,
          subject: template.subject,
          preheader: template.preheader,
          content: template.content,
        }));
        // Clean up
        localStorage.removeItem("selectedEmailTemplate");
      }
    }
  }, [searchParams]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const result = await response.json();
        setCustomers(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!c.email) return false;

    const matchesSearch =
      c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.name && c.name.toLowerCase().includes(customerSearch.toLowerCase())) ||
      (c.firstName &&
        c.firstName.toLowerCase().includes(customerSearch.toLowerCase()));

    if (!matchesSearch) return false;

    // Interaction filters
    switch (filterInteraction) {
      case "PURCHASED":
        return (c.orderCount || 0) > 0;
      case "NEVER_PURCHASED":
        return (c.orderCount || 0) === 0;
      case "HIGH_VALUE":
        return (c.totalSpent || 0) >= 500;
      case "ABANDONED_CART":
        return (c.abandonedCarts?.length || 0) > 0;
      case "RECENT_ACTIVITY":
        if (!c.lastOrderAt) return false;
        const daysSinceOrder =
          (Date.now() - new Date(c.lastOrderAt).getTime()) /
          (1000 * 60 * 60 * 24);
        return daysSinceOrder <= 30;
      case "INACTIVE":
        if (!c.lastOrderAt) return true;
        const daysSinceLastOrder =
          (Date.now() - new Date(c.lastOrderAt).getTime()) /
          (1000 * 60 * 60 * 24);
        return daysSinceLastOrder > 90;
      case "LOYALTY_MEMBERS":
        return c.loyaltyMember === true;
      case "NON_MEMBERS":
        return !c.loyaltyMember;
      default:
        return true;
    }
  });

  const toggleCustomer = (id: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    setSelectedCustomers(filteredCustomers.map((c) => c.id));
  };

  const clearAll = () => {
    setSelectedCustomers([]);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      setError("Please enter a prompt for the AI");
      return;
    }

    setAiLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          subject: formData.subject,
          campaignName: formData.name,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to generate content");
        setAiLoading(false);
        return;
      }

      const data = await response.json();
      setFormData({ ...formData, content: data.content });
      setAiPrompt("");
      setShowAiPanel(false);
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (selectedCustomers.length === 0) {
      setError("Please select at least one recipient");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/email/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          recipients: selectedCustomers,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create campaign");
        setLoading(false);
        return;
      }

      const campaign = await response.json();
      router.push(`/dashboard/email/campaigns/${campaign.id}`);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Create Email Campaign
          </h1>
          <p className="text-gray-600 mt-1">
            Design and send email marketing campaigns
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/email/templates"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            📧 Browse Templates
          </Link>
          <Link
            href="/dashboard/email"
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Campaign Details
            </h2>
            <div className="space-y-4">
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
                  placeholder="e.g., Summer Sale 2024"
                />
              </div>

              {/* Recipients Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipients * ({selectedCustomers.length} selected)
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomerSelect(!showCustomerSelect)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 transition text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      {selectedCustomers.length === 0
                        ? "👥 Click to select customers from your database"
                        : `✓ ${selectedCustomers.length} customer${
                            selectedCustomers.length > 1 ? "s" : ""
                          } selected`}
                    </span>
                    <span className="text-2xl">
                      {showCustomerSelect ? "▼" : "▶"}
                    </span>
                  </div>
                </button>

                {showCustomerSelect && (
                  <div className="mt-4 border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="space-y-3 mb-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="🔍 Search by name or email..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <select
                          value={filterInteraction}
                          onChange={(e) => setFilterInteraction(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg bg-white min-w-[200px]"
                        >
                          <option value="ALL">👥 All Customers</option>
                          <option value="PURCHASED">🛍️ Has Purchased</option>
                          <option value="NEVER_PURCHASED">
                            🆕 Never Purchased
                          </option>
                          <option value="HIGH_VALUE">
                            💎 High Value ($500+)
                          </option>
                          <option value="ABANDONED_CART">
                            🛒 Abandoned Cart
                          </option>
                          <option value="RECENT_ACTIVITY">
                            ⚡ Active (30 days)
                          </option>
                          <option value="INACTIVE">
                            😴 Inactive (90+ days)
                          </option>
                          <option value="LOYALTY_MEMBERS">
                            🏆 Loyalty Members
                          </option>
                          <option value="NON_MEMBERS">📋 Non-Members</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selectAll}
                          className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                        >
                          ✓ Select All ({filteredCustomers.length})
                        </button>
                        <button
                          type="button"
                          onClick={clearAll}
                          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                        >
                          ✗ Clear
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {filteredCustomers.map((customer) => {
                        const displayName =
                          customer.name ||
                          `${customer.firstName || ""} ${
                            customer.lastName || ""
                          }`.trim();
                        return (
                          <label
                            key={customer.id}
                            className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCustomers.includes(customer.id)}
                              onChange={() => toggleCustomer(customer.id)}
                              className="w-4 h-4 text-primary-600 rounded mr-3"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {displayName}
                                </span>
                                {customer.loyaltyMember && (
                                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                    🏆 Member
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                {customer.email}
                              </div>
                            </div>
                            {customer.tags && customer.tags.length > 0 && (
                              <div className="flex gap-1">
                                {customer.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Subject *
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Get 50% off summer essentials!"
                />
              </div>

              <div>
                <label
                  htmlFor="preheader"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Preheader Text
                </label>
                <input
                  id="preheader"
                  name="preheader"
                  type="text"
                  value={formData.preheader}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Preview text that appears after the subject line"
                />
              </div>
            </div>
          </div>

          {/* Sender Information */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Sender Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="fromName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  From Name *
                </label>
                <input
                  id="fromName"
                  name="fromName"
                  type="text"
                  value={formData.fromName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Your Company"
                />
              </div>

              <div>
                <label
                  htmlFor="fromEmail"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  From Email *
                </label>
                <input
                  id="fromEmail"
                  name="fromEmail"
                  type="email"
                  value={formData.fromEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="hello@yourcompany.com"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="replyTo"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Reply-To Email
                </label>
                <input
                  id="replyTo"
                  name="replyTo"
                  type="email"
                  value={formData.replyTo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="support@yourcompany.com"
                />
              </div>
            </div>
          </div>

          {/* Email Content */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Email Content
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      subject: "Join Our Exclusive Loyalty Rewards Program!",
                      content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #7c3aed; text-align: center;">🏆 You're Invited!</h1>
  <h2 style="text-align: center; color: #333;">Join Our Loyalty Rewards Program</h2>
  
  <p style="font-size: 16px; line-height: 1.6; color: #555;">Dear Valued Customer,</p>
  
  <p style="font-size: 16px; line-height: 1.6; color: #555;">
    We're excited to invite you to join our exclusive Loyalty Rewards Program! As a member, you'll enjoy:
  </p>
  
  <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
    <ul style="list-style: none; padding: 0;">
      <li style="padding: 10px 0; font-size: 16px;">✅ Earn points on every purchase</li>
      <li style="padding: 10px 0; font-size: 16px;">✅ Exclusive member-only discounts</li>
      <li style="padding: 10px 0; font-size: 16px;">🎂 Birthday rewards and special occasion bonuses</li>
      <li style="padding: 10px 0; font-size: 16px;">✅ Early access to sales and new products</li>
      <li style="padding: 10px 0; font-size: 16px;">✅ Free shipping on select orders</li>
    </ul>
  </div>
  
  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
    <p style="margin: 0; font-size: 14px; color: #92400e;">
      <strong>🎉 Special Birthday Bonus!</strong><br>
      Share your birthday when you sign up and receive exclusive birthday rewards every year!
    </p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{loyalty_signup_url}}" style="background: linear-gradient(to right, #7c3aed, #3b82f6); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">
      Join Now - It's Free!
    </a>
  </div>
  
  <p style="font-size: 16px; line-height: 1.6; color: #555;">
    Start earning rewards today and unlock exclusive benefits reserved just for our loyal customers!
  </p>
  
  <p style="font-size: 16px; line-height: 1.6; color: #555;">
    Best regards,<br>
    <strong>Your Company Team</strong>
  </p>
  
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
    <p>Questions? Contact us at support@yourcompany.com</p>
  </div>
</div>`,
                    });
                  }}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <span className="mr-2">🏆</span>
                  Loyalty Invite
                </button>
                <button
                  type="button"
                  onClick={() => setShowAiPanel(!showAiPanel)}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition"
                >
                  <span className="mr-2">✨</span>
                  AI Write
                </button>
              </div>
            </div>

            {/* AI Writing Panel */}
            {showAiPanel && (
              <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  AI Email Generator
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Describe your email campaign and let AI craft professional
                  content for you
                </p>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3"
                  placeholder="Example: Write a promotional email for our summer sale with 50% off all products. Emphasize limited time offer and include a friendly, exciting tone..."
                />
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">✨</span>
                        Generate Email
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAiPanel(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Body *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                placeholder="Enter your email content here (HTML supported)..."
              />
              <p className="mt-2 text-sm text-gray-500">
                You can use HTML to format your email content or use AI to
                generate it
              </p>
            </div>
          </div>

          {/* Scheduling */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Schedule
            </h2>
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
              <p className="mt-2 text-sm text-gray-500">
                Leave empty to save as draft, or select a date/time to schedule
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <Link
              href="/dashboard/email"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save as Draft"}
            </button>
            {formData.scheduledFor && (
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  if (selectedCustomers.length === 0) {
                    setError("Please select at least one recipient");
                    return;
                  }
                  setLoading(true);
                  try {
                    const response = await fetch("/api/email/campaigns", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        ...formData,
                        recipients: selectedCustomers,
                      }),
                    });
                    if (response.ok) {
                      const campaign = await response.json();
                      router.push(`/dashboard/email/campaigns/${campaign.id}`);
                    } else {
                      setError("Failed to schedule campaign");
                    }
                  } catch (err) {
                    setError("An error occurred");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Scheduling..." : "⏰ Schedule"}
              </button>
            )}
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                if (selectedCustomers.length === 0) {
                  setError("Please select at least one recipient");
                  return;
                }
                setLoading(true);
                try {
                  const response = await fetch("/api/email/campaigns", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...formData,
                      recipients: selectedCustomers,
                      sendNow: true,
                    }),
                  });
                  if (response.ok) {
                    const campaign = await response.json();
                    router.push(`/dashboard/email/campaigns/${campaign.id}`);
                  } else {
                    setError("Failed to send campaign");
                  }
                } catch (err) {
                  setError("An error occurred");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "📤 Send Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateEmailCampaignPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateEmailCampaignPageContent />
    </Suspense>
  );
}
