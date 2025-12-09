"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, TrendingUp } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  description: string | null;
  brandVoice: any;
  targetAudience: string | null;
  contentPillars: string[];
  primaryColors: string[];
  logoUrl: string | null;
  createdAt: string;
  _count: {
    posts: number;
  };
}

export default function BrandsPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const res = await fetch("/api/brands");
      if (res.ok) {
        const data = await res.json();
        setBrands(data.brands);
      }
    } catch (error) {
      console.error("Failed to fetch brands:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (brandId: string, brandName: string) => {
    if (!confirm(`Are you sure you want to delete "${brandName}"?`)) {
      return;
    }

    setDeleting(brandId);
    try {
      const res = await fetch(`/api/brands/${brandId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setBrands(brands.filter((b) => b.id !== brandId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete brand");
      }
    } catch (error) {
      console.error("Failed to delete brand:", error);
      alert("Failed to delete brand");
    } finally {
      setDeleting(null);
    }
  };

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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Management</h1>
          <p className="text-gray-600 mt-1">
            Define your brand voice and manage content creation
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/brands/new")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          New Brand
        </button>
      </div>

      {brands.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No brands yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first brand to start generating AI-powered content
              with a consistent voice.
            </p>
            <button
              onClick={() => router.push("/dashboard/brands/new")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Create Your First Brand
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {brand.logoUrl && (
                <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="max-h-24 max-w-full object-contain"
                  />
                </div>
              )}
              {!brand.logoUrl && (
                <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="text-white text-4xl font-bold">
                    {brand.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}

              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {brand.name}
                </h3>

                {brand.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {brand.description}
                  </p>
                )}

                {brand.contentPillars.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {brand.contentPillars.slice(0, 3).map((pillar, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {pillar}
                        </span>
                      ))}
                      {brand.contentPillars.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{brand.contentPillars.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{brand._count.posts} posts</span>
                  {brand.targetAudience && (
                    <span className="truncate ml-2">
                      👥 {brand.targetAudience}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/brands/${brand.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(brand.id, brand.name)}
                    disabled={deleting === brand.id}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
