"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  subject: string;
  preheader: string;
  content: string;
  isPremium: boolean;
}

export default function EmailTemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/email/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Failed to fetch email templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaults = async () => {
    setInitializing(true);
    try {
      const res = await fetch("/api/email/templates/init", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        alert(`✅ ${data.count} default email templates created!`);
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
      const res = await fetch(`/api/email/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates(templates.filter((t) => t.id !== id));
      }
    } catch (error) {
      alert("❌ Failed to delete template");
    }
  };

  const categories = [
    { id: "all", name: "All Templates" },
    ...[...new Set(templates.map((t) => t.category))].map((cat) => ({
      id: cat,
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
    })),
  ];

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template: EmailTemplate) => {
    localStorage.setItem("selectedEmailTemplate", JSON.stringify(template));
    router.push("/dashboard/email/create?template=" + template.id);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-1">
            Choose from professionally designed templates
          </p>
        </div>
        <div className="flex items-center gap-3">
          {templates.length === 0 && (
            <button
              onClick={initializeDefaults}
              disabled={initializing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {initializing ? "⏳ Initializing..." : "🚀 Initialize Default Templates"}
            </button>
          )}
          <Link
            href="/dashboard/email/create"
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </Link>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <div className="text-7xl mb-6">📧</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Email Templates Yet</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Get started by initializing default templates or create your own custom template.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={initializeDefaults}
              disabled={initializing}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
            >
              {initializing ? "⏳ Initializing..." : "🚀 Initialize 14 Default Templates"}
            </button>
            <Link href="/dashboard/email/create" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              + Create Custom Template
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-2xl font-bold text-primary-600">{templates.length}</div>
              <div className="text-sm text-gray-600">Total Templates</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-2xl font-bold text-green-600">{filteredTemplates.length}</div>
              <div className="text-sm text-gray-600">Showing Now</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-2xl font-bold text-blue-600">{categories.length - 1}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-2xl font-bold text-yellow-600">{templates.filter((t) => t.isPremium).length}</div>
              <div className="text-sm text-gray-600">Premium Templates</div>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden"
              >
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-12 text-center">
                  <div className="text-6xl">{template.thumbnail}</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-gray-900">
                      {template.name}
                    </h3>
                    {template.isPremium && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {template.description}
                  </p>
                  <div className="mb-4">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {categories.find((c) => c.id === template.category)?.name || template.category}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="text-xs text-gray-500">
                      <strong>Subject:</strong>{" "}
                      {template.subject.length > 50
                        ? template.subject.substring(0, 50) + "..."
                        : template.subject}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition font-medium"
                    >
                      Use Template
                    </button>
                    <button
                      onClick={() => setPreviewTemplate(template)}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                      title="Preview"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-xl font-semibold text-gray-900 mb-2">No templates found</div>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{previewTemplate.name}</h2>
                <p className="text-sm text-gray-600">{previewTemplate.subject}</p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div
                dangerouslySetInnerHTML={{ __html: previewTemplate.content }}
                className="border border-gray-200 rounded-lg overflow-hidden"
              />
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={() => {
                  handleUseTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 font-medium"
              >
                Use This Template
              </button>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
