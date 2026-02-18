"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function UpgradeBanner() {
  const { data: session } = useSession();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user is on trial
    if (session?.user) {
      // Calculate days left in trial (assuming 30-day trial)
      // You'll need to get actual subscription data from your API
      const now = new Date();
      const createdAt = new Date((session.user as any).createdAt || now);
      const trialEnd = new Date(createdAt);
      trialEnd.setDate(trialEnd.getDate() + 30);

      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0 && diffDays <= 30) {
        setDaysLeft(diffDays);
        setShowBanner(true);
      }
    }
  }, [session]);

  if (!showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl">⏰</div>
          <div>
            <h3 className="font-bold text-lg">
              {daysLeft} Day{daysLeft !== 1 ? "s" : ""} Left in Your Free Trial
            </h3>
            <p className="text-sm opacity-90">
              Upgrade now to continue enjoying all features without interruption
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/subscription"
          className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition shadow-md whitespace-nowrap"
        >
          Upgrade Now
        </Link>
      </div>
    </div>
  );
}
