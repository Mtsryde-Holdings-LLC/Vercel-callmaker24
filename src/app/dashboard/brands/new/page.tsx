'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X } from 'lucide-react';

export default function NewBrandPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brandVoice: {
      tone: '',
      personality: '',
      values: [] as string[],
      writingStyle: '',
    },
    targetAudience: '',
    contentPillars: [] as string[],
    primaryColors: [] as string[],
    logoUrl: '',
  });

  const [newValue, setNewValue] = useState('');
  const [newPillar, setNewPillar] = useState('');
  const [newColor, setNewColor] = useState('#3B82F6');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          logoUrl: formData.logoUrl || null,
        }),
      });

      if (res.ok) {
        router.push('/dashboard/brands');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create brand');
      }
    } catch (error) {
      console.error('Failed to create brand:', error);
      alert('Failed to create brand');
    } finally {
      setLoading(false);
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
      setNewValue('');
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
      setNewPillar('');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Brand</h1>
        <p className="text-gray-600 mb-8">
          Define your brand identity to generate consistent, on-brand content with AI
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Acme Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of your brand..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          </div>

          {/* Brand Voice */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Brand Voice</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone
                </label>
                <input
                  type="text"
                  value={formData.brandVoice.tone}
                  onChange={(e) => setFormData({
                    ...formData,
                    brandVoice: { ...formData.brandVoice, tone: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Professional, Friendly, Humorous"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personality
                </label>
                <input
                  type="text"
                  value={formData.brandVoice.personality}
                  onChange={(e) => setFormData({
                    ...formData,
                    brandVoice: { ...formData.brandVoice, personality: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Approachable, Innovative, Trustworthy"
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
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add a core value..."
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
                  onChange={(e) => setFormData({
                    ...formData,
                    brandVoice: { ...formData.brandVoice, writingStyle: e.target.value }
                  })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your preferred writing style..."
                />
              </div>
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Target Audience</h2>
            <textarea
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your target audience..."
            />
          </div>

          {/* Content Pillars */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Content Pillars</h2>
            <p className="text-sm text-gray-600 mb-4">
              Define the main themes and topics your brand focuses on
            </p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newPillar}
                onChange={(e) => setNewPillar(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPillar())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add a content pillar..."
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Brand Colors</h2>
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
              disabled={loading}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Brand'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
