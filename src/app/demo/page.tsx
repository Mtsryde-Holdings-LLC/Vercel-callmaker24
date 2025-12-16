"use client";

import { useState, useEffect } from "react";

const sampleCustomers = [
  { id: "cust_001", name: "Sarah Johnson", email: "sarah.johnson@email.com", phone: "+1 (555) 123-4567", totalSpent: 1249.99, orderCount: 8, status: "VIP", lastOrder: "2 days ago", tags: ["repeat-buyer", "email-subscriber"] },
  { id: "cust_002", name: "Michael Chen", email: "m.chen@company.com", phone: "+1 (555) 987-6543", totalSpent: 459.50, orderCount: 3, status: "Active", lastOrder: "1 week ago", tags: ["new-customer"] },
  { id: "cust_003", name: "Emma Williams", email: "emma.w@gmail.com", phone: "+1 (555) 456-7890", totalSpent: 2150.00, orderCount: 15, status: "VIP", lastOrder: "Today", tags: ["loyalty-member", "sms-subscriber"] },
];

const sampleOrders = [
  { id: "#1001", customer: "Sarah Johnson", total: "$149.99", status: "Fulfilled", statusColor: "bg-green-100 text-green-800", items: 3, shipping: "123 Main St, New York, NY 10001", tracking: "1Z999AA10123456784", date: "Dec 14, 2024" },
  { id: "#1002", customer: "Michael Chen", total: "$89.50", status: "Processing", statusColor: "bg-yellow-100 text-yellow-800", items: 2, shipping: "456 Oak Ave, Los Angeles, CA 90001", tracking: null, date: "Dec 15, 2024" },
  { id: "#1003", customer: "Emma Williams", total: "$299.00", status: "Paid", statusColor: "bg-blue-100 text-blue-800", items: 5, shipping: "789 Pine Rd, Chicago, IL 60601", tracking: null, date: "Dec 16, 2024" },
];

const sampleWebhookEvents = [
  { type: "order", event: "orders/create", shop: "callmaker-24", time: "2s ago", status: "success" },
  { type: "customer", event: "customers/update", shop: "callmaker-24", time: "15s ago", status: "success" },
  { type: "product", event: "products/update", shop: "callmaker-24", time: "1m ago", status: "success" },
  { type: "order", event: "orders/paid", shop: "callmaker-24", time: "2m ago", status: "success" },
  { type: "checkout", event: "checkouts/create", shop: "callmaker-24", time: "5m ago", status: "success" },
];

