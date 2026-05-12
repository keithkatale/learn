"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { isPlayableVideoUrl, toEmbedUrl } from "@/lib/video";
import {
  uploadLessonAttachments,
  validateAttachmentFile,
  type LessonAttachmentUploadProgress,
} from "@/lib/lesson-attachments";
import { AttachmentUploadProgressBar } from "@/components/attachment-upload-progress";
import { nextLessonSortOrder, nextTopicSortOrder } from "@/lib/content-order";

export default function NewLessonPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [topics, setTopics] = useState<{ id: string; name: string }[]>([]);

  const [selectedSubjectName, setSelectedSubjectName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");

  const [newTopicName, setNewTopicName] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");

  const [lessonData, setLessonData] = useState({
    title: "",
    videoUrl: "",
    description: "",
  });
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentUploadProgress, setAttachmentUploadProgress] =
    useState<LessonAttachmentUploadProgress | null>(null);

  useEffect(() => {
    async function loadSubjects() {
      const { data } = await supabase.from("Subject").select("name").order("name");
      setSubjects((data ?? []).map((s) => s.name));
    }
    loadSubjects();
  }, [supabase]);

  useEffect(() => {
    async function loadClasses() {
      const { data } = await supabase.from("Class").select("id,name");
      setClasses(data ?? []);
    }
    loadClasses();
  }, [supabase]);

  useEffect(() => {
    if (!selectedSubjectName || !selectedClassId) {
      return;
    }

    let cancelled = false;
    async function loadTopics() {
      setTopicsLoading(true);
      const { data: subData } = await supabase
        .from("Subject")
        .select("id")
        .eq("name", selectedSubjectName)
        .maybeSingle();

      if (cancelled) return;

      if (!subData?.id) {
        setTopics([]);
        setTopicsLoading(false);
        return;
      }

      const { data: topicData } = await supabase
        .from("Topic")
        .select("id,name,sortOrder")
        .eq("subjectId", subData.id)
        .eq("classId", selectedClassId)
        .order("sortOrder", { ascending: true })
        .order("name", { ascending: true });

      if (!cancelled) {
        setTopics(topicData ?? []);
        setTopicsLoading(false);
      }
    }
    loadTopics();
    return () => {
      cancelled = true;
    };
  }, [selectedSubjectName, selectedClassId, supabase]);

  function goStep1() {
    setStep(1);
    setSelectedClassId("");
    setSelectedTopicId("");
    setNewTopicName("");
  }

  function goStep2() {
    setStep(2);
    setSelectedTopicId("");
    setNewTopicName("");
  }

  function selectSubject(name: string) {
    setSelectedSubjectName(name);
    setStep(2);
  }

  function selectClass(id: string) {
    setSelectedClassId(id);
    setStep(3);
    setSelectedTopicId("");
    setNewTopicName("");
  }

  function selectExistingTopic(id: string) {
    setSelectedTopicId(id);
    setStep(4);
  }

  function useNewTopic() {
    const trimmed = newTopicName.trim();
    if (!trimmed) return;
    setSelectedTopicId("NEW");
    setStep(4);
  }

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setAttachmentUploadProgress(null);

    const urlOk =
      lessonData.videoUrl.trim().length > 0 &&
      isPlayableVideoUrl(lessonData.videoUrl.trim());
    if (!lessonData.title.trim()) {
      setError("Enter a lesson title.");
      setLoading(false);
      return;
    }
    if (!urlOk) {
      setError(
        "Enter a valid video URL (YouTube, Vimeo, or https link to .mp4 / .webm).",
      );
      setLoading(false);
      return;
    }

    try {
      let subjectId: string;
      const { data: existingSub } = await supabase
        .from("Subject")
        .select("id")
        .eq("name", selectedSubjectName.trim())
        .maybeSingle();

      if (existingSub?.id) {
        subjectId = existingSub.id;
      } else {
        const { data: newSub, error: subErr } = await supabase
          .from("Subject")
          .insert({
            id: crypto.randomUUID(),
            name: selectedSubjectName.trim(),
          })
          .select("id")
          .single();
        if (subErr) throw subErr;
        subjectId = newSub!.id;
      }

      let finalTopicId = selectedTopicId;
      if (finalTopicId === "NEW") {
        const topicSort = await nextTopicSortOrder(
          supabase,
          subjectId,
          selectedClassId,
        );
        const { data: newTopic, error: topicErr } = await supabase
          .from("Topic")
          .insert({
            id: crypto.randomUUID(),
            name: newTopicName.trim(),
            subjectId,
            classId: selectedClassId,
            sortOrder: topicSort,
          })
          .select("id")
          .single();
        if (topicErr) throw topicErr;
        finalTopicId = newTopic!.id;
      }

      const lessonSortOrder = await nextLessonSortOrder(supabase, finalTopicId);

      const embedUrl = toEmbedUrl(lessonData.videoUrl.trim());
      const now = new Date().toISOString();
      const lessonId = crypto.randomUUID();

      for (const f of attachmentFiles) {
        const ve = validateAttachmentFile(f);
        if (ve) throw new Error(ve);
      }

      const { error: lessonErr } = await supabase.from("Lesson").insert({
        id: lessonId,
        title: lessonData.title.trim(),
        description: lessonData.description.trim() || null,
        videoUrl: embedUrl,
        sortOrder: lessonSortOrder,
        topicId: finalTopicId,
        published: true,
        updatedAt: now,
        attachments: [],
      });
      if (lessonErr) throw lessonErr;

      if (attachmentFiles.length > 0) {
        const { attachments, error: attErr } =
          await uploadLessonAttachments(
            supabase,
            lessonId,
            attachmentFiles,
            (p) => setAttachmentUploadProgress(p),
          );
        if (attErr) throw new Error(attErr);
        if (attachments.length > 0) {
          const { error: updErr } = await supabase
            .from("Lesson")
            .update({
              attachments,
              updatedAt: new Date().toISOString(),
            })
            .eq("id", lessonId);
          if (updErr) throw updErr;
        }
      }

      router.push("/studio/lessons");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save lesson.");
    } finally {
      setAttachmentUploadProgress(null);
      setLoading(false);
    }
  };

  return (
    <div className="studio-discovery mx-auto max-w-2xl space-y-8 px-4 py-10 text-lum-on-background">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Create new lesson
        </h1>
        <p className="text-sm text-lum-on-surface-variant">Step {step} of 4</p>
        <div className="mx-auto flex max-w-xs gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${step >= s ? "bg-lum-primary" : "bg-lum-surface-container-high"}`}
            />
          ))}
        </div>
        <p className="text-xs text-lum-on-surface-variant">
          Subject → class → topic → lesson details
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200/80 bg-lum-error-container px-4 py-3 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold">
            1. Select or name the subject
          </h2>
          <p className="text-sm text-lum-on-surface-variant">
            Choose an existing subject label, or type a new one for the class you
            pick next.
          </p>
          <div className="grid gap-3">
            {subjects.length === 0 ? (
              <p className="rounded-xl border border-dashed border-lum-outline/35 bg-lum-surface-container-low/80 p-6 text-center text-sm text-lum-on-surface-variant">
                No subjects yet — type a name below (e.g. Physics).
              </p>
            ) : (
              subjects.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => selectSubject(name)}
                  className="lum-choice-tile"
                >
                  {name}
                </button>
              ))
            )}
            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-stretch">
              <input
                placeholder="New subject name…"
                className="lum-input flex-1"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  const t = newSubjectName.trim();
                  if (t) selectSubject(t);
                }}
                className="lum-btn-primary shrink-0 px-6 py-2.5 sm:self-center"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold">
            2. Select class for “{selectedSubjectName}”
          </h2>
          {classes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-lum-outline/35 bg-lum-surface-container-low/80 p-6 text-center">
              <p className="text-sm text-lum-on-surface-variant">
                Create a class first in{" "}
                <Link
                  href="/studio/classes"
                  className="font-semibold text-lum-primary hover:underline"
                >
                  Classes
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {classes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectClass(c.id)}
                  className="lum-choice-tile"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={goStep1}
            className="mt-4 text-sm text-lum-on-surface-variant hover:text-lum-primary hover:underline"
          >
            ← Back to subjects
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold">
            3. Select or create a topic
          </h2>
          <p className="text-sm text-lum-on-surface-variant">
            Topics group lessons inside this subject. Create one if none exist
            yet.
          </p>
          {topicsLoading ? (
            <div className="py-12 text-center text-sm text-lum-on-surface-variant">
              Loading topics…
            </div>
          ) : (
            <div className="grid gap-3">
              {topics.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectExistingTopic(t.id)}
                  className="lum-choice-tile"
                >
                  {t.name}
                </button>
              ))}
              <div className="space-y-3 rounded-xl border-2 border-dashed border-lum-outline/30 bg-lum-surface-container-low p-5">
                <p className="text-sm font-semibold text-lum-on-background">
                  New topic
                </p>
                <input
                  placeholder="Topic name…"
                  className="lum-input"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={useNewTopic}
                  className="lum-btn-primary w-full justify-center py-3"
                >
                  Use new topic & continue
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={goStep2}
            className="mt-4 text-sm text-lum-on-surface-variant hover:text-lum-primary hover:underline"
          >
            ← Back to classes
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold">
            4. Lesson details
          </h2>
          <div className="lum-card space-y-4 p-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-lum-on-background">
                Title
              </label>
              <input
                required
                value={lessonData.title}
                onChange={(e) =>
                  setLessonData({ ...lessonData, title: e.target.value })
                }
                placeholder="e.g. Introduction to motion"
                className="lum-input"
              />
            </div>
            <p className="text-sm text-lum-on-surface-variant">
              Lesson number in this topic/chapter is assigned automatically: the
              first lesson you add is lesson 1, the next is 2, and so on.
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-lum-on-background">
                Video URL (YouTube / Vimeo / direct file)
              </label>
              <input
                required
                value={lessonData.videoUrl}
                onChange={(e) =>
                  setLessonData({ ...lessonData, videoUrl: e.target.value })
                }
                placeholder="https://youtube.com/watch?v=…"
                className="lum-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-lum-on-background">
                Description
              </label>
              <textarea
                rows={3}
                value={lessonData.description}
                onChange={(e) =>
                  setLessonData({ ...lessonData, description: e.target.value })
                }
                placeholder="What will students learn?"
                className="lum-input"
              />
            </div>
            <p className="text-xs leading-relaxed text-lum-on-surface-variant">
              New lessons are{" "}
              <span className="font-semibold text-lum-on-background">
                published to learners automatically
              </span>
              . To hide one later, open Edit and turn off Published.
            </p>
            <div className="space-y-2 border-t border-lum-outline/20 pt-4">
              <label className="text-sm font-semibold text-lum-on-background">
                Attachments (PDF, Word, slides…)
              </label>
              <p className="text-xs text-lum-on-surface-variant">
                Stored in your Supabase Storage bucket{" "}
                <span className="font-mono text-lum-primary">lesson-attachments</span>
                . Optional.
              </p>
              <input
                type="file"
                multiple
                disabled={loading}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.png,.jpg,.jpeg,.webp"
                className="block w-full text-sm text-lum-on-surface-variant file:mr-3 file:rounded-lg file:border-0 file:bg-lum-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-lum-on-primary disabled:opacity-50"
                onChange={(e) => {
                  const list = e.target.files;
                  if (!list?.length) return;
                  setAttachmentFiles((prev) => [...prev, ...Array.from(list)]);
                  e.target.value = "";
                }}
              />
              {attachmentUploadProgress ? (
                <AttachmentUploadProgressBar {...attachmentUploadProgress} />
              ) : null}
              {attachmentFiles.length > 0 ? (
                <ul className="space-y-1 text-sm text-lum-on-surface-variant">
                  {attachmentFiles.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-lum-outline/20 bg-lum-surface-container-low px-3 py-2"
                    >
                      <span className="truncate text-lum-on-background">
                        {f.name}
                      </span>
                      <button
                        type="button"
                        disabled={loading}
                        className="shrink-0 font-semibold text-lum-error hover:underline disabled:opacity-40"
                        onClick={() =>
                          setAttachmentFiles((prev) =>
                            prev.filter((_, j) => j !== i),
                          )
                        }
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="mt-6 flex gap-3 border-t border-lum-outline/20 pt-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={loading}
                className="flex-1 rounded-lg border border-lum-outline/35 bg-transparent py-3 font-semibold text-lum-on-background hover:bg-lum-surface-container-low disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  loading ||
                  !lessonData.title.trim() ||
                  !lessonData.videoUrl.trim()
                }
                className="lum-btn-primary flex-[2] justify-center py-3 disabled:opacity-50"
              >
                {loading
                  ? attachmentUploadProgress
                    ? "Uploading attachments…"
                    : "Saving lesson…"
                  : "Create lesson"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
