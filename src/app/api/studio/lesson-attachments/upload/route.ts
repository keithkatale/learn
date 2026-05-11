import { NextResponse } from "next/server";
import {
  attachmentsBucket,
  effectiveAttachmentMime,
  sanitizeStorageFileName,
  validateAttachmentFile,
  type LessonAttachmentMeta,
} from "@/lib/lesson-attachments";
import { assertStudioCreator } from "@/app/api/studio/_assert-creator";

export async function POST(request: Request) {
  const gate = await assertStudioCreator();
  if ("error" in gate) return gate.error;

  const { admin } = gate;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form data." },
      { status: 400 },
    );
  }

  const lessonId = String(form.get("lessonId") ?? "").trim();
  const file = form.get("file");

  if (!lessonId) {
    return NextResponse.json({ error: "lessonId is required." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "file is required." }, { status: 400 });
  }

  const valErr = validateAttachmentFile(file);
  if (valErr) {
    return NextResponse.json({ error: valErr }, { status: 400 });
  }

  const { data: lesson } = await admin
    .from("Lesson")
    .select("id")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  const bucket = attachmentsBucket();
  const safe = sanitizeStorageFileName(file.name);
  const path = `${lessonId}/${crypto.randomUUID()}_${safe}`;

  const contentType = effectiveAttachmentMime(file) || "application/octet-stream";

  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage.from(bucket).upload(path, buf, {
    cacheControl: "3600",
    upsert: false,
    contentType,
  });

  if (upErr) {
    return NextResponse.json(
      { error: upErr.message || "Storage upload failed." },
      { status: 500 },
    );
  }

  const attachment: LessonAttachmentMeta = {
    path,
    label: file.name,
    mime: contentType,
  };

  return NextResponse.json({ attachment });
}
