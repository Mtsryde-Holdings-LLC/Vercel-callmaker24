"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Filter } from "lucide-react";

interface Post {
  id: string;
  title: string;
  platform: string;
  status: string;
  scheduledAt: string | null;
  postedAt: string | null;
  brand: {
    name: string;
  };
}

const platformColors: Record<string, string> = {
  INSTAGRAM: "bg-pink-100 border-pink-300 text-pink-800",
  FACEBOOK: "bg-blue-100 border-blue-300 text-blue-800",
  TWITTER_X: "bg-sky-100 border-sky-300 text-sky-800",
  LINKEDIN: "bg-indigo-100 border-indigo-300 text-indigo-800",
  TIKTOK: "bg-purple-100 border-purple-300 text-purple-800",
  YOUTUBE: "bg-red-100 border-red-300 text-red-800",
  YOUTUBE_SHORTS: "bg-orange-100 border-orange-300 text-orange-800",
  OTHER: "bg-gray-100 border-gray-300 text-gray-800",
};

const platformEmojis: Record<string, string> = {
  INSTAGRAM: "📷",
  FACEBOOK: "👥",
  TWITTER_X: "🐦",
  LINKEDIN: "💼",
  TIKTOK: "🎵",
  YOUTUBE: "📺",
  YOUTUBE_SHORTS: "🎬",
  OTHER: "📱",
};

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<string>("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts?limit=200");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.data?.posts || []);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getPostsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return posts.filter((post) => {
      const postDate = post.scheduledAt || post.postedAt;
      if (!postDate) return false;
      const postDateStr = new Date(postDate).toISOString().split("T")[0];
      if (platformFilter && post.platform !== platformFilter) return false;
      return postDateStr === dateStr;
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const days = getDaysInMonth(currentDate);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Calendar</h1>
          <p className="text-gray-600 mt-1">
            Plan and schedule your social media content
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/posts/new")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          New Post
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Platforms</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="TWITTER_X">Twitter/X</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="TIKTOK">TikTok</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="YOUTUBE_SHORTS">YouTube Shorts</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setView("month")}
                className={`px-4 py-2 rounded-lg ${
                  view === "month"
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView("week")}
                className={`px-4 py-2 rounded-lg ${
                  view === "week"
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Week
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          {Object.entries(platformEmojis).map(([platform, emoji]) => (
            <div key={platform} className="flex items-center gap-2">
              <span>{emoji}</span>
              <span className="text-sm text-gray-600">
                {platform.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayPosts = getPostsForDate(day.date);
            const today = isToday(day.date);

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b border-gray-200 ${
                  !day.isCurrentMonth ? "bg-gray-50" : "bg-white"
                } ${today ? "ring-2 ring-blue-500 ring-inset" : ""}`}
              >
                <div
                  className={`text-sm font-medium mb-2 ${
                    !day.isCurrentMonth
                      ? "text-gray-400"
                      : today
                        ? "text-blue-600 font-bold"
                        : "text-gray-700"
                  }`}
                >
                  {day.date.getDate()}
                </div>

                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      onClick={() => router.push(`/dashboard/posts/${post.id}`)}
                      className={`text-xs p-1.5 rounded border cursor-pointer hover:shadow-sm transition-shadow ${
                        platformColors[post.platform]
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <span>{platformEmojis[post.platform]}</span>
                        <span className="font-medium truncate">
                          {post.title}
                        </span>
                      </div>
                      <div className="text-xs opacity-75 truncate">
                        {post.brand.name}
                      </div>
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <div className="text-xs text-gray-500 pl-1.5">
                      +{dayPosts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Total Posts</div>
          <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Scheduled</div>
          <div className="text-2xl font-bold text-purple-600">
            {posts.filter((p) => p.status === "SCHEDULED").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Posted</div>
          <div className="text-2xl font-bold text-green-600">
            {posts.filter((p) => p.status === "POSTED").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Drafts</div>
          <div className="text-2xl font-bold text-blue-600">
            {
              posts.filter((p) => p.status === "DRAFT" || p.status === "IDEA")
                .length
            }
          </div>
        </div>
      </div>
    </div>
  );
}
