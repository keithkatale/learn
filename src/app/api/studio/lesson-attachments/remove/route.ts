import { NextResponse } from "next/server";
import { attachmentsBucket } from "@/lib/lesson-attachments";
import { assertStudioCreator } from "@/app/api/studio/_assert-creator";

export async function POST(request: Request) {
  const gate = await assertStudioCreator();
  if ("error" in gate) return gate.error;

  const { admin } = gate;

  let body: { path?: string };
  try {
    body = (await request.json()) as { path?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const storagePath = String(body.path ?? "").trim();
  if (!storagePath || storagePath.includes("..") || storagePath.includes("\\")) {
    return NextResponse.json({ error: "Invalid path." }, { status: 400 });
  }

  const bucket = attachmentsBucket();
  const { error } = await admin.storage.from(bucket).remove([storagePath]);
  if (error) {
    return NextResponse.json(
      { error: error.message || "Storage delete failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
