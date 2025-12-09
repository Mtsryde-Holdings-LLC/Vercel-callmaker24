"use client";

import { useState, useEffect } from "react";

export default function ShopifyIntegrationPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [integration, setIntegration] = useState<any>(null);
  const [stats, setStats] = useState({ customers: 0, products: 0, orders: 0 });

  useEffect(() => {
    fetchIntegration();
  }, []);

  const fetchIntegration = async () => {
    try {
      const res = await fetch("/api/integrations?platform=SHOPIFY");
      if (res.ok) {
        const data = await res.json();
        setIntegration(data.integration);
      }
    } catch (error) {
      console.error("Failed to fetch integration:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = "/api/integrations/shopify/auth";
  };

  const handleSync = async (autoRepeat = false) => {
    setSyncing(true);
    let totalSynced = 0;
    let totalOrders = 0;
    let batchCount = 0;

    try {
      do {
        const res = await fetch("/api/integrations/shopify/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: integration.organizationId,
            shop: integration.credentials.shop,
            accessToken: integration.credentials.accessToken,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          const errorMsg = data.hint
            ? `${data.error}\n\n${data.hint}`
            : data.error || "Unknown error";
          alert("❌ Sync Failed\n\n" + errorMsg);
          console.error("Shopify sync error:", data);
          break;
        }

        totalSynced += data.synced.customers || 0;
        totalOrders += data.synced.orders || 0;
        batchCount++;
        setStats({
          customers: totalSynced,
          products: 0,
          orders: totalOrders,
        });

        // If not auto-repeat, stop after one batch
        if (!autoRepeat) break;

        // If synced 0 customers and 0 orders, we're done
        if (
          (data.synced.customers || 0) === 0 &&
          (data.synced.orders || 0) === 0
        )
          break;

        // Small delay between batches
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } while (autoRepeat);

      if (totalSynced === 0 && totalOrders === 0) {
        alert(
          "⚠️ No data synced\n\nYour Shopify store may be empty, or there may be a connection issue. Check:\n\n1. Store has customers/orders\n2. API credentials are correct\n3. API permissions include read access"
        );
      } else {
        alert(
          `✅ Sync Complete!\n\n${totalSynced} customers\n${totalOrders} orders\nCompleted in ${batchCount} batch${
            batchCount > 1 ? "es" : ""
          }`
        );
      }
    } catch (error: any) {
      alert("❌ Sync Failed\n\n" + (error.message || "Network error"));
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Shopify?")) return;
    try {
      await fetch("/api/integrations?platform=SHOPIFY", { method: "DELETE" });
      setIntegration(null);
    } catch (error) {
      alert("Failed to disconnect");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Shopify Integration</h1>

      {!integration ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🛍️</div>
          <h2 className="text-2xl font-bold mb-4">
            Connect Your Shopify Store
          </h2>
          <p className="text-gray-600 mb-6">
            Sync customers, products, and orders from your Shopify store
          </p>
          <button
            onClick={handleConnect}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
          >
            Connect Shopify Store
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Connected Store</h2>
                <p className="text-gray-600">{integration.credentials?.shop}</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Active
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Customers</p>
                <p className="text-2xl font-bold">{stats.customers}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Products</p>
                <p className="text-2xl font-bold">{stats.products}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Orders</p>
                <p className="text-2xl font-bold">{stats.orders}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleSync(false)}
                disabled={syncing}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
              >
                {syncing ? "Syncing..." : "Sync 500"}
              </button>
              <button
                onClick={() => handleSync(true)}
                disabled={syncing}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
              >
                {syncing ? "Syncing..." : "Sync All"}
              </button>
              <button
                onClick={handleDisconnect}
                className="px-6 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-semibold"
              >
                Disconnect
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold mb-4">Sync Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="mr-3" />
                <span>Auto-sync customers</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="mr-3" />
                <span>Auto-sync products</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="mr-3" />
                <span>Auto-sync orders</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
