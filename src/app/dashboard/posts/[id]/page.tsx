"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  Edit2,
  Trash2,
  Calendar,
  TrendingUp,
  Clock,
  Save,
} from "lucide-react";

interface Post {
  id: string;
  title: string;
  platform: string;
  status: string;
  contentType: string;
  scheduledAt: string | null;
  postedAt: string | null;
  brand: {
    id: string;
    name: string;
  };
  versions: Array<{
    id: string;
    versionNumber: number;
    caption: string;
    hashtags: string[];
    mediaDescription: string | null;
    source: string;
    createdAt: string;
    createdBy: {
      name: string | null;
      email: string;
    };
  }>;
  performance: Array<{
    id: string;
    likes: number | null;
    comments: number | null;
    shares: number | null;
    reach: number | null;
    recordedAt: string;
  }>;
}

const statusColors: Record<string, string> = {
  IDEA: "bg-gray-100 text-gray-700",
  DRAFT: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  SCHEDULED: "bg-purple-100 text-purple-700",
  POSTED: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams()!;
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
      } else {
        alert("Post not found");
        router.push("/dashboard/posts");
      }
    } catch (error) {
      console.error("Failed to fetch post:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (
    text: string,
    type: "caption" | "hashtags",
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "caption") {
        setCopiedCaption(true);
        setTimeout(() => setCopiedCaption(false), 2000);
      } else {
        setCopiedHashtags(true);
        setTimeout(() => setCopiedHashtags(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const markAsPosted = async () => {
    if (
      !confirm(
        "Mark this post as posted? This will set the posted date to now.",
      )
    ) {
      return;
    }
    await updateStatus("POSTED");
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this post? This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/dashboard/posts");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete post");
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Failed to delete post");
    }
  };

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

  if (!post) {
    return null;
  }

  const latestVersion = post.versions[0];
  const hashtagsText = latestVersion?.hashtags.map((h) => `#${h}`).join(" ");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Posts
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {post.title}
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{post.brand.name}</span>
                  <span>•</span>
                  <span>{post.platform.replace("_", " ")}</span>
                  <span>•</span>
                  <span>{post.contentType.replace("_", " ")}</span>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[post.status]
                }`}
              >
                {post.status}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/dashboard/posts/${postId}/edit`)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Edit2 size={16} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>

          {/* Content Preview */}
          {latestVersion && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Content (Version {latestVersion.versionNumber})
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Caption
                    </label>
                    <button
                      onClick={() =>
                        copyToClipboard(latestVersion.caption, "caption")
                      }
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      {copiedCaption ? <Check size={14} /> : <Copy size={14} />}
                      {copiedCaption ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                    {latestVersion.caption}
                  </div>
                </div>

                {latestVersion.hashtags.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Hashtags
                      </label>
                      <button
                        onClick={() =>
                          copyToClipboard(hashtagsText, "hashtags")
                        }
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      >
                        {copiedHashtags ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                        {copiedHashtags ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      {hashtagsText}
                    </div>
                  </div>
                )}

                {latestVersion.mediaDescription && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Media Description
                    </label>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      {latestVersion.mediaDescription}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  {latestVersion.source === "AI_GENERATED"
                    ? "🤖 AI Generated"
                    : "✏️ User Edited"}{" "}
                  • Created by{" "}
                  {latestVersion.createdBy.name ||
                    latestVersion.createdBy.email}
                </div>
              </div>
            </div>
          )}

          {/* Version History */}
          {post.versions.length > 1 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Version History ({post.versions.length} versions)
              </h2>
              <div className="space-y-3">
                {post.versions.map((version) => (
                  <div
                    key={version.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-900">
                        Version {version.versionNumber}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {version.caption}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {post.status !== "POSTED" && (
                <button
                  onClick={markAsPosted}
                  disabled={updating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Check size={16} />
                  Mark as Posted
                </button>
              )}

              {post.status === "DRAFT" && (
                <button
                  onClick={() => updateStatus("APPROVED")}
                  disabled={updating}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Approve
                </button>
              )}

              {post.status === "POSTED" && (
                <button
                  onClick={() =>
                    router.push(`/dashboard/posts/${postId}/analytics`)
                  }
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <TrendingUp size={16} />
                  Add Analytics
                </button>
              )}
            </div>
          </div>

          {/* Schedule Info */}
          {post.scheduledAt && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Calendar size={16} />
                <span className="font-medium">Scheduled</span>
              </div>
              <p className="text-sm text-blue-600">
                {new Date(post.scheduledAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Posted Info */}
          {post.postedAt && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Check size={16} />
                <span className="font-medium">Posted</span>
              </div>
              <p className="text-sm text-green-600">
                {new Date(post.postedAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Performance Summary */}
          {post.performance.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Latest Performance
              </h3>
              <div className="space-y-3">
                {post.performance[0].likes !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Likes</span>
                    <span className="font-medium">
                      {post.performance[0].likes}
                    </span>
                  </div>
                )}
                {post.performance[0].comments !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Comments</span>
                    <span className="font-medium">
                      {post.performance[0].comments}
                    </span>
                  </div>
                )}
                {post.performance[0].shares !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shares</span>
                    <span className="font-medium">
                      {post.performance[0].shares}
                    </span>
                  </div>
                )}
                {post.performance[0].reach !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reach</span>
                    <span className="font-medium">
                      {post.performance[0].reach}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Platform Tips */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Platform Tips</h3>
            <p className="text-sm text-gray-600">
              {post.platform === "INSTAGRAM" &&
                "Best times: 11am-1pm, 7pm-9pm. Use 20-30 hashtags for maximum reach."}
              {post.platform === "FACEBOOK" &&
                "Best times: 1pm-4pm. Focus on engaging questions and visual content."}
              {post.platform === "TWITTER_X" &&
                "Best times: 9am-3pm. Keep it concise, use 1-2 hashtags."}
              {post.platform === "LINKEDIN" &&
                "Best times: Tue-Thu, 10am-12pm. Professional tone, industry insights."}
              {post.platform === "TIKTOK" &&
                "Best times: 6pm-10pm. Trending sounds, quick hooks, vertical video."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
