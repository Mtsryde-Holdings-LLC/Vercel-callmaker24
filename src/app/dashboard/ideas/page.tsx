"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Lightbulb, Calendar, Tag } from "lucide-react";

interface Idea {
  id: string;
  title: string;
  platform: string;
  contentType: string;
  scheduledAt: string | null;
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
}

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

export default function IdeasPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const response = await fetch("/api/posts?status=IDEA");
      if (response.ok) {
        const data = await response.json();
        setIdeas(data.posts || []);
      }
    } catch (error) {
      console.error("Error fetching ideas:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch = idea.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesPlatform =
      selectedPlatform === "ALL" || idea.platform === selectedPlatform;
    const matchesType =
      selectedType === "ALL" || idea.contentType === selectedType;
    return matchesSearch && matchesPlatform && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-yellow-500" />
            Content Ideas
          </h1>
          <p className="text-gray-600 mt-2">
            Brainstorm and capture your content ideas
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/posts/create")}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          New Idea
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Platform Filter */}
          <div>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Platforms</option>
              <option value="INSTAGRAM">📷 Instagram</option>
              <option value="FACEBOOK">👥 Facebook</option>
              <option value="TWITTER_X">🐦 Twitter/X</option>
              <option value="LINKEDIN">💼 LinkedIn</option>
              <option value="TIKTOK">🎵 TikTok</option>
              <option value="YOUTUBE">📺 YouTube</option>
              <option value="YOUTUBE_SHORTS">🎬 YouTube Shorts</option>
              <option value="OTHER">📱 Other</option>
            </select>
          </div>

          {/* Content Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Types</option>
              <option value="IMAGE">Image</option>
              <option value="VIDEO">Video</option>
              <option value="CAROUSEL">Carousel</option>
              <option value="REEL">Reel</option>
              <option value="STORY">Story</option>
              <option value="TEXT">Text</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
          <div className="text-yellow-600 text-sm font-medium">Total Ideas</div>
          <div className="text-2xl font-bold text-yellow-900 mt-1">
            {ideas.length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-blue-600 text-sm font-medium">This Week</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">
            {
              ideas.filter(
                (i) =>
                  new Date(i.createdAt) >
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              ).length
            }
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="text-purple-600 text-sm font-medium">Scheduled</div>
          <div className="text-2xl font-bold text-purple-900 mt-1">
            {ideas.filter((i) => i.scheduledAt).length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="text-green-600 text-sm font-medium">Filtered</div>
          <div className="text-2xl font-bold text-green-900 mt-1">
            {filteredIdeas.length}
          </div>
        </div>
      </div>

      {/* Ideas Grid */}
      {filteredIdeas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No ideas yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start capturing your content ideas to bring them to life
          </p>
          <button
            onClick={() => router.push("/dashboard/posts/create")}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Idea
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIdeas.map((idea) => (
            <div
              key={idea.id}
              onClick={() => router.push(`/dashboard/posts/${idea.id}`)}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 overflow-hidden group"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 border-b border-yellow-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {idea.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-lg">
                        {platformEmojis[idea.platform] || "📱"}
                      </span>
                      <span className="capitalize">
                        {idea.platform.toLowerCase().replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Preview */}
              <div className="p-4">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {idea.versions[0]?.caption || "No caption yet..."}
                  </p>
                </div>

                {/* Hashtags */}
                {idea.versions[0]?.hashtags &&
                  idea.versions[0].hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {idea.versions[0].hashtags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                      {idea.versions[0].hashtags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{idea.versions[0].hashtags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {new Date(idea.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full capitalize">
                    {idea.contentType.toLowerCase()}
                  </div>
                </div>

                {/* Scheduled Badge */}
                {idea.scheduledAt && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-purple-600 bg-purple-50 rounded p-2">
                    <Calendar className="w-4 h-4" />
                    Scheduled for{" "}
                    {new Date(idea.scheduledAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
