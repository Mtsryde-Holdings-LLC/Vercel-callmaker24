"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";

interface Condition {
  field: string;
  operator: string;
  value: string;
}

const FIELD_OPTIONS = [
  { value: "totalSpent", label: "Total Spent ($)", type: "number" },
  { value: "orderCount", label: "Order Count", type: "number" },
  { value: "engagementScore", label: "Engagement Score (%)", type: "number" },
  { value: "loyaltyPoints", label: "Loyalty Points", type: "number" },
  {
    value: "loyaltyTier",
    label: "Loyalty Tier",
    type: "select",
    options: ["BRONZE", "SILVER", "GOLD", "DIAMOND"],
  },
  { value: "loyaltyMember", label: "Loyalty Member", type: "boolean" },
  {
    value: "churnRisk",
    label: "Churn Risk",
    type: "select",
    options: ["LOW", "MEDIUM", "HIGH"],
  },
  { value: "rfmScore", label: "RFM Score", type: "text" },
  {
    value: "source",
    label: "Customer Source",
    type: "select",
    options: ["SHOPIFY", "MANUAL", "IMPORT"],
  },
  { value: "smsOptIn", label: "SMS Opt-In", type: "boolean" },
  { value: "emailOptIn", label: "Email Opt-In", type: "boolean" },
  {
    value: "daysSinceLastOrder",
    label: "Days Since Last Order",
    type: "number",
  },
];

const OPERATOR_OPTIONS: Record<string, { value: string; label: string }[]> = {
  number: [
    { value: "gt", label: "Greater than" },
    { value: "gte", label: "Greater than or equal" },
    { value: "lt", label: "Less than" },
    { value: "lte", label: "Less than or equal" },
    { value: "eq", label: "Equal to" },
  ],
  text: [
    { value: "eq", label: "Equal to" },
    { value: "contains", label: "Contains" },
    { value: "startsWith", label: "Starts with" },
  ],
  select: [
    { value: "eq", label: "Is" },
    { value: "neq", label: "Is not" },
  ],
  boolean: [{ value: "eq", label: "Is" }],
};

export default function CreateSegmentPage() {
  const { primaryColor } = useTheme();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [conditions, setConditions] = useState<Condition[]>([
    { field: "totalSpent", operator: "gte", value: "" },
  ]);
  const [matchType, setMatchType] = useState<"all" | "any">("all");
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const getFieldConfig = (fieldValue: string) =>
    FIELD_OPTIONS.find((f) => f.value === fieldValue);

  const addCondition = () => {
    setConditions([
      ...conditions,
      { field: "totalSpent", operator: "gte", value: "" },
    ]);
  };

  const removeCondition = (index: number) => {
    if (conditions.length <= 1) return;
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (
    index: number,
    key: keyof Condition,
    value: string,
  ) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [key]: value };

    // Reset operator and value when field changes
    if (key === "field") {
      const fieldConfig = getFieldConfig(value);
      const ops = OPERATOR_OPTIONS[fieldConfig?.type || "number"];
      newConditions[index].operator = ops[0].value;
      newConditions[index].value = "";
    }

    setConditions(newConditions);
  };

  const handlePreview = async () => {
    setPreviewing(true);
    setPreviewCount(null);
    try {
      const res = await fetch("/api/segments/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditions, matchType }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewCount(data.data?.count ?? 0);
      }
    } catch (err) {
      console.error("Preview failed:", err);
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Segment name is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          conditions: { rules: conditions, matchType },
          autoUpdate,
          isAiPowered: false,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/segments");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create segment");
      }
    } catch (err) {
      setError("Failed to create segment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          ➕ Create Manual Segment
        </h1>
        <p className="text-gray-600 mt-1">
          Define rules to group customers by their behavior and attributes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name & Description */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Segment Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High Spenders, VIP Customers"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this segment represents..."
              rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Conditions */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              🎯 Conditions
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Match</span>
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value as any)}
                className="px-3 py-1 border rounded-lg bg-white text-sm"
              >
                <option value="all">All conditions</option>
                <option value="any">Any condition</option>
              </select>
            </div>
          </div>

          {conditions.map((condition, index) => {
            const fieldConfig = getFieldConfig(condition.field);
            const operators =
              OPERATOR_OPTIONS[fieldConfig?.type || "number"] || [];

            return (
              <div
                key={index}
                className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg"
              >
                {index > 0 && (
                  <span className="text-xs font-medium text-gray-500 w-full mb-1">
                    {matchType === "all" ? "AND" : "OR"}
                  </span>
                )}

                {/* Field */}
                <select
                  value={condition.field}
                  onChange={(e) =>
                    updateCondition(index, "field", e.target.value)
                  }
                  className="px-3 py-2 border rounded-lg bg-white text-sm flex-1 min-w-[180px]"
                >
                  {FIELD_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>

                {/* Operator */}
                <select
                  value={condition.operator}
                  onChange={(e) =>
                    updateCondition(index, "operator", e.target.value)
                  }
                  className="px-3 py-2 border rounded-lg bg-white text-sm"
                >
                  {operators.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>

                {/* Value */}
                {fieldConfig?.type === "select" ? (
                  <select
                    value={condition.value}
                    onChange={(e) =>
                      updateCondition(index, "value", e.target.value)
                    }
                    className="px-3 py-2 border rounded-lg bg-white text-sm flex-1 min-w-[120px]"
                  >
                    <option value="">Select...</option>
                    {fieldConfig.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : fieldConfig?.type === "boolean" ? (
                  <select
                    value={condition.value}
                    onChange={(e) =>
                      updateCondition(index, "value", e.target.value)
                    }
                    className="px-3 py-2 border rounded-lg bg-white text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : (
                  <input
                    type={fieldConfig?.type === "number" ? "number" : "text"}
                    value={condition.value}
                    onChange={(e) =>
                      updateCondition(index, "value", e.target.value)
                    }
                    placeholder="Enter value..."
                    className="px-3 py-2 border rounded-lg text-sm flex-1 min-w-[120px]"
                  />
                )}

                {/* Remove */}
                {conditions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCondition(index)}
                    className="text-red-500 hover:text-red-700 text-lg px-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={addCondition}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add Condition
          </button>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoUpdate}
              onChange={(e) => setAutoUpdate(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Auto-update membership
              </p>
              <p className="text-xs text-gray-500">
                Automatically add or remove customers as they meet or fall out
                of the conditions
              </p>
            </div>
          </label>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
          <div>
            {previewCount !== null && (
              <p className="text-sm text-gray-700">
                <span className="font-bold text-lg">{previewCount}</span>{" "}
                customers match these conditions
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewing}
            className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {previewing ? "Counting..." : "👁️ Preview Count"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.push("/dashboard/segments")}
            className="px-6 py-3 border rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {saving ? "Creating..." : "Create Segment"}
          </button>
        </div>
      </form>
    </div>
  );
}
