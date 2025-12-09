"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Filter, Plus, Search } from "lucide-react";

interface Post {
  id: string;
  title: string;
  platform: string;
  status: string;
  contentType: string;
  scheduledAt: string | null;
  postedAt: string | null;
  createdAt: string;
  brand: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  versions: Array<{
    caption: string;
    hashtags: string[];
  }>;
  _count: {
    versions: number;
    performance: number;
  };
}

const statusColors: Record<string, string> = {
  IDEA: "bg-gray-100 text-gray-700",
  DRAFT: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  SCHEDULED: "bg-purple-100 text-purple-700",
  POSTED: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
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

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [platformFilter, setPlatformFilter] = useState<string>("");

  useEffect(() => {
    fetchPosts();
  }, [statusFilter, platformFilter]);

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (platformFilter) params.append("platform", platformFilter);

      const res = await fetch(`/api/posts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Posts</h1>
          <p className="text-gray-600 mt-1">
            Manage your social media content workflow
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/dashboard/posts/calendar")}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Calendar size={20} />
            Calendar
          </button>
          <button
            onClick={() => router.push("/dashboard/posts/new")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            New Post
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="IDEA">Ideas</option>
            <option value="DRAFT">Drafts</option>
            <option value="APPROVED">Approved</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="POSTED">Posted</option>
            <option value="ARCHIVED">Archived</option>
          </select>

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

          <button
            onClick={() => {
              setStatusFilter("");
              setPlatformFilter("");
              setSearchTerm("");
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No posts found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter || platformFilter
                ? "Try adjusting your filters or search terms."
                : "Create your first post to get started with content planning."}
            </p>
            <button
              onClick={() => router.push("/dashboard/posts/new")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Create First Post
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => router.push(`/dashboard/posts/${post.id}`)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {platformEmojis[post.platform]}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {post.brand.name} • {post.platform.replace("_", " ")}
                      </p>
                    </div>
                  </div>

                  {post.versions.length > 0 && (
                    <p className="text-gray-700 line-clamp-2 mb-3">
                      {post.versions[0].caption}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{post._count.versions} versions</span>
                    {post._count.performance > 0 && (
                      <span>📊 {post._count.performance} metrics</span>
                    )}
                    {post.scheduledAt && (
                      <span>
                        📅 {new Date(post.scheduledAt).toLocaleDateString()}
                      </span>
                    )}
                    {post.postedAt && (
                      <span>
                        ✅ Posted {new Date(post.postedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="ml-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      statusColors[post.status]
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
