import { NextResponse } from "next/server";
import { assertStudioCreator } from "@/app/api/studio/_assert-creator";

/**
 * Distinct learners with any access: full catalog (Enrollment) and/or
 * per-lesson grants (LearningAccessGrant). Uses service role so counts are
 * not blocked by table RLS for the browser client.
 */
export async function GET() {
  const gate = await assertStudioCreator();
  if ("error" in gate) return gate.error;

  const { admin } = gate;
  const [{ data: enrollRows, error: eErr }, { data: grantRows, error: gErr }] =
    await Promise.all([
      admin.from("Enrollment").select("userId"),
      admin.from("LearningAccessGrant").select("userId"),
    ]);

  if (eErr || gErr) {
    console.error("[studio/dashboard-stats]", eErr ?? gErr);
    return NextResponse.json(
      { error: "Could not load learner stats." },
      { status: 500 },
    );
  }

  const ids = new Set<string>();
  for (const r of enrollRows ?? []) {
    const id = (r as { userId: string }).userId;
    if (id) ids.add(id);
  }
  for (const r of grantRows ?? []) {
    const id = (r as { userId: string }).userId;
    if (id) ids.add(id);
  }

  return NextResponse.json({ learnersWithAccess: ids.size });
}
