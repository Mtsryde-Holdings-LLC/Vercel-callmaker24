"use client";

/**
 * Shopify Embedded App — Main Page
 *
 * This is the entry point when Shopify loads our app inside the admin iframe.
 * Shopify sends ?shop=xxx&host=xxx&session=... query parameters.
 *
 * Flow:
 * 1. Shopify admin loads this page in an iframe with ?shop=&host=
 * 2. We check if we have an access token for this shop
 * 3. If not → redirect to OAuth install flow
 * 4. If yes → render the embedded app dashboard
 * 5. App Bridge handles session tokens automatically
 */

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

// We'll use App Bridge from window.shopify (loaded via CDN in layout.tsx)
declare global {
  interface Window {
    shopify?: {
      idToken: () => Promise<string>;
      toast: {
        show: (
          message: string,
          options?: { isError?: boolean; duration?: number },
        ) => void;
      };
      loading: (show: boolean) => void;
    };
  }
}

interface ShopStatus {
  connected: boolean;
  shop: string;
  syncedCustomers: number;
  syncedOrders: number;
  lastSync: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
}

export default function ShopifyEmbeddedPage() {
  const searchParams = useSearchParams();
  const shop = searchParams?.get("shop") ?? null;
  const host = searchParams?.get("host") ?? null;

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ShopStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  /**
   * Get a session token from App Bridge for authenticated API calls.
   */
  const getSessionToken = useCallback(async (): Promise<string | null> => {
    try {
      if (window.shopify) {
        return await window.shopify.idToken();
      }
      return null;
    } catch (err) {
      console.error("Failed to get session token:", err);
      return null;
    }
  }, []);

  /**
   * Make an authenticated API call using App Bridge session tokens.
   */
  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = await getSessionToken();
      if (!token) {
        throw new Error(
          "No session token available. App Bridge may not be loaded.",
        );
      }

      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    },
    [getSessionToken],
  );

  /**
   * Check the connection status for this shop.
   */
  useEffect(() => {
    async function checkStatus() {
      if (!shop) {
        setError(
          "No shop parameter provided. This app must be opened from the Shopify admin.",
        );
        setLoading(false);
        return;
      }

      try {
        // First try with session token (embedded context)
        const token = await getSessionToken();

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(
          `/api/shopify/status?shop=${encodeURIComponent(shop)}`,
          { headers },
        );

        if (res.status === 401 || res.status === 403) {
          // Not authenticated – need to install/re-auth
          window.location.href = `/api/shopify/install?shop=${encodeURIComponent(shop)}${host ? `&host=${encodeURIComponent(host)}` : ""}`;
          return;
        }

        if (!res.ok) {
          throw new Error(`Status check failed: ${res.status}`);
        }

        const data = await res.json();
        setStatus(data.data);
      } catch (err: any) {
        console.error("Status check error:", err);
        // If we can't check status, redirect to install
        window.location.href = `/api/shopify/install?shop=${encodeURIComponent(shop)}${host ? `&host=${encodeURIComponent(host)}` : ""}`;
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
  }, [shop, host, getSessionToken]);

  /**
   * Trigger a manual sync from the embedded app.
   */
  const handleSync = async () => {
    if (!shop || syncing) return;
    setSyncing(true);

    try {
      const res = await authenticatedFetch("/api/shopify/sync", {
        method: "POST",
        body: JSON.stringify({ shop }),
      });

      const data = await res.json();

      if (!res.ok) {
        window.shopify?.toast.show(data.error || "Sync failed", {
          isError: true,
        });
        return;
      }

      const synced = data.data?.synced;
      window.shopify?.toast.show(
        `Synced ${synced?.customers || 0} customers, ${synced?.orders || 0} orders`,
      );

      // Refresh status
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              syncedCustomers: prev.syncedCustomers + (synced?.customers || 0),
              syncedOrders: prev.syncedOrders + (synced?.orders || 0),
              lastSync: new Date().toISOString(),
            }
          : prev,
      );
    } catch (err: any) {
      window.shopify?.toast.show(err.message || "Sync error", {
        isError: true,
      });
    } finally {
      setSyncing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔄</div>
          <p style={{ color: "#637381", fontSize: 14 }}>
            Loading CallMaker24...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: 24, maxWidth: 600, margin: "40px auto" }}>
        <div
          style={{
            background: "#FFF4F4",
            border: "1px solid #E32F2F",
            borderRadius: 8,
            padding: 20,
          }}
        >
          <h2 style={{ margin: "0 0 8px", color: "#E32F2F", fontSize: 16 }}>
            Error
          </h2>
          <p style={{ margin: 0, color: "#637381", fontSize: 14 }}>{error}</p>
        </div>
      </div>
    );
  }

  // Main embedded app dashboard
  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600 }}>
          CallMaker24
        </h1>
        <p style={{ margin: 0, color: "#637381", fontSize: 14 }}>
          CRM, Loyalty & Marketing Platform
        </p>
      </div>

      {/* Connection Status Card */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E1E3E5",
          borderRadius: 8,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>
              Store Connection
            </h2>
            <p style={{ margin: 0, color: "#637381", fontSize: 14 }}>
              {status?.shop || shop}
            </p>
          </div>
          <span
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 500,
              background: status?.connected ? "#AEE9D1" : "#FED3D1",
              color: status?.connected ? "#108043" : "#DE3618",
            }}
          >
            {status?.connected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ background: "#F6F6F7", padding: 12, borderRadius: 8 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "#637381" }}>
              Customers
            </p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
              {status?.syncedCustomers || 0}
            </p>
          </div>
          <div style={{ background: "#F6F6F7", padding: 12, borderRadius: 8 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "#637381" }}>
              Orders
            </p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
              {status?.syncedOrders || 0}
            </p>
          </div>
          <div style={{ background: "#F6F6F7", padding: 12, borderRadius: 8 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "#637381" }}>
              Plan
            </p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
              {status?.subscriptionTier || "FREE"}
            </p>
          </div>
        </div>

        {/* Last sync info */}
        {status?.lastSync && (
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "#919EAB" }}>
            Last synced: {new Date(status.lastSync).toLocaleString()}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              flex: 1,
              padding: "8px 16px",
              background: syncing ? "#B5B5B5" : "#008060",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 500,
              cursor: syncing ? "not-allowed" : "pointer",
            }}
          >
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard`}
            target="_top"
            style={{
              flex: 1,
              padding: "8px 16px",
              background: "#fff",
              color: "#202223",
              border: "1px solid #C9CCCF",
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 500,
              textAlign: "center",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            Open Full Dashboard
          </a>
        </div>
      </div>

      {/* Quick Links Card */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E1E3E5",
          borderRadius: 8,
          padding: 20,
        }}
      >
        <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>
          Quick Actions
        </h2>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
        >
          {[
            { label: "Customers", icon: "👥", href: "/dashboard/customers" },
            { label: "SMS Campaigns", icon: "📱", href: "/dashboard/sms" },
            { label: "Email Campaigns", icon: "📧", href: "/dashboard/email" },
            {
              label: "Loyalty Program",
              icon: "🏆",
              href: "/dashboard/loyalty",
            },
            { label: "Reports", icon: "📊", href: "/dashboard/reports" },
            { label: "Settings", icon: "⚙️", href: "/dashboard/settings" },
          ].map((item) => (
            <a
              key={item.label}
              href={`${process.env.NEXT_PUBLIC_APP_URL || ""}${item.href}`}
              target="_top"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                background: "#F6F6F7",
                borderRadius: 8,
                textDecoration: "none",
                color: "#202223",
                fontSize: 14,
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {/* Subscription Banner (if on free plan) */}
      {status?.subscriptionTier === "FREE" && (
        <div
          style={{
            background: "#FFF8E7",
            border: "1px solid #FFD79D",
            borderRadius: 8,
            padding: 16,
            marginTop: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 14,
                fontWeight: 600,
                color: "#795600",
              }}
            >
              Upgrade Your Plan
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#916A00" }}>
              Unlock unlimited campaigns, advanced analytics, and more.
            </p>
          </div>
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard/subscription`}
            target="_top"
            style={{
              padding: "6px 16px",
              background: "#008060",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            View Plans
          </a>
        </div>
      )}
    </div>
  );
}
