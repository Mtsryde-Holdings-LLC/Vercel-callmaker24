"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, X, Save } from "lucide-react";

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
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Brands
      </button>

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
    </div>
  );
}
