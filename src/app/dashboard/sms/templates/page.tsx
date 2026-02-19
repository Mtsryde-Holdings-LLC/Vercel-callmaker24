"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SmsTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  message: string;
  emoji: string;
  tags: string[];
}

export default function SmsTemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/sms/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch SMS templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaults = async () => {
    setInitializing(true);
    try {
      const res = await fetch("/api/sms/templates/init", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        alert(`✅ ${data.data?.count || 0} default SMS templates created!`);
        fetchTemplates();
      } else {
        const data = await res.json();
        alert(`ℹ️ ${data.error || "Templates already exist"}`);
      }
    } catch (error) {
      alert("❌ Failed to initialize templates");
    } finally {
      setInitializing(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try {
      const res = await fetch(`/api/sms/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates(templates.filter((t) => t.id !== id));
      }
    } catch (error) {
      alert("❌ Failed to delete template");
    }
  };

  const categories = [...new Set(templates.map((t) => t.category))].map(
    (cat) => ({
      id: cat,
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      icon:
        cat === "promotional"
          ? "🎯"
          : cat === "transactional"
            ? "💳"
            : cat === "reminder"
              ? "⏰"
              : cat === "seasonal"
                ? "🎉"
                : cat === "onboarding"
                  ? "👋"
                  : cat === "engagement"
                    ? "❤️"
                    : "📱",
    }),
  );

  const allCategories = [
    { id: "all", name: "All Templates", icon: "📱" },
    ...categories,
  ];

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.tags || []).some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template: SmsTemplate) => {
    localStorage.setItem("selectedSmsTemplate", JSON.stringify(template));
    router.push("/dashboard/sms/create?template=" + template.id);
  };

  const getMessageSegments = (message: string) =>
    Math.ceil(message.length / 160);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SMS Templates</h1>
          <p className="text-gray-600 mt-1">
            Pre-made messages with emojis and personalization
          </p>
        </div>
        <div className="flex items-center gap-3">
          {templates.length === 0 && (
            <button
              onClick={initializeDefaults}
              disabled={initializing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {initializing
                ? "⏳ Initializing..."
                : "🚀 Initialize Default Templates"}
            </button>
          )}
          <Link
            href="/dashboard/sms/create"
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </Link>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <div className="text-7xl mb-6">📱</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            No SMS Templates Yet
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Get started by initializing default templates or create your own
            custom template.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={initializeDefaults}
              disabled={initializing}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
            >
              {initializing
                ? "⏳ Initializing..."
                : "🚀 Initialize 30+ Default Templates"}
            </button>
            <Link
              href="/dashboard/sms/create"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              + Create Custom Template
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search templates, tags, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {allCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedCategory === cat.id
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-2xl font-bold text-primary-600">
                {templates.length}
              </div>
              <div className="text-sm text-gray-600">Total Templates</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-2xl font-bold text-green-600">
                {filteredTemplates.length}
              </div>
              <div className="text-sm text-gray-600">Showing Now</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-2xl font-bold text-blue-600">
                {categories.length}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-2xl font-bold text-purple-600">100%</div>
              <div className="text-sm text-gray-600">Customizable</div>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const segments = getMessageSegments(template.message);
              return (
                <div
                  key={template.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden"
                >
                  <div className="bg-gradient-to-br from-primary-50 to-purple-50 p-6 text-center border-b">
                    <div className="text-5xl mb-3">{template.emoji}</div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {template.description}
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="mb-4">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {allCategories.find((c) => c.id === template.category)
                          ?.name || template.category}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 min-h-[120px]">
                      <div className="text-sm text-gray-800 leading-relaxed break-words">
                        {template.message}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <span>📏</span>
                        <span>{template.message.length} chars</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>📨</span>
                        <span>{segments} SMS</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🏷️</span>
                        <span>{(template.tags || []).length} tags</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(template.tags || []).map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition font-medium"
                      >
                        Use This Template
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="px-3 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-xl font-semibold text-gray-900 mb-2">
                No templates found
              </div>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </>
      )}

      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Template Tips</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>
            • <strong>Personalization:</strong> Use variables like {"{{"}
            first_name{"}}"} to customize messages
          </li>
          <li>
            • <strong>Character Count:</strong> SMS messages are best under 160
            characters (1 SMS)
          </li>
          <li>
            • <strong>Emojis:</strong> Add personality and increase open rates
            by 20%+
          </li>
          <li>
            • <strong>Links:</strong> Use URL shorteners to save characters
          </li>
          <li>
            • <strong>Timing:</strong> Send between 10 AM - 8 PM for best
            engagement
          </li>
        </ul>
      </div>
    </div>
  );
}
