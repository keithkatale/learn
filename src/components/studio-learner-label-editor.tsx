"use client";

import { useEffect, useState } from "react";

export function StudioLearnerLabelEditor({
  userId,
  initialLabel,
  disabled,
  onSaved,
}: {
  userId: string;
  initialLabel: string;
  disabled: boolean;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(initialLabel);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(initialLabel);
  }, [initialLabel, userId]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/studio/learner-label", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, instructorLabel: value }),
      });
      if (res.ok) onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Display name"
        disabled={disabled || saving}
        className="lum-input min-w-[8rem] max-w-[14rem] flex-1 text-sm"
        maxLength={120}
      />
      <button
        type="button"
        disabled={disabled || saving || value.trim() === (initialLabel || "").trim()}
        onClick={() => void save()}
        className="rounded-lg border border-lum-outline/35 px-3 py-1.5 text-xs font-semibold text-lum-on-background hover:bg-lum-surface-container-low disabled:opacity-40"
      >
        {saving ? "…" : "Save"}
      </button>
    </div>
  );
}
