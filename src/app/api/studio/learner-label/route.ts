import { NextResponse } from "next/server";
import { assertStudioCreator } from "@/app/api/studio/_assert-creator";

type Body = { userId?: string; instructorLabel?: string | null };

export async function PATCH(request: Request) {
  const gate = await assertStudioCreator();
  if ("error" in gate) return gate.error;

  const { admin } = gate;
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = String(body.userId ?? "").trim();
  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const raw = body.instructorLabel;
  const label =
    typeof raw === "string" ? raw.trim().slice(0, 120) : raw === null ? "" : "";

  const { data: target, error: tErr } = await admin
    .from("User")
    .select("id,phone,role")
    .eq("id", userId)
    .maybeSingle();

  if (tErr || !target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (target.role === "CREATOR") {
    return NextResponse.json(
      { error: "Cannot set a label on creator accounts." },
      { status: 400 },
    );
  }

  if (!target.phone) {
    return NextResponse.json(
      { error: "Only phone-based learner rows can be labeled here." },
      { status: 400 },
    );
  }

  const { error: uErr } = await admin
    .from("User")
    .update({ instructorLabel: label.length > 0 ? label : null })
    .eq("id", userId);

  if (uErr) {
    console.error("[studio/learner-label]", uErr);
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
