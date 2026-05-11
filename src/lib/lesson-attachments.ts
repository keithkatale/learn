import type { SupabaseClient } from "@supabase/supabase-js";

export function attachmentsBucket(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET ?? "lesson-attachments"
  );
}

export type LessonAttachmentMeta = {
  path: string;
  label: string;
  mime?: string;
};

export const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const EXT_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xls": "application/vnd.ms-excel",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

/** Browsers often leave `File.type` empty; infer from extension for validation & upload. */
export function inferMimeFromFileName(name: string): string | null {
  const lower = name.toLowerCase().trim();
  const dot = lower.lastIndexOf(".");
  if (dot < 0) return null;
  const ext = lower.slice(dot);
  return EXT_TO_MIME[ext] ?? null;
}

export function effectiveAttachmentMime(file: File): string {
  const t = (file.type || "").trim();
  if (t) return t;
  return inferMimeFromFileName(file.name) ?? "";
}

export function maxAttachmentBytes(): number {
  const mb = Number(process.env.NEXT_PUBLIC_MAX_ATTACHMENT_MB ?? "25");
  return (Number.isFinite(mb) ? mb : 25) * 1024 * 1024;
}

export function parseAttachments(raw: unknown): LessonAttachmentMeta[] {
  if (!raw || !Array.isArray(raw)) return [];
  const out: LessonAttachmentMeta[] = [];
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      "path" in item &&
      "label" in item &&
      typeof (item as LessonAttachmentMeta).path === "string" &&
      typeof (item as LessonAttachmentMeta).label === "string"
    ) {
      const mime =
        "mime" in item && typeof (item as { mime?: string }).mime === "string"
          ? (item as { mime: string }).mime
          : undefined;
      out.push({
        path: (item as LessonAttachmentMeta).path,
        label: (item as LessonAttachmentMeta).label,
        mime,
      });
    }
  }
  return out;
}

export function sanitizeStorageFileName(name: string): string {
  const base = name.replace(/[^\w.\-()+]/g, "_").replace(/_+/g, "_");
  return base.slice(0, 180) || "file";
}

export function validateAttachmentFile(file: File): string | null {
  const mime = effectiveAttachmentMime(file);
  if (!mime || !ALLOWED_ATTACHMENT_MIME_TYPES.has(mime)) {
    return `File type not allowed (${mime || "unknown"}). Use PDF, Word, PowerPoint, Excel, text, markdown, or common images.`;
  }
  if (file.size > maxAttachmentBytes()) {
    return `File too large (max ${Math.round(maxAttachmentBytes() / 1024 / 1024)} MB).`;
  }
  return null;
}

/** Fired before each file upload starts (`completed` = already finished count). */
export type LessonAttachmentUploadProgress = {
  completed: number;
  total: number;
  /** File currently being sent to the server */
  activeFile: string | null;
};

/**
 * Uploads via server API (service role) so Storage RLS does not block creators
 * who only match NEXT_PUBLIC_CREATOR_EMAIL, and so MIME is handled consistently.
 */
export async function uploadLessonAttachments(
  _supabase: SupabaseClient,
  lessonId: string,
  files: File[],
  onProgress?: (p: LessonAttachmentUploadProgress) => void,
): Promise<{ attachments: LessonAttachmentMeta[]; error?: string }> {
  const uploaded: LessonAttachmentMeta[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const err = validateAttachmentFile(file);
    if (err) return { attachments: uploaded, error: err };

    onProgress?.({
      completed: i,
      total: files.length,
      activeFile: file.name,
    });

    const fd = new FormData();
    fd.set("lessonId", lessonId);
    fd.set("file", file);

    const res = await fetch("/api/studio/lesson-attachments/upload", {
      method: "POST",
      body: fd,
      credentials: "include",
    });

    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      attachment?: LessonAttachmentMeta;
    };

    if (!res.ok) {
      return {
        attachments: uploaded,
        error:
          typeof json.error === "string"
            ? json.error
            : `Upload failed (${res.status}).`,
      };
    }

    if (!json.attachment?.path) {
      return {
        attachments: uploaded,
        error: "Upload response missing attachment metadata.",
      };
    }

    uploaded.push(json.attachment);
  }

  onProgress?.({
    completed: files.length,
    total: files.length,
    activeFile: null,
  });

  return { attachments: uploaded };
}

export async function removeAttachmentObject(
  _supabase: SupabaseClient,
  storagePath: string,
): Promise<{ error?: string }> {
  const res = await fetch("/api/studio/lesson-attachments/remove", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ path: storagePath }),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    return {
      error:
        typeof json.error === "string"
          ? json.error
          : `Remove failed (${res.status}).`,
    };
  }
  return {};
}