const sampleCampaigns = [
  { name: "Holiday Sale 2024", type: "Email", sent: 2450, opened: 1823, clicked: 456, status: "Completed" },
  { name: "Abandoned Cart Recovery", type: "Email", sent: 189, opened: 142, clicked: 67, status: "Active" },
  { name: "Flash Sale Alert", type: "SMS", sent: 1200, opened: null, clicked: 312, status: "Completed" },
  { name: "New Arrivals", type: "Email", sent: 0, opened: 0, clicked: 0, status: "Scheduled" },
];

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [webhookEvents, setWebhookEvents] = useState(sampleWebhookEvents);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<typeof sampleCustomers[0] | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<typeof sampleOrders[0] | null>(null);

  useEffect(() => {
    if (isSimulating) {
      const interval = setInterval(() => {
        const events = [
          { type: "order", event: "orders/create", shop: "demo-store", time: "just now", status: "success" },
          { type: "customer", event: "customers/create", shop: "demo-store", time: "just now", status: "success" },
          { type: "product", event: "products/update", shop: "demo-store", time: "just now", status: "success" },
          { type: "order", event: "orders/fulfilled", shop: "demo-store", time: "just now", status: "success" },
        ];
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        setWebhookEvents((prev) => [randomEvent, ...prev.slice(0, 9)]);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isSimulating]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Callmaker24</h1>
                <p className="text-xs text-gray-500">Interactive Demo</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">Demo Mode</span>
              <a href="https://apps.shopify.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">Install App</a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Callmaker24 Demo</h2>
              <p className="text-indigo-100 max-w-2xl">Explore how Callmaker24 syncs your Shopify customers, orders, and products in real-time. See our powerful marketing automation and analytics features in action.</p>
            </div>
            <button onClick={() => setIsSimulating(!isSimulating)} className={`px-6 py-3 rounded-lg font-medium transition whitespace-nowrap ${isSimulating ? "bg-white text-indigo-600" : "bg-indigo-500 text-white hover:bg-indigo-400"}`}>
              {isSimulating ? "Stop Simulation" : "Start Live Demo"}
            </button>
          </div>
        </div>

        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8 overflow-x-auto">
          {[{ id: "dashboard", label: "Dashboard" }, { id: "customers", label: "Customers" }, { id: "orders", label: "Orders" }, { id: "campaigns", label: "Campaigns" }, { id: "webhooks", label: "Webhooks" }].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === tab.id ? "bg-white text-gray-900 shadow" : "text-gray-600 hover:text-gray-900"}`}>{tab.label}</button>
          ))}
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Customers" value="2,847" change="+12.5%" positive />
              <StatCard title="Total Orders" value="1,234" change="+8.2%" positive />
              <StatCard title="Revenue" value="$48,294" change="+23.1%" positive />
              <StatCard title="Email Open Rate" value="42.8%" change="+5.3%" positive />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {[65, 45, 78, 52, 89, 67, 94, 71, 83, 56, 91, 85].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t" style={{ height: `${h}%` }} />
                      <span className="text-xs text-gray-500 mt-2">{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h3>
                <div className="space-y-4">
                  <SegmentBar label="VIP Customers" value={342} total={2847} color="bg-purple-500" />
                  <SegmentBar label="Repeat Buyers" value={1256} total={2847} color="bg-indigo-500" />
                  <SegmentBar label="New Customers" value={589} total={2847} color="bg-blue-500" />
                  <SegmentBar label="At Risk" value={234} total={2847} color="bg-orange-500" />
                  <SegmentBar label="Inactive" value={426} total={2847} color="bg-gray-400" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {webhookEvents.slice(0, 5).map((event, i) => (
                  <ActivityRow key={i} event={event} isNew={i === 0 && isSimulating} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "customers" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Customer Management</h2>
                <p className="text-gray-500">Synced automatically from your Shopify store</p>
              </div>
              <div className="flex space-x-3">
                <input type="text" placeholder="Search customers..." className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Export</button>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sampleCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">{c.name.charAt(0)}</div>
                          <div className="ml-4">
                            <p className="font-medium text-gray-900">{c.name}</p>
                            <p className="text-sm text-gray-500">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-medium">${c.totalSpent.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-600">{c.orderCount}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded ${c.status === "VIP" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"}`}>{c.status}</span></td>
                      <td className="px-6 py-4"><button onClick={() => setSelectedCustomer(c)} className="text-indigo-600 hover:text-indigo-900 font-medium">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedCustomer && <CustomerModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Order Management</h2>
              <p className="text-gray-500">Complete order data with shipping and transaction details</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sampleOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{o.id}</td>
                      <td className="px-6 py-4 text-gray-600">{o.customer}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{o.total}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded ${o.statusColor}`}>{o.status}</span></td>
                      <td className="px-6 py-4"><button onClick={() => setSelectedOrder(o)} className="text-indigo-600 hover:text-indigo-900 font-medium">Details</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedOrder && <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
          </div>
        )}

        {activeTab === "campaigns" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Marketing Campaigns</h2>
                <p className="text-gray-500">Email and SMS campaigns powered by your Shopify data</p>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create Campaign</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Emails Sent (30d)" value="12,450" change="+15%" positive />
              <StatCard title="Average Open Rate" value="42.8%" change="+3.2%" positive />
              <StatCard title="SMS Click Rate" value="26%" change="+5.1%" positive />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opened</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sampleCampaigns.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded ${c.type === "Email" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>{c.type}</span></td>
                      <td className="px-6 py-4 text-gray-600">{c.sent.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-600">{c.opened !== null ? c.opened.toLocaleString() : "-"}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded ${c.status === "Active" ? "bg-green-100 text-green-800" : c.status === "Completed" ? "bg-gray-100 text-gray-800" : "bg-yellow-100 text-yellow-800"}`}>{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "webhooks" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Webhook Activity</h2>
                <p className="text-gray-500">Real-time data sync from your Shopify store</p>
              </div>
              <button onClick={() => setIsSimulating(!isSimulating)} className={`px-4 py-2 rounded-lg font-medium ${isSimulating ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                {isSimulating ? "Stop Simulation" : "Simulate Events"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard title="Total Webhooks (24h)" value="1,247" change="" positive />
              <StatCard title="Success Rate" value="99.8%" change="" positive />
              <StatCard title="Avg Response Time" value="127ms" change="" positive />
              <StatCard title="Failed (24h)" value="3" change="" positive={false} />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Live Event Feed</h3>
              </div>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {webhookEvents.map((event, i) => (
                  <ActivityRow key={i} event={event} isNew={i === 0 && isSimulating} showShop />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-center md:text-left">This is an interactive demo. Install Callmaker24 to sync your real Shopify data.</p>
            <a href="https://apps.shopify.com" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Get Started Free</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ title, value, change, positive }: { title: string; value: string; change: string; positive: boolean }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {change && <p className={`text-sm mt-1 ${positive ? "text-green-600" : "text-red-600"}`}>{change} vs last month</p>}
    </div>
  );
}

function SegmentBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-900 font-medium">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${(value / total) * 100}%` }} />
      </div>
    </div>
  );
}

