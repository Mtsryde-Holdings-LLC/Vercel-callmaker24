"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateSocialPostPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [scheduleType, setScheduleType] = useState<"now" | "schedule">("now");
  const [scheduledFor, setScheduledFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/social/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    }
  };

  const handlePlatformToggle = (accountId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlatforms.length === 0) {
      alert("Please select at least one platform");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("platforms", JSON.stringify(selectedPlatforms));
      formData.append("scheduleType", scheduleType);
      if (scheduleType === "schedule") {
        formData.append("scheduledFor", scheduledFor);
      }
      mediaFiles.forEach((file) => formData.append("media", file));

      const res = await fetch("/api/social/posts", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        router.push("/dashboard/social");
      } else {
        alert("Failed to create post");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      FACEBOOK: "📘",
      INSTAGRAM: "📷",
      TWITTER: "🐦",
      LINKEDIN: "💼",
      TIKTOK: "🎵",
    };
    return icons[platform] || "📱";
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      alert("Please enter a prompt for AI generation");
      return;
    }

    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate-social-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          platforms: selectedPlatforms
            .map((id) => {
              const account = accounts.find((a) => a.id === id);
              return account?.platform;
            })
            .filter(Boolean),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setContent(data.content || "");
        setAiPrompt("");
        setShowAiPanel(false);
      } else {
        alert("Failed to generate content");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      alert("Failed to generate content");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Social Post</h1>
          <p className="text-gray-600 mt-1">
            Create a post manually or use AI generation
          </p>
        </div>
        <Link
          href="/dashboard/social"
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to Posts
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg p-6 space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Platforms *
          </label>
          {accounts.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">No accounts connected</p>
              <Link
                href="/dashboard/social/connect"
                className="text-blue-600 hover:underline"
              >
                Connect an account first
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <label
                  key={account.id}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedPlatforms.includes(account.id)
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(account.id)}
                    onChange={() => handlePlatformToggle(account.id)}
                    className="mr-3"
                  />
                  <span className="text-2xl mr-2">
                    {getPlatformIcon(account.platform)}
                  </span>
                  <div>
                    <div className="font-medium">{account.accountName}</div>
                    <div className="text-xs text-gray-500">
                      {account.platform}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Post Content *
            </label>
            <button
              type="button"
              onClick={() => setShowAiPanel(!showAiPanel)}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition"
            >
              ✨ {showAiPanel ? "Hide AI" : "Generate with AI"}
            </button>
          </div>

          {showAiPanel && (
            <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Prompt
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 mb-3"
                placeholder="e.g., Write a fun post about our new product launch..."
              />
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
              >
                {aiLoading ? "✨ Generating..." : "✨ Generate Content"}
              </button>
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={6}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="What's on your mind?"
          />
          <p className="text-sm text-gray-500 mt-1">
            {content.length} characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Media (Optional)
          </label>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleMediaUpload}
            className="w-full px-4 py-2 border rounded-lg"
          />
          {mediaFiles.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {mediaFiles.length} file(s) selected
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Publishing *
          </label>
          <div className="space-y-3">
            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer">
              <input
                type="radio"
                checked={scheduleType === "now"}
                onChange={() => setScheduleType("now")}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Post Now</div>
                <div className="text-sm text-gray-500">Publish immediately</div>
              </div>
            </label>
            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer">
              <input
                type="radio"
                checked={scheduleType === "schedule"}
                onChange={() => setScheduleType("schedule")}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="font-medium">Schedule for Later</div>
                {scheduleType === "schedule" && (
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    required
                    className="mt-2 w-full px-3 py-2 border rounded-lg"
                  />
                )}
              </div>
            </label>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || selectedPlatforms.length === 0}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Publishing..."
              : scheduleType === "now"
              ? "Post Now"
              : "Schedule Post"}
          </button>
          <Link
            href="/dashboard/social"
            className="px-6 py-3 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
