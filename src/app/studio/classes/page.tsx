"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function StudioClassesPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await supabase.from("Class").select("id,name").order("name");
    setClasses(data ?? []);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.from("Class").select("id,name").order("name");
      if (!cancelled) setClasses(data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    setLoading(true);
    await supabase.from("Class").insert({
      id: crypto.randomUUID(),
      name,
    });
    setNewName("");
    await refresh();
    setLoading(false);
  };

  const remove = async (id: string) => {
    await supabase.from("Class").delete().eq("id", id);
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-lum-on-background">
          Classes
        </h1>
        <p className="mt-1 text-sm text-lum-on-surface-variant">
          Classes are chosen when you add a lesson (step 2).
        </p>
      </div>

      <div className="lum-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g. Senior 1"
          className="lum-input min-w-0 flex-1"
        />
        <button
          type="button"
          onClick={add}
          disabled={loading}
          className="lum-btn-primary shrink-0 px-5 py-2.5 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {classes.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-lum-outline/20 bg-lum-surface-container-lowest px-4 py-3 shadow-lum-card"
          >
            <span className="font-medium text-lum-on-background">{c.name}</span>
            <button
              type="button"
              onClick={() => remove(c.id)}
              className="shrink-0 text-sm font-semibold text-lum-error hover:underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
