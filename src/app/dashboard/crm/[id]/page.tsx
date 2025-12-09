"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  lastContact: string;
  dealValue: number;
  notes?: string;
  tags?: string[];
  address?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

interface Activity {
  id: string;
  type: "email" | "call" | "meeting" | "note";
  description: string;
  timestamp: string;
  user: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  items: any[];
  orderDate: string;
}

export default function CRMContactDetailPage() {
  const { backgroundColor, primaryColor } = useTheme();
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "activity"
  >("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});

  useEffect(() => {
    if (contactId) {
      fetchContactDetails();
    }
  }, [contactId]);

  const fetchContactDetails = async () => {
    try {
      setLoading(true);

      // Fetch contact details
      const contactResponse = await fetch(`/api/crm/contacts?id=${contactId}`);
      console.log("Contact response status:", contactResponse.status);

      if (contactResponse.ok) {
        const contactData = await contactResponse.json();
        console.log("Contact data:", contactData);
        setContact(contactData);
        setEditForm(contactData);

        // Orders are already included in the contact data
        if (contactData.orders) {
          setOrders(contactData.orders);
        }
      } else {
        const errorText = await contactResponse.text();
        console.error("Failed to fetch contact:", errorText);
        alert("Failed to load contact details. Please try again.");
      }

      // Fetch activities (mock for now)
      setActivities([
        {
          id: "1",
          type: "email",
          description: "Sent welcome email",
          timestamp: new Date().toISOString(),
          user: "System",
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch contact details:", error);
      alert("An error occurred while loading contact details.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/crm/contacts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contactId, ...editForm }),
      });

      if (response.ok) {
        const updated = await response.json();
        setContact(updated);
        setIsEditing(false);
        alert("Contact updated successfully!");
      }
    } catch (error) {
      console.error("Failed to update contact:", error);
      alert("Failed to update contact");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const response = await fetch(`/api/crm/contacts?id=${contactId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Contact deleted successfully!");
        router.push("/dashboard/crm");
      }
    } catch (error) {
      console.error("Failed to delete contact:", error);
      alert("Failed to delete contact");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Contact Not Found
          </h2>
          <Link
            href="/dashboard/crm"
            className="text-blue-600 hover:text-blue-800"
          >
            Back to CRM
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/dashboard/crm"
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <span>←</span>
              <span>Back to CRM</span>
            </Link>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-2 text-white rounded-lg hover:opacity-90"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm(contact);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Contact Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="text-3xl font-bold text-gray-900 border-b-2 border-gray-300 focus:border-blue-500 outline-none"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-gray-900">
                      {contact.name}
                    </h1>
                  )}
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.company || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, company: e.target.value })
                      }
                      className="text-gray-600 mt-1 border-b border-gray-300 focus:border-blue-500 outline-none"
                    />
                  ) : (
                    <p className="text-gray-600 mt-1">{contact.company}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    contact.status === "active"
                      ? "bg-green-100 text-green-800"
                      : contact.status === "lead"
                      ? "bg-blue-100 text-blue-800"
                      : contact.status === "closed"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {contact.status}
                </span>
              </div>
            </div>

            {/* Contact Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t">
              <div>
                <label className="text-sm text-gray-500">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="block mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  />
                ) : (
                  <p className="text-gray-900 font-medium mt-1">
                    {contact.email}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-500">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editForm.phone || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    className="block mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  />
                ) : (
                  <p className="text-gray-900 font-medium mt-1">
                    {contact.phone}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-500">Deal Value</label>
                <p className="text-gray-900 font-medium mt-1">
                  ${contact.dealValue.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Purchase History Summary */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Purchase History
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <label className="text-sm text-blue-600 font-medium">
                    Total Orders
                  </label>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {orders.length}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <label className="text-sm text-green-600 font-medium">
                    Total Spent
                  </label>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    $
                    {orders
                      .reduce((sum, order) => sum + order.total, 0)
                      .toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <label className="text-sm text-purple-600 font-medium">
                    Last Order
                  </label>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {orders.length > 0
                      ? new Date(
                          Math.max(
                            ...orders.map((o) => new Date(o.orderDate).getTime())
                          )
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Never"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === "orders"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Orders ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === "activity"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Activity
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.address || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              address: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          placeholder="Enter address"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {contact.address || "Not provided"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      {isEditing ? (
                        <input
                          type="url"
                          value={editForm.website || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              website: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          placeholder="Enter website"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {contact.website || "Not provided"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editForm.notes || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, notes: e.target.value })
                      }
                      rows={4}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Add notes about this contact..."
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {contact.notes || "No notes available"}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Created
                    </label>
                    <p className="text-gray-900">
                      {new Date(contact.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Updated
                    </label>
                    <p className="text-gray-900">
                      {new Date(contact.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Order History
                </h3>
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No orders found for this contact</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              Order {order.orderNumber}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.orderDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              ${order.total.toFixed(2)}
                            </p>
                            <span
                              className={`inline-block px-2 py-1 text-xs rounded-full ${
                                order.status === "DELIVERED"
                                  ? "bg-green-100 text-green-800"
                                  : order.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>
                        {order.items && order.items.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-sm text-gray-600">
                              {order.items.length} item
                              {order.items.length > 1 ? "s" : ""}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Activity Timeline
                </h3>
                {activities.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No activity recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            {activity.type === "email" && "📧"}
                            {activity.type === "call" && "📞"}
                            {activity.type === "meeting" && "🤝"}
                            {activity.type === "note" && "📝"}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">
                            {activity.description}
                          </p>
                          <p className="text-sm text-gray-500">
                            {activity.user} •{" "}
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
