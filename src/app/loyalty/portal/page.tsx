"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoyaltyPortalPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [step, setStep] = useState<
    "login" | "verifying" | "dashboard" | "history" | "rewards"
  >("login");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [rewards, setRewards] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

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
      // Try to get org from query param first
      let orgSlug = searchParams?.get("org");

      if (!orgSlug) {
        const hostname = window.location.hostname;
        const parts = hostname.split(".");

        // Extract org from hostname
        if (hostname.includes("callmaker24")) {
          // For callmaker24.com, use the main domain as org
          orgSlug = "callmaker24";
        } else if (parts.length > 2 && parts[0] !== "www") {
          // For subdomains like mystore.example.com
          orgSlug = parts[0];
        } else {
          // For custom domains, use the full domain
          orgSlug = hostname.replace(/\./g, "-");
        }
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
    setTransactions([]);
    router.push("/loyalty/portal");
  };

  const loadTransactionHistory = async () => {
    setLoadingTransactions(true);
    try {
      const res = await fetch("/api/loyalty/portal/transactions", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setTransactions(data.data.transactions);
        setStep("history");
      } else {
        setError("Failed to load transaction history");
      }
    } catch (err) {
      setError("Failed to load transaction history");
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadRewards = async () => {
    setLoadingRewards(true);
    try {
      // Load available rewards
      const rewardsRes = await fetch(`/api/loyalty/rewards`);
      if (rewardsRes.ok) {
        const data = await rewardsRes.json();
        setRewards(data.rewards || []);
      }

      // Load customer's redemption history
      const redemptionsRes = await fetch(
        `/api/loyalty/redeem?token=${sessionToken}`,
      );
      if (redemptionsRes.ok) {
        const data = await redemptionsRes.json();
        setRedemptions(data.redemptions || []);
      }

      setStep("rewards");
    } catch (err) {
      setError("Failed to load rewards");
    } finally {
      setLoadingRewards(false);
    }
  };

  const redeemReward = async (rewardId: string) => {
    if (
      !confirm(
        "Are you sure you want to redeem this reward? Points will be deducted from your balance.",
      )
    ) {
      return;
    }

    setRedeeming(true);
    setError("");

    try {
      const res = await fetch("/api/loyalty/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: sessionToken,
          rewardId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          `Success! Your redemption code is: ${data.redemption.code}\n\nUse this code at checkout to receive your discount.`,
        );

        // Refresh customer data and reload rewards
        await fetchCustomerData(sessionToken);
        await loadRewards();
      } else {
        setError(data.error || "Failed to redeem reward");
      }
    } catch (err) {
      setError("Failed to redeem reward");
    } finally {
      setRedeeming(false);
    }
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
            <button
              onClick={loadTransactionHistory}
              disabled={loadingTransactions}
              className="bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow disabled:opacity-50"
            >
              <div className="text-4xl mb-3">📜</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {loadingTransactions ? "Loading..." : "View History"}
              </h3>
              <p className="text-sm text-gray-600">
                See all your points and rewards activity
              </p>
            </button>

            <button
              onClick={loadRewards}
              disabled={loadingRewards}
              className="bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow disabled:opacity-50"
            >
              <div className="text-4xl mb-3">🎁</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {loadingRewards ? "Loading..." : "Available Rewards"}
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

  if (step === "history") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("dashboard")}
                className="text-2xl hover:bg-gray-100 p-2 rounded-lg transition"
              >
                ←
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Transaction History
                </h1>
                <p className="text-sm text-gray-600">
                  {transactions.length} total transactions
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

        {/* Transaction List */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {transactions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No Transactions Yet
              </h2>
              <p className="text-gray-600">
                Your order history will appear here once you make a purchase.
              </p>
              <button
                onClick={() => setStep("dashboard")}
                className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  {transaction.type === "order" ? (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-2xl">🛍️</div>
                          <div>
                            <h3 className="font-bold text-gray-900">
                              Order{" "}
                              {transaction.orderNumber ||
                                `#${transaction.id.slice(-8)}`}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {new Date(transaction.date).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="ml-11 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">
                              ${transaction.subtotal.toFixed(2)}
                            </span>
                          </div>
                          {transaction.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Discount:</span>
                              <span className="font-medium">
                                -${transaction.discount.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {transaction.tax > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tax:</span>
                              <span className="font-medium">
                                ${transaction.tax.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {transaction.shipping > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Shipping:</span>
                              <span className="font-medium">
                                ${transaction.shipping.toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t border-gray-200">
                            <span className="font-semibold text-gray-900">
                              Total:
                            </span>
                            <span className="font-bold text-lg text-gray-900">
                              ${transaction.amount.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="ml-11 mt-3 flex gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              transaction.status === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : transaction.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : transaction.status === "CANCELLED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {transaction.status}
                          </span>
                          {transaction.financialStatus && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {transaction.financialStatus}
                            </span>
                          )}
                          {transaction.source && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              {transaction.source}
                            </span>
                          )}
                        </div>

                        {/* Items Preview */}
                        {transaction.items &&
                          Array.isArray(transaction.items) &&
                          transaction.items.length > 0 && (
                            <div className="ml-11 mt-3 text-sm text-gray-600">
                              <span className="font-medium">Items:</span>{" "}
                              {transaction.items.map(
                                (item: any, idx: number) => (
                                  <span key={idx}>
                                    {item.name || item.title || "Item"}
                                    {item.quantity > 1 &&
                                      ` (×${item.quantity})`}
                                    {idx < transaction.items.length - 1 && ", "}
                                  </span>
                                ),
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  ) : (
                    // Discount Transaction
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">💰</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">
                          Discount Applied: {transaction.code}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.date).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                        <p className="text-lg font-bold text-green-600 mt-2">
                          Saved ${transaction.amount.toFixed(2)}
                        </p>
                        {transaction.discountType && (
                          <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {transaction.discountType}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Back Button */}
          {transactions.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setStep("dashboard")}
                className="px-6 py-3 bg-white text-purple-600 rounded-lg shadow-md hover:shadow-lg transition font-medium"
              >
                ← Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "rewards") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("dashboard")}
                className="text-2xl hover:bg-gray-100 p-2 rounded-lg transition"
              >
                ←
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Rewards Catalog
                </h1>
                <p className="text-sm text-gray-600">
                  You have {customer.loyaltyPoints?.toLocaleString() || 0}{" "}
                  points available
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

        <div className="max-w-6xl mx-auto px-4 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Available Rewards */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Available Rewards
            </h2>

            {rewards.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🎁</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No Rewards Available Yet
                </h3>
                <p className="text-gray-600">
                  Check back later for exciting rewards you can redeem with your
                  points!
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map((reward) => {
                  const canAfford =
                    (customer.loyaltyPoints || 0) >= reward.pointsCost;

                  return (
                    <div
                      key={reward.id}
                      className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow ${
                        !canAfford ? "opacity-60" : ""
                      }`}
                    >
                      {/* Reward Header */}
                      <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-6 text-white">
                        <div className="text-4xl mb-2">
                          {reward.type === "PERCENTAGE_DISCOUNT"
                            ? "💸"
                            : reward.type === "FREE_ITEM"
                              ? "🎁"
                              : reward.type === "COMBO"
                                ? "🎉"
                                : "✨"}
                        </div>
                        <h3 className="text-xl font-bold mb-1">
                          {reward.name}
                        </h3>
                        <div className="text-sm opacity-90">
                          {reward.pointsCost.toLocaleString()} Points
                        </div>
                      </div>

                      {/* Reward Details */}
                      <div className="p-6">
                        <p className="text-gray-600 text-sm mb-4">
                          {reward.description}
                        </p>

                        {/* Reward Benefits */}
                        <div className="space-y-2 mb-4">
                          {reward.discountPercent && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-green-600">✓</span>
                              <span>
                                {reward.discountPercent}% off your purchase
                              </span>
                            </div>
                          )}
                          {reward.freeItemValue && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-green-600">✓</span>
                              <span>
                                Free item up to ${reward.freeItemValue}
                              </span>
                            </div>
                          )}
                          {reward.expiryDays && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>⏰</span>
                              <span>
                                Valid for {reward.expiryDays} days after
                                redemption
                              </span>
                            </div>
                          )}
                          {reward.isSingleUse && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>🎟️</span>
                              <span>One-time use</span>
                            </div>
                          )}
                        </div>

                        {/* Redeem Button */}
                        <button
                          onClick={() => redeemReward(reward.id)}
                          disabled={!canAfford || redeeming}
                          className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
                            canAfford
                              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                          } ${redeeming ? "opacity-50" : ""}`}
                        >
                          {redeeming
                            ? "Redeeming..."
                            : canAfford
                              ? "Redeem Now"
                              : `Need ${(
                                  reward.pointsCost -
                                  (customer.loyaltyPoints || 0)
                                ).toLocaleString()} more points`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Your Redemptions */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Redemptions
            </h2>

            {redemptions.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-600">
                  You haven't redeemed any rewards yet. Start shopping to earn
                  more points!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {redemptions.map((redemption) => (
                  <div
                    key={redemption.id}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-2xl">
                            {redemption.reward.type === "PERCENTAGE_DISCOUNT"
                              ? "💸"
                              : redemption.reward.type === "FREE_ITEM"
                                ? "🎁"
                                : redemption.reward.type === "COMBO"
                                  ? "🎉"
                                  : "✨"}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {redemption.reward.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Redeemed{" "}
                              {new Date(
                                redemption.createdAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Redemption Code */}
                        <div className="ml-11 mb-3">
                          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 inline-block">
                            <div className="text-xs text-gray-600 mb-1">
                              Your Code:
                            </div>
                            <div className="text-2xl font-bold text-purple-600 tracking-wider">
                              {redemption.code}
                            </div>
                          </div>
                        </div>

                        {/* Status and Expiry */}
                        <div className="ml-11 flex flex-wrap gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              redemption.status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : redemption.status === "USED"
                                  ? "bg-gray-100 text-gray-700"
                                  : redemption.status === "EXPIRED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {redemption.status}
                          </span>

                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            {redemption.pointsSpent} points
                          </span>

                          {redemption.expiresAt && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                              {redemption.status === "EXPIRED"
                                ? "Expired"
                                : `Expires ${new Date(
                                    redemption.expiresAt,
                                  ).toLocaleDateString()}`}
                            </span>
                          )}

                          {redemption.usedAt && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              Used{" "}
                              {new Date(redemption.usedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setStep("dashboard")}
              className="px-6 py-3 bg-white text-purple-600 rounded-lg shadow-md hover:shadow-lg transition font-medium"
            >
              ← Back to Dashboard
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

export default function LoyaltyPortalPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoyaltyPortalPageContent />
    </Suspense>
  );
}
