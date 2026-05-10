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
  if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(file.type)) {
    return `File type not allowed: ${file.type || "unknown"}`;
  }
  if (file.size > maxAttachmentBytes()) {
    return `File too large (max ${Math.round(maxAttachmentBytes() / 1024 / 1024)} MB).`;
  }
  return null;
}

export async function uploadLessonAttachments(
  supabase: SupabaseClient,
  lessonId: string,
  files: File[],
): Promise<{ attachments: LessonAttachmentMeta[]; error?: string }> {
  const bucket = attachmentsBucket();
  const uploaded: LessonAttachmentMeta[] = [];

  for (const file of files) {
    const err = validateAttachmentFile(file);
    if (err) return { attachments: uploaded, error: err };

    const safe = sanitizeStorageFileName(file.name);
    const path = `${lessonId}/${crypto.randomUUID()}_${safe}`;

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (upErr) {
      return {
        attachments: uploaded,
        error: upErr.message,
      };
    }

    uploaded.push({
      path,
      label: file.name,
      mime: file.type || undefined,
    });
  }

  return { attachments: uploaded };
}

export async function removeAttachmentObject(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<{ error?: string }> {
  const bucket = attachmentsBucket();
  const { error } = await supabase.storage.from(bucket).remove([storagePath]);
  return { error: error?.message };
}
