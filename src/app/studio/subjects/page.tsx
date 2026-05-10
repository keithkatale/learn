"use client";

import { useEffect, useState, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function StudioSubjectsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [classId, setClassId] = useState("");
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadClasses() {
      const { data } = await supabase.from("Class").select("id,name").order("name");
      const list = data ?? [];
      setClasses(list);
      setClassId((prev) => {
        if (prev && list.some((c) => c.id === prev)) return prev;
        return list[0]?.id ?? "";
      });
    }
    loadClasses();
  }, [supabase]);

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("Subject")
        .select("id,name")
        .eq("classId", classId)
        .order("name");
      if (!cancelled) setSubjects(data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, classId]);

  const add = async () => {
    const name = newName.trim();
    if (!name || !classId) return;
    setLoading(true);
    await supabase.from("Subject").insert({
      id: crypto.randomUUID(),
      name,
      classId,
    });
    setNewName("");
    const { data } = await supabase
      .from("Subject")
      .select("id,name")
      .eq("classId", classId)
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
          Subjects belong to a class. The lesson wizard links subject + class +
          topic.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-lum-on-background">
          Class
        </label>
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="lum-input max-w-md w-full"
        >
          {classes.length === 0 ? (
            <option value="">Create a class first</option>
          ) : (
            classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="lum-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Subject name (e.g. Physics)"
          disabled={!classId}
          className="lum-input min-w-0 flex-1 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={add}
          disabled={loading || !classId}
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
