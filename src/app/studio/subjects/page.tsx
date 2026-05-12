"use client";

import { useEffect, useState, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function StudioSubjectsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("Subject")
        .select("id,name")
        .order("name");
      if (!cancelled) setSubjects(data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    setLoading(true);
    await supabase.from("Subject").insert({
      id: crypto.randomUUID(),
      name,
    });
    setNewName("");
    const { data } = await supabase
      .from("Subject")
      .select("id,name")
      .order("name");
    setSubjects(data ?? []);
    setLoading(false);
  };

  const remove = async (id: string) => {
    await supabase.from("Subject").delete().eq("id", id);
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-lum-on-background">
          Subjects
        </h1>
        <p className="mt-1 text-sm text-lum-on-surface-variant">
          Subjects are global and shared by all classes. Use the lesson wizard to
          place topics per class under these shared subjects.
        </p>
      </div>

      <div className="lum-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Subject name (e.g. Physics)"
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
        {subjects.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-lum-outline/20 bg-lum-surface-container-lowest px-4 py-3 shadow-lum-card"
          >
            <span className="font-medium text-lum-on-background">{s.name}</span>
            <button
              type="button"
              onClick={() => remove(s.id)}
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