function ActivityRow({ event, isNew, showShop }: { event: { type: string; event: string; shop: string; time: string; status: string }; isNew?: boolean; showShop?: boolean }) {
  const colors: Record<string, string> = { order: "bg-green-100 text-green-600", customer: "bg-blue-100 text-blue-600", product: "bg-purple-100 text-purple-600", checkout: "bg-orange-100 text-orange-600" };
  const icons: Record<string, string> = { order: "O", customer: "C", product: "P", checkout: "K" };
  return (
    <div className={`px-6 py-4 flex items-center justify-between ${isNew ? "bg-green-50 animate-pulse" : ""}`}>
      <div className="flex items-center space-x-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[event.type] || "bg-gray-100 text-gray-600"}`}>{icons[event.type] || "?"}</div>
        <div>
          <p className="font-medium text-gray-900">{event.event}</p>
          {showShop && <p className="text-sm text-gray-500">{event.shop}.myshopify.com</p>}
        </div>
      </div>
      <div className="text-right">
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">{event.status}</span>
        <p className="text-sm text-gray-500 mt-1">{event.time}</p>
      </div>
    </div>
  );
}

function CustomerModal({ customer, onClose }: { customer: typeof sampleCustomers[0]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-2xl">{customer.name.charAt(0)}</div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{customer.name}</h3>
              <p className="text-gray-500">{customer.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Total Spent</p>
            <p className="text-2xl font-bold text-gray-900">${customer.totalSpent.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Orders</p>
            <p className="text-2xl font-bold text-gray-900">{customer.orderCount}</p>
          </div>
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Phone</span>
            <span className="text-gray-900">{customer.phone}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Status</span>
            <span className="text-gray-900">{customer.status}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Tags</span>
            <div className="flex flex-wrap gap-2 justify-end">
              {customer.tags.map((tag) => (<span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">{tag}</span>))}
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Send Email</button>
          <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Send SMS</button>
        </div>
      </div>
    </div>
  );
}

function OrderModal({ order, onClose }: { order: typeof sampleOrders[0]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Order {order.id}</h3>
            <p className="text-gray-500">{order.date}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Shipping Address</h4>
            <p className="text-gray-600">{order.customer}</p>
            <p className="text-gray-600">{order.shipping}</p>
          </div>
          {order.tracking && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Tracking Number</h4>
              <p className="text-blue-600 font-mono">{order.tracking}</p>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Status</span>
            <span className={`px-2 py-1 text-xs font-medium rounded ${order.statusColor}`}>{order.status}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Total</span>
            <span className="font-medium text-gray-900">{order.total}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Items</span>
            <span className="text-gray-900">{order.items} items</span>
          </div>
        </div>
        <button onClick={onClose} className="w-full mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Close</button>
      </div>
    </div>
  );
}
