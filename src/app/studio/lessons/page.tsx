"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isPlayableVideoUrl, toEmbedUrl } from "@/lib/video";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  published: boolean;
  sortOrder: number;
};

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function humanFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)}MB`;
}

function friendlyUploadError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("row-level security") || m.includes("not allowed")) {
    return "Upload blocked by Supabase Storage policy. Add INSERT policy for authenticated users on bucket 'lesson-videos'.";
  }
  if (m.includes("payload too large") || m.includes("entity too large") || m.includes("size")) {
    return "Video is too large for current bucket limit. Increase bucket file size limit in Supabase Storage settings.";
  }
  if (m.includes("bucket not found")) {
    return "Bucket not found. Create 'lesson-videos' bucket or set NEXT_PUBLIC_SUPABASE_VIDEO_BUCKET.";
  }
  return message;
}

export default function StudioLessonsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Loading lessons...");

  const maxUploadMb = Number(process.env.NEXT_PUBLIC_MAX_VIDEO_MB ?? 50);

  async function loadLessons() {
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from("Lesson")
      .select("id,title,description,videoUrl,published,sortOrder")
      .order("sortOrder", { ascending: true });
    if (dbError) setError(dbError.message);
    else setLessons((data as Lesson[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data, error: dbError } = await supabase
        .from("Lesson")
        .select("id,title,description,videoUrl,published,sortOrder")
        .order("sortOrder", { ascending: true });
      if (dbError) setError(dbError.message);
      else setLessons((data as Lesson[]) ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  async function createLesson(formData: FormData) {
    setSaving(true);
    setError(null);
    setLoadingText("Preparing lesson...");

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    const rawVideoUrl = String(formData.get("videoUrl") ?? "").trim();
    const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
    const videoFile = formData.get("videoFile");

    if (!title) {
      setError("Title is required.");
      setSaving(false);
      return;
    }

    const lessonId = crypto.randomUUID();
    let finalVideoUrl = "";

    if (videoFile instanceof File && videoFile.size > 0) {
      const maxBytes = maxUploadMb * 1024 * 1024;
      if (videoFile.size > maxBytes) {
        setError(
          `Selected file is ${humanFileSize(videoFile.size)}. Max allowed is ${maxUploadMb}MB.`,
        );
        setSaving(false);
        return;
      }

      const bucket = process.env.NEXT_PUBLIC_SUPABASE_VIDEO_BUCKET || "lesson-videos";
      const extension = videoFile.name.includes(".")
        ? videoFile.name.split(".").pop()
        : "mp4";
      const objectPath = `${lessonId}/${Date.now()}-${sanitizeFileName(videoFile.name || `video.${extension}`)}`;

      setLoadingText("Uploading video to storage...");
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(objectPath, videoFile, {
          upsert: false,
          contentType: videoFile.type || "video/mp4",
        });

      if (uploadError) {
        setError(`Upload failed: ${friendlyUploadError(uploadError.message)}`);
        setSaving(false);
        return;
      }

      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
      finalVideoUrl = publicData.publicUrl;
    } else {
      finalVideoUrl = toEmbedUrl(rawVideoUrl);
      if (!isPlayableVideoUrl(finalVideoUrl)) {
        setError(
          "Provide a YouTube/Vimeo URL or upload a video file (mp4/webm/ogg/mov).",
        );
        setSaving(false);
        return;
      }
    }

    setLoadingText("Saving lesson...");
    const nowIso = new Date().toISOString();
    const { error: dbError } = await supabase.from("Lesson").insert({
      id: lessonId,
      title,
      description,
      videoUrl: finalVideoUrl,
      sortOrder,
      published: false,
      updatedAt: nowIso,
    });

    setSaving(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    setLoadingText("Refreshing lessons...");
    await loadLessons();
  }

  async function togglePublished(lesson: Lesson) {
    setLoadingText("Updating lesson visibility...");
    await supabase
      .from("Lesson")
      .update({ published: !lesson.published, updatedAt: new Date().toISOString() })
      .eq("id", lesson.id);
    await loadLessons();
  }

  async function removeLesson(id: string) {
    setLoadingText("Deleting lesson...");
    await supabase.from("Lesson").delete().eq("id", id);
    await loadLessons();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Lessons</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create lessons from YouTube/Vimeo links or upload video files to Supabase Storage.
        </p>
      </div>

      <form
        className="grid gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
        onSubmit={() => {
          setSaving(true);
          setLoadingText("Submitting lesson...");
        }}
        action={(fd) => createLesson(fd)}
      >
        <fieldset disabled={saving} className="grid gap-3">
          <input name="title" placeholder="Lesson title" className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
          <input name="videoUrl" placeholder="https://youtube.com/watch?v=... (optional when uploading file)" className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
          <input name="videoFile" type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov,.m4v" className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
          <p className="text-xs text-zinc-500">Max upload size: {maxUploadMb}MB (configurable with NEXT_PUBLIC_MAX_VIDEO_MB).</p>
          <textarea name="description" rows={2} placeholder="Description (optional)" className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
          <input name="sortOrder" type="number" defaultValue={0} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
          <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60">{saving ? loadingText : "Create lesson"}</button>
        </fieldset>
      </form>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
          {loadingText}
        </div>
      ) : (
        <ul className="space-y-3">
          {lessons.map((lesson) => (
            <li key={lesson.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <div>
                <p className="font-medium">{lesson.title}</p>
                <p className="text-xs text-zinc-500">{lesson.published ? "Published" : "Draft"}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => togglePublished(lesson)} className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm dark:bg-zinc-800">{lesson.published ? "Unpublish" : "Publish"}</button>
                <button type="button" onClick={() => removeLesson(lesson.id)} className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
