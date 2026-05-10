"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isPlayableVideoUrl, toEmbedUrl } from "@/lib/video";
import {
  parseAttachments,
  uploadLessonAttachments,
  validateAttachmentFile,
  removeAttachmentObject,
  type LessonAttachmentMeta,
} from "@/lib/lesson-attachments";
import { fetchLessonForStudioEdit } from "@/lib/lesson-hierarchy";

type LessonRow = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  published: boolean;
  sortOrder: number;
  attachments: unknown;
  topic: {
    name: string;
    subject: { name: string; class: { name: string } };
  } | null;
};

export default function EditLessonPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<LessonRow | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [published, setPublished] = useState(false);
  const [attachList, setAttachList] = useState<LessonAttachmentMeta[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { lesson: row, error: qErr } =
        await fetchLessonForStudioEdit(supabase, id);

      if (cancelled) return;
      if (!row) {
        setError(qErr ?? "Lesson not found.");
        setLesson(null);
        setLoading(false);
        return;
      }

      const typed = row as unknown as LessonRow;
      setLesson(typed);
      setTitle(typed.title);
      setDescription(typed.description ?? "");
      setVideoUrl(typed.videoUrl);
      setPublished(typed.published);
      setAttachList(parseAttachments(typed.attachments));
      setPendingFiles([]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, supabase]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const trimmedUrl = videoUrl.trim();
    if (!title.trim()) {
      setError("Enter a title.");
      setSaving(false);
      return;
    }
    if (!trimmedUrl || !isPlayableVideoUrl(trimmedUrl)) {
      setError(
        "Enter a valid video URL (YouTube, Vimeo, or https link to .mp4 / .webm).",
      );
      setSaving(false);
      return;
    }

    for (const f of pendingFiles) {
      const ve = validateAttachmentFile(f);
      if (ve) {
        setError(ve);
        setSaving(false);
        return;
      }
    }

    let merged = attachList;
    if (pendingFiles.length > 0) {
      const { attachments: uploaded, error: upMsg } =
        await uploadLessonAttachments(supabase, id, pendingFiles);
      if (upMsg) {
        setError(upMsg);
        setSaving(false);
        return;
      }
      merged = [...attachList, ...uploaded];
      setAttachList(merged);
      setPendingFiles([]);
    }

    const embedUrl = toEmbedUrl(trimmedUrl);
    const { error: uErr } = await supabase
      .from("Lesson")
      .update({
        title: title.trim(),
        description: description.trim() || null,
        videoUrl: embedUrl,
        published,
        attachments: merged,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id);

    setSaving(false);
    if (uErr) {
      setError(uErr.message);
      return;
    }
    router.push("/studio/lessons");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-lum-on-surface-variant">
        Loading lesson…
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="space-y-4 py-10">
        <p className="text-red-600">{error ?? "Lesson not found."}</p>
        <Link
          href="/studio/lessons"
          className="text-lum-primary hover:underline"
        >
          ← Back to lessons
        </Link>
      </div>
    );
  }

  const cls = lesson.topic?.subject?.class?.name ?? "—";
  const sub = lesson.topic?.subject?.name ?? "—";
  const topic = lesson.topic?.name ?? "—";

  async function removeStoredAttachment(meta: LessonAttachmentMeta) {
    setError(null);
    const { error: delErr } = await removeAttachmentObject(supabase, meta.path);
    if (delErr) {
      setError(delErr);
      return;
    }
    const next = attachList.filter((a) => a.path !== meta.path);
    setAttachList(next);
    const { error: uErr } = await supabase
      .from("Lesson")
      .update({
        attachments: next,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id);
    if (uErr) setError(uErr.message);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <div>
        <Link
          href="/studio/lessons"
          className="text-sm text-lum-primary hover:underline"
        >
          ← Lessons
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Edit lesson</h1>
        <div className="mt-3 flex flex-wrap gap-1 text-[10px] font-bold uppercase">
          <span className="rounded bg-indigo-100 px-2 py-0.5 text-indigo-800">
            {cls}
          </span>
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-800">
            {sub}
          </span>
          <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-900">
            {topic}
          </span>
        </div>
        <p className="mt-2 text-sm text-lum-on-surface-variant">
          Placement (class / subject / topic) is fixed. Change it by creating a
          new lesson in the wizard.
        </p>
        <p className="mt-1 text-sm text-lum-on-surface-variant">
          Lesson order in this chapter is{" "}
          <span className="font-semibold text-lum-on-background">
            #{lesson.sortOrder}
          </span>{" "}
          (set when the lesson was created).
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-lum-error/25 bg-lum-error-container/80 p-4 text-sm text-lum-error">
          {error}
        </div>
      ) : null}

      <form onSubmit={save} className="lum-card space-y-4 p-6">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-lum-on-background">
            Title
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="lum-input"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-lum-on-background">
            Video URL
          </label>
          <input
            required
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="lum-input"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="size-4 rounded border border-lum-outline/40 text-lum-primary focus:ring-lum-primary"
          />
          <label
            htmlFor="published"
            className="text-sm font-medium text-lum-on-background"
          >
            Published (visible to learners when your app rules allow)
          </label>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-lum-on-background">
            Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="lum-input"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-dashed border-lum-outline/35 bg-lum-surface-container-low p-4">
          <div>
            <label className="text-sm font-semibold text-lum-on-background">
              Attachments
            </label>
            <p className="mt-1 text-xs text-lum-on-surface-variant">
              PDFs and documents (Supabase bucket{" "}
              <span className="font-mono text-lum-primary">
                lesson-attachments
              </span>
              ). Saving will upload pending files.
            </p>
          </div>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.png,.jpg,.jpeg,.webp"
            className="block w-full text-sm text-lum-on-surface-variant file:mr-3 file:rounded-lg file:border-0 file:bg-lum-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-lum-on-primary"
            onChange={(e) => {
              const list = e.target.files;
              if (!list?.length) return;
              setPendingFiles((p) => [...p, ...Array.from(list)]);
              e.target.value = "";
            }}
          />
          {pendingFiles.length > 0 ? (
            <ul className="space-y-1 text-sm text-amber-950">
              {pendingFiles.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate">{f.name} (pending upload)</span>
                  <button
                    type="button"
                    className="font-semibold text-lum-error hover:underline"
                    onClick={() =>
                      setPendingFiles((prev) => prev.filter((_, j) => j !== i))
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {attachList.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {attachList.map((a) => (
                <li
                  key={a.path}
                  className="flex items-center justify-between gap-2 rounded-lg border border-lum-outline/20 bg-lum-surface-container-lowest px-3 py-2"
                >
                  <span className="truncate font-medium text-lum-on-background">
                    {a.label}
                  </span>
                  <button
                    type="button"
                    className="shrink-0 font-semibold text-lum-error hover:underline"
                    onClick={() => void removeStoredAttachment(a)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex gap-3 pt-4">
          <Link
            href="/studio/lessons"
            className="flex-1 rounded-lg border border-lum-outline/30 py-3 text-center font-semibold text-lum-on-background hover:bg-lum-surface-container-low"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="lum-btn-primary flex-[2] justify-center py-3 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
