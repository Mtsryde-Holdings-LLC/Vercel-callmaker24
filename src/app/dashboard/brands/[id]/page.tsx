"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, X, Save, Sparkles } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  description: string | null;
  brandVoice: any;
  targetAudience: string | null;
  contentPillars: string[];
  primaryColors: string[];
  logoUrl: string | null;
  _count: {
    posts: number;
  };
}

export default function EditBrandPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    brandVoice: {
      tone: "",
      personality: "",
      values: [] as string[],
      writingStyle: "",
    },
    targetAudience: "",
    contentPillars: [] as string[],
    primaryColors: [] as string[],
    logoUrl: "",
  });

  const [newValue, setNewValue] = useState("");
  const [newPillar, setNewPillar] = useState("");
  const [newColor, setNewColor] = useState("#3B82F6");
  const [showIdeasModal, setShowIdeasModal] = useState(false);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [ideaConfig, setIdeaConfig] = useState({
    numberOfIdeas: 10,
    timeframe: "WEEK" as "WEEK" | "MONTH" | "QUARTER",
    includeImages: true,
  });

  useEffect(() => {
    fetchBrand();
  }, [brandId]);

  const fetchBrand = async () => {
    try {
      const res = await fetch(`/api/brands/${brandId}`);
      if (res.ok) {
        const data = await res.json();
        setBrand(data.brand);
        setFormData({
          name: data.brand.name,
          description: data.brand.description || "",
          brandVoice: data.brand.brandVoice || {
            tone: "",
            personality: "",
            values: [],
            writingStyle: "",
          },
          targetAudience: data.brand.targetAudience || "",
          contentPillars: data.brand.contentPillars || [],
          primaryColors: data.brand.primaryColors || [],
          logoUrl: data.brand.logoUrl || "",
        });
      } else {
        alert("Brand not found");
        router.push("/dashboard/brands");
      }
    } catch (error) {
      console.error("Failed to fetch brand:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/brands/${brandId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          logoUrl: formData.logoUrl || null,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/brands");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update brand");
      }
    } catch (error) {
      console.error("Failed to update brand:", error);
      alert("Failed to update brand");
    } finally {
      setSaving(false);
    }
  };

  const addValue = () => {
    if (newValue.trim()) {
      setFormData({
        ...formData,
        brandVoice: {
          ...formData.brandVoice,
          values: [...formData.brandVoice.values, newValue.trim()],
        },
      });
      setNewValue("");
    }
  };

  const removeValue = (index: number) => {
    setFormData({
      ...formData,
      brandVoice: {
        ...formData.brandVoice,
        values: formData.brandVoice.values.filter((_, i) => i !== index),
      },
    });
  };

  const addPillar = () => {
    if (newPillar.trim()) {
      setFormData({
        ...formData,
        contentPillars: [...formData.contentPillars, newPillar.trim()],
      });
      setNewPillar("");
    }
  };

  const removePillar = (index: number) => {
    setFormData({
      ...formData,
      contentPillars: formData.contentPillars.filter((_, i) => i !== index),
    });
  };

  const addColor = () => {
    if (newColor && !formData.primaryColors.includes(newColor)) {
      setFormData({
        ...formData,
        primaryColors: [...formData.primaryColors, newColor],
      });
    }
  };

  const removeColor = (index: number) => {
    setFormData({
      ...formData,
      primaryColors: formData.primaryColors.filter((_, i) => i !== index),
    });
  };

  const handleGenerateIdeas = async () => {
    if (!brand) return;

    setGeneratingIdeas(true);
    try {
      const res = await fetch("/api/ai/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: brand.id,
          numberOfIdeas: ideaConfig.numberOfIdeas,
          timeframe: ideaConfig.timeframe,
          includeImages: ideaConfig.includeImages,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(
          `✨ Successfully generated ${
            data.createdIdeas?.length || ideaConfig.numberOfIdeas
          } content ideas!`
        );
        setShowIdeasModal(false);
        router.push("/dashboard/ideas");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to generate ideas");
      }
    } catch (error) {
      console.error("Failed to generate ideas:", error);
      alert("Failed to generate ideas");
    } finally {
      setGeneratingIdeas(false);
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

  if (!brand) {
    return null;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back to Brands
        </button>
        
        <button
          onClick={() => setShowIdeasModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          <Sparkles size={20} />
          Generate Content Ideas
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Edit Brand
            </h1>
            <p className="text-gray-600">
              {brand._count.posts} posts created with this brand
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, logoUrl: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Brand Voice */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Brand Voice
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone
                </label>
                <input
                  type="text"
                  value={formData.brandVoice.tone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      brandVoice: {
                        ...formData.brandVoice,
                        tone: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personality
                </label>
                <input
                  type="text"
                  value={formData.brandVoice.personality}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      brandVoice: {
                        ...formData.brandVoice,
                        personality: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Core Values
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addValue())
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={addValue}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.brandVoice.values.map((value, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full"
                    >
                      {value}
                      <button
                        type="button"
                        onClick={() => removeValue(idx)}
                        className="hover:text-blue-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Writing Style
                </label>
                <textarea
                  value={formData.brandVoice.writingStyle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      brandVoice: {
                        ...formData.brandVoice,
                        writingStyle: e.target.value,
                      },
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Target Audience
            </h2>
            <textarea
              value={formData.targetAudience}
              onChange={(e) =>
                setFormData({ ...formData, targetAudience: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Content Pillars */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Content Pillars
            </h2>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newPillar}
                onChange={(e) => setNewPillar(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addPillar())
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addPillar}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.contentPillars.map((pillar, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full"
                >
                  {pillar}
                  <button
                    type="button"
                    onClick={() => removePillar(idx)}
                    className="hover:text-purple-900"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Brand Colors */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Brand Colors
            </h2>
            <div className="flex gap-2 mb-2">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <button
                type="button"
                onClick={addColor}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Color
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.primaryColors.map((color, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
                >
                  <div
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-mono">{color}</span>
                  <button
                    type="button"
                    onClick={() => removeColor(idx)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Generate Ideas Modal */}
      {showIdeasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="text-purple-600" size={24} />
                <h3 className="text-lg font-semibold">Generate Content Ideas</h3>
              </div>
              <button
                onClick={() => setShowIdeasModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Number of Ideas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Ideas
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={ideaConfig.numberOfIdeas}
                  onChange={(e) => setIdeaConfig(prev => ({
                    ...prev,
                    numberOfIdeas: parseInt(e.target.value) || 1
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Timeframe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeframe
                </label>
                <select
                  value={ideaConfig.timeframe}
                  onChange={(e) => setIdeaConfig(prev => ({
                    ...prev,
                    timeframe: e.target.value as 'WEEK' | 'MONTH' | 'QUARTER'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="WEEK">Weekly</option>
                  <option value="MONTH">Monthly</option>
                  <option value="QUARTER">Quarterly</option>
                </select>
              </div>

              {/* Include Images */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeImages"
                  checked={ideaConfig.includeImages}
                  onChange={(e) => setIdeaConfig(prev => ({
                    ...prev,
                    includeImages: e.target.checked
                  }))}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="includeImages" className="text-sm font-medium text-gray-700">
                  Generate AI images for each idea
                </label>
              </div>

              {/* Description */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-900">
                  AI will generate {ideaConfig.numberOfIdeas} content {ideaConfig.numberOfIdeas === 1 ? 'idea' : 'ideas'} based on your brand voice, 
                  target audience, and content pillars{ideaConfig.includeImages ? ', including AI-generated images' : ''}.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowIdeasModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={generatingIdeas}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateIdeas}
                disabled={generatingIdeas}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
              >
                {generatingIdeas ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
