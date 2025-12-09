"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoyaltyPortalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [step, setStep] = useState<"login" | "verifying" | "dashboard">(
    "login"
  );
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState("");

  // Auto-verify if token is in URL
  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token]);

  const requestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Try to get org from query param first, then subdomain, then use default
      let orgSlug = searchParams?.get("org");
      
      if (!orgSlug) {
        const hostname = window.location.hostname;
        const parts = hostname.split(".");
        // If subdomain exists and it's not 'www', use it
        if (parts.length > 2 && parts[0] !== "www") {
          orgSlug = parts[0];
        }
      }
      
      // If still no orgSlug, fetch the first/default organization
      if (!orgSlug) {
        const orgRes = await fetch("/api/organization");
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          orgSlug = orgData.slug;
        }
      }
      
      if (!orgSlug) {
        setError("Unable to determine organization. Please contact support.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/loyalty/portal/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
          phone: phone || undefined,
          orgSlug,
        }),
      });

      if (res.ok) {
        setStep("verifying");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send access link");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async (token: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/loyalty/portal/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        const data = await res.json();
        setSessionToken(data.sessionToken);
        setCustomer(data.customer);
        setStep("dashboard");

        // Store session in localStorage
        localStorage.setItem("customerPortalToken", data.sessionToken);
      } else {
        setError("Invalid or expired link. Please request a new one.");
        setStep("login");
      }
    } catch (err) {
      setError("Failed to verify access. Please try again.");
      setStep("login");
    } finally {
      setLoading(false);
    }
  };

  // Load existing session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("customerPortalToken");
    if (storedToken && !token) {
      fetchCustomerData(storedToken);
    }
  }, []);

  const fetchCustomerData = async (token: string) => {
    try {
      const res = await fetch("/api/loyalty/portal/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCustomer(data.data.customer);
        setSessionToken(token);
        setStep("dashboard");
      } else {
        localStorage.removeItem("customerPortalToken");
      }
    } catch (err) {
      localStorage.removeItem("customerPortalToken");
    }
  };

  const logout = () => {
    localStorage.removeItem("customerPortalToken");
    setStep("login");
    setCustomer(null);
    setSessionToken("");
    router.push("/loyalty/portal");
  };

  if (step === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Loyalty Portal
            </h1>
            <p className="text-gray-600">Access your rewards and benefits</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={requestAccess} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>

            <div className="text-center text-gray-500 text-sm">or</div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="+1 (555) 000-0000"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || (!email && !phone)}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Sending..." : "Send Access Link"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-900 text-center">
              🔒 We'll send you a secure magic link to access your portal
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "verifying") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Check Your {email ? "Email" : "Phone"}!
          </h1>
          <p className="text-gray-600 mb-6">
            We've sent you a magic link to access your loyalty portal. Click the
            link to continue.
          </p>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-900">
              ⏱️ The link expires in 15 minutes
            </p>
          </div>
          <button
            onClick={() => setStep("login")}
            className="mt-6 text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

  if (step === "dashboard" && customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏆</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {customer.organization?.name || "Loyalty Portal"}
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {customer.firstName}!
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Points Summary */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
              <div className="text-sm opacity-90 mb-2">Available Points</div>
              <div className="text-5xl font-bold mb-2">
                {customer.loyaltyPoints?.toLocaleString() || 0}
              </div>
              <div className="text-sm opacity-90">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full">
                  {customer.loyaltyTier || "BRONZE"} Member
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-2">Points Redeemed</div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {customer.loyaltyUsed?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-500">Lifetime savings!</div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-2">Total Spent</div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                ${customer.totalSpent?.toFixed(2) || "0.00"}
              </div>
              <div className="text-sm text-gray-500">
                {customer.orderCount || 0} orders
              </div>
            </div>
          </div>

          {/* Member Benefits */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your {customer.loyaltyTier} Benefits
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⭐</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Earn Points</h3>
                  <p className="text-sm text-gray-600">
                    Get points on every purchase
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">💰</div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Redeem Rewards
                  </h3>
                  <p className="text-sm text-gray-600">
                    Use points for discounts
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎂</div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Birthday Bonus
                  </h3>
                  <p className="text-sm text-gray-600">
                    Special gift on your birthday
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">🚀</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Tier Upgrades</h3>
                  <p className="text-sm text-gray-600">
                    Unlock more benefits as you shop
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <button className="bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-3">📜</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                View History
              </h3>
              <p className="text-sm text-gray-600">
                See all your points and rewards activity
              </p>
            </button>

            <button className="bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-3">🎁</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Available Rewards
              </h3>
              <p className="text-sm text-gray-600">
                Browse rewards you can redeem
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🔄</div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
