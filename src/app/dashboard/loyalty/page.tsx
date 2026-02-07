"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Customer {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  totalSpent: number;
  loyaltyPoints: number;
  loyaltyTier: string;
  loyaltyMember: boolean;
}

export default function LoyaltyPage() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [orgSlug, setOrgSlug] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPoints, setFilterPoints] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [rewards, setRewards] = useState<any[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);

  useEffect(() => {
    fetchTiers();
    fetchOrg();
    fetchCustomers();
    fetchRewards();
  }, []);

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);
      const res = await fetch("/api/customers");
      if (res.ok) {
        const data = await res.json();
        const customersData = data.data || [];

        // Calculate points: 1 point per $1 spent
        const customersWithPoints = customersData.map((customer: any) => ({
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          totalSpent: customer.totalSpent || 0,
          loyaltyPoints:
            customer.loyaltyPoints || Math.floor(customer.totalSpent || 0),
          loyaltyTier: customer.loyaltyTier || "BRONZE",
          loyaltyMember: customer.loyaltyMember || false,
        }));

        setCustomers(customersWithPoints);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchTiers = async () => {
    try {
      const res = await fetch("/api/loyalty/tiers");
      if (res.ok) {
        const data = await res.json();
        setTiers(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch tiers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrg = async () => {
    try {
      const res = await fetch("/api/organization");
      if (res.ok) {
        const data = await res.json();
        setOrgSlug(data.slug || "");
      }
    } catch (error) {
      console.error("Failed to fetch org:", error);
    }
  };
  const fetchRewards = async () => {
    try {
      setLoadingRewards(true);
      const res = await fetch("/api/loyalty/rewards");
      if (res.ok) {
        const data = await res.json();
        setRewards(data.rewards || []);
      }
    } catch (error) {
      console.error("Failed to fetch rewards:", error);
    } finally {
      setLoadingRewards(false);
    }
  };

  const deleteReward = async (rewardId: string) => {
    if (!confirm("Are you sure you want to delete this reward?")) {
      return;
    }

    try {
      const res = await fetch(`/api/loyalty/rewards?id=${rewardId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchRewards();
      } else {
        alert("Failed to delete reward");
      }
    } catch (error) {
      console.error("Failed to delete reward:", error);
      alert("Failed to delete reward");
    }
  };

  const toggleRewardStatus = async (reward: any) => {
    try {
      const res = await fetch(`/api/loyalty/rewards?id=${reward.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reward,
          isActive: !reward.isActive,
        }),
      });

      if (res.ok) {
        fetchRewards();
      } else {
        alert("Failed to update reward");
      }
    } catch (error) {
      console.error("Failed to update reward:", error);
      alert("Failed to update reward");
    }
  };
  const saveTier = async (tier: any) => {
    try {
      const res = await fetch("/api/loyalty/tiers", {
        method: tier.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tier),
      });
      if (res.ok) {
        fetchTiers();
        setEditing(null);
      }
    } catch (error) {
      console.error("Failed to save tier:", error);
    }
  };

  const defaultTiers = [
    {
      tier: "BRONZE",
      name: "Bronze",
      minPoints: 0,
      pointsPerDollar: 1,
      benefits: ["1 point per $1 spent"],
    },
    {
      tier: "SILVER",
      name: "Silver",
      minPoints: 500,
      pointsPerDollar: 1.5,
      benefits: ["1.5 points per $1 spent", "5% discount"],
    },
    {
      tier: "GOLD",
      name: "Gold",
      minPoints: 1500,
      pointsPerDollar: 2,
      benefits: ["2 points per $1 spent", "10% discount", "Free shipping"],
    },
    {
      tier: "PLATINUM",
      name: "Platinum",
      minPoints: 3000,
      pointsPerDollar: 2.5,
      benefits: [
        "2.5 points per $1 spent",
        "15% discount",
        "Free shipping",
        "Priority support",
      ],
    },
    {
      tier: "DIAMOND",
      name: "Diamond",
      minPoints: 5000,
      pointsPerDollar: 3,
      benefits: [
        "3 points per $1 spent",
        "20% discount",
        "Free shipping",
        "Priority support",
        "Exclusive access",
      ],
    },
  ];

  const initializeTiers = async () => {
    setLoading(true);
    for (const tier of defaultTiers) {
      await saveTier(tier);
    }
    await fetchTiers();
    setLoading(false);
  };

  const autoEnroll = async () => {
    if (
      !confirm(
        "Auto-enroll all customers with email/phone and allocate points based on past purchases?"
      )
    )
      return;
    setEnrolling(true);
    try {
      const res = await fetch("/api/loyalty/auto-enroll", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        let message = `✅ Enrolled ${
          data.enrolled
        } customers with ${data.pointsAllocated.toLocaleString()} total points!`;
        if (data.skipped > 0)
          message += `\n⚠️ Skipped ${data.skipped} customers (no contact info)`;
        if (data.failed > 0)
          message += `\n❌ Failed ${data.failed} customers (check logs)`;
        alert(message);
      } else {
        alert(
          `❌ Failed to auto-enroll customers: ${data.error || "Unknown error"}`
        );
      }
    } catch (error) {
      alert("❌ Error during auto-enrollment");
    } finally {
      setEnrolling(false);
      fetchCustomers(); // Refresh customer list after enrollment
    }
  };

  const filteredCustomers = enrolledCustomers.filter((customer) => {
    const matchesSearch =
      `${customer.firstName} ${customer.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery);
    const matchesTier =
      filterTier === "ALL" || customer.loyaltyTier === filterTier;
    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "ENROLLED" && customer.loyaltyMember) ||
      (filterStatus === "NOT_ENROLLED" && !customer.loyaltyMember);
    const matchesPoints =
      filterPoints === "ALL" ||
      (filterPoints === "0-100" && customer.loyaltyPoints < 100) ||
      (filterPoints === "100-500" &&
        customer.loyaltyPoints >= 100 &&
        customer.loyaltyPoints < 500) ||
      (filterPoints === "500-1500" &&
        customer.loyaltyPoints >= 500 &&
        customer.loyaltyPoints < 1500) ||
      (filterPoints === "1500-3000" &&
        customer.loyaltyPoints >= 1500 &&
        customer.loyaltyPoints < 3000) ||
      (filterPoints === "3000+" && customer.loyaltyPoints >= 3000);

    return matchesSearch && matchesTier && matchesStatus && matchesPoints;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterTier, filterStatus, filterPoints]);

  // Only show enrolled customers
  const enrolledCustomers = customers.filter((c) => c.loyaltyMember);
  
  const tierStats = {
    BRONZE: enrolledCustomers.filter((c) => c.loyaltyTier === "BRONZE").length,
    SILVER: enrolledCustomers.filter((c) => c.loyaltyTier === "SILVER").length,
    GOLD: enrolledCustomers.filter((c) => c.loyaltyTier === "GOLD").length,
    PLATINUM: enrolledCustomers.filter((c) => c.loyaltyTier === "PLATINUM").length,
    DIAMOND: enrolledCustomers.filter((c) => c.loyaltyTier === "DIAMOND").length,
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Loyalty Rewards Management</h1>
          <div className="flex gap-3">
            {tiers.length === 0 && (
              <button
                onClick={initializeTiers}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Initialize Default Tiers
              </button>
            )}
            <button
              onClick={autoEnroll}
              disabled={enrolling}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {enrolling ? "Enrolling..." : "🏆 Auto-Enroll All Customers"}
            </button>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-purple-900 mb-2">
            🏆 Customer Loyalty Portal
          </h3>
          <p className="text-purple-700 mb-3">
            Customers can now access their own portal to view points, tier, and
            transaction history!
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const portalUrl = `${window.location.origin}/loyalty/portal`;
                navigator.clipboard.writeText(portalUrl);
                alert("Portal URL copied to clipboard!");
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Copy Portal URL
            </button>
            <a
              href="/loyalty/portal"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Preview Portal →
            </a>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-bold text-purple-900 mb-2">
            🔗 Loyalty Signup URL
          </h3>
          <p className="text-sm text-purple-800 mb-3">
            Share this link for customers to join your loyalty program
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`${
                typeof window !== "undefined" ? window.location.origin : ""
              }/loyalty/signup?org=${orgSlug || "your-org-slug"}`}
              className="flex-1 px-4 py-2 border rounded-lg bg-white"
            />
            <button
              onClick={() => {
                if (typeof window !== "undefined" && orgSlug) {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/loyalty/signup?org=${orgSlug}`
                  );
                  alert("Link copied to clipboard!");
                }
              }}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 whitespace-nowrap"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>

      {/* Loyalty Members Section */}
      <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Loyalty Members
            </h2>
            <p className="text-gray-600 mt-1">
              {filteredCustomers.length} of {enrolledCustomers.length} customers enrolled • 1
              point = $1 spent
            </p>
          </div>
        </div>

        {/* Tier Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-orange-600 text-sm font-medium">Bronze</div>
            <div className="text-2xl font-bold text-orange-900">
              {tierStats.BRONZE}
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <div className="text-gray-600 text-sm font-medium">Silver</div>
            <div className="text-2xl font-bold text-gray-900">
              {tierStats.SILVER}
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <div className="text-yellow-600 text-sm font-medium">Gold</div>
            <div className="text-2xl font-bold text-yellow-900">
              {tierStats.GOLD}
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-300 rounded-lg p-4">
            <div className="text-purple-600 text-sm font-medium">Platinum</div>
            <div className="text-2xl font-bold text-purple-900">
              {tierStats.PLATINUM}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
            <div className="text-blue-600 text-sm font-medium">Diamond</div>
            <div className="text-2xl font-bold text-blue-900">
              {tierStats.DIAMOND}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="🔍 Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="ALL">All Tiers</option>
            <option value="BRONZE">🥉 Bronze</option>
            <option value="SILVER">🥈 Silver</option>
            <option value="GOLD">🥇 Gold</option>
            <option value="PLATINUM">💎 Platinum</option>
            <option value="DIAMOND">💠 Diamond</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="ENROLLED">✅ Enrolled</option>
            <option value="NOT_ENROLLED">⏸️ Not Enrolled</option>
          </select>
          <select
            value={filterPoints}
            onChange={(e) => setFilterPoints(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="ALL">All Points</option>
            <option value="0-100">0-100 pts</option>
            <option value="100-500">100-500 pts</option>
            <option value="500-1500">500-1.5K pts</option>
            <option value="1500-3000">1.5K-3K pts</option>
            <option value="3000+">3K+ pts</option>
          </select>
        </div>

        {/* Customer Table */}
        {customersLoading ? (
          <div className="text-center py-8 text-gray-500">
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No customers found matching your filters
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCustomers.map((customer) => {
                    const displayName =
                      `${customer.firstName || ""} ${
                        customer.lastName || ""
                      }`.trim() || "Unknown";
                    const tierColors: Record<string, string> = {
                      BRONZE: "bg-orange-100 text-orange-800",
                      SILVER: "bg-gray-100 text-gray-800",
                      GOLD: "bg-yellow-100 text-yellow-800",
                      PLATINUM: "bg-purple-100 text-purple-800",
                      DIAMOND: "bg-blue-100 text-blue-800",
                    };

                    return (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {displayName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {customer.email}
                          </div>
                          <div className="text-sm text-gray-400">
                            {customer.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${customer.totalSpent.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-purple-600">
                            {customer.loyaltyPoints.toLocaleString()} pts
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              tierColors[customer.loyaltyTier] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {customer.loyaltyTier}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              customer.loyaltyMember
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {customer.loyaltyMember
                              ? "Enrolled"
                              : "Not Enrolled"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Link
                            href={`/dashboard/crm/${customer.id}`}
                            className="text-purple-600 hover:text-purple-900 font-medium"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(endIndex, filteredCustomers.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">
                    {filteredCustomers.length}
                  </span>{" "}
                  customers
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                      )
                      .map((page, idx, arr) => (
                        <>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span
                              key={`ellipsis-${page}`}
                              className="px-3 py-2 text-gray-500"
                            >
                              ...
                            </span>
                          )}
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                              currentPage === page
                                ? "bg-purple-600 text-white"
                                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        </>
                      ))}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Rewards Management */}
      <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-12">
        Redemption Rewards
      </h2>
      {loadingRewards ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading rewards...</p>
        </div>
      ) : (
        <>
          {rewards.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No Rewards Configured
              </h3>
              <p className="text-gray-600 mb-6">
                Set up rewards that customers can redeem with their loyalty
                points.
              </p>
              <button
                onClick={() => {
                  alert(
                    "To add rewards, run: node scripts/init-rewards.js\n\nOr create them via the API."
                  );
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                View Setup Instructions
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                    !reward.isActive ? "opacity-60" : ""
                  }`}
                >
                  {/* Reward Header */}
                  <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-4 text-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-3xl mb-1">
                          {reward.type === "PERCENTAGE_DISCOUNT"
                            ? "💸"
                            : reward.type === "FREE_ITEM"
                            ? "🎁"
                            : reward.type === "COMBO"
                            ? "🎉"
                            : "✨"}
                        </div>
                        <h3 className="text-lg font-bold">{reward.name}</h3>
                      </div>
                      <span className="text-xl font-bold">
                        {reward.pointsCost}
                        <span className="text-sm opacity-90 ml-1">pts</span>
                      </span>
                    </div>
                  </div>

                  {/* Reward Details */}
                  <div className="p-4">
                    <p className="text-gray-600 text-sm mb-3">
                      {reward.description}
                    </p>

                    {/* Benefits */}
                    <div className="space-y-1 mb-4 text-sm">
                      {reward.discountPercent && (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <span>{reward.discountPercent}% discount</span>
                        </div>
                      )}
                      {reward.freeItemValue && (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <span>Free ${reward.freeItemValue} item</span>
                        </div>
                      )}
                      {reward.expiryDays && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <span>⏰</span>
                          <span>{reward.expiryDays} days validity</span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="text-xs text-gray-600 mb-1">
                        Times Redeemed
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {reward._count?.redemptions || 0}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleRewardStatus(reward)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                          reward.isActive
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {reward.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => deleteReward(reward.id)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tier Configuration */}
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Tier Configuration
      </h2>
      <div className="grid gap-6">
        {(tiers.length > 0 ? tiers : defaultTiers).map((tier) => (
          <div key={tier.tier} className="bg-white rounded-lg shadow-lg p-6">
            {editing === tier.tier ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={tier.name}
                  onChange={(e) =>
                    setTiers(
                      tiers.map((t) =>
                        t.tier === tier.tier
                          ? { ...t, name: e.target.value }
                          : t
                      )
                    )
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Tier Name"
                />
                <input
                  type="number"
                  value={tier.minPoints}
                  onChange={(e) =>
                    setTiers(
                      tiers.map((t) =>
                        t.tier === tier.tier
                          ? { ...t, minPoints: parseInt(e.target.value) }
                          : t
                      )
                    )
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Minimum Points"
                />
                <input
                  type="number"
                  step="0.1"
                  value={tier.pointsPerDollar}
                  onChange={(e) =>
                    setTiers(
                      tiers.map((t) =>
                        t.tier === tier.tier
                          ? {
                              ...t,
                              pointsPerDollar: parseFloat(e.target.value),
                            }
                          : t
                      )
                    )
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Points per Dollar"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      saveTier(tier);
                      setEditing(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{tier.name}</h2>
                    <p className="text-gray-600">{tier.tier}</p>
                  </div>
                  <button
                    onClick={() => setEditing(tier.tier)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Minimum Points</p>
                    <p className="text-xl font-bold">{tier.minPoints}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Points per Dollar</p>
                    <p className="text-xl font-bold">{tier.pointsPerDollar}x</p>
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-2">Benefits:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {(tier.benefits || []).map((benefit: string, i: number) => (
                      <li key={i} className="text-gray-700">
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
