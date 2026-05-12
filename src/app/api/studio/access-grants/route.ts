import { NextResponse } from "next/server";
import { isValidUgE164 } from "@/lib/ug-phone";
import { assertStudioCreator } from "@/app/api/studio/_assert-creator";
import { ensureLearnerUserForPhone } from "@/lib/ensure-learner-user";

async function assertCreator() {
  const gate = await assertStudioCreator();
  if ("error" in gate) return gate;
  return { userId: gate.userId, admin: gate.admin };
}

/** List grants with learner phone + lesson title */
export async function GET() {
  const gate = await assertCreator();
  if ("error" in gate) return gate.error;

  const { admin } = gate;
  const { data: grants, error } = await admin
    .from("LearningAccessGrant")
    .select("id,expiresAt,createdAt,lessonId,userId")
    .order("expiresAt", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[studio/access-grants GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const grantList = grants ?? [];
  const userIds = [...new Set(grantList.map((g: { userId: string }) => g.userId))];
  const lessonIds = [...new Set(grantList.map((g: { lessonId: string }) => g.lessonId))];

  const [{ data: users }, { data: lessons }, { data: enrollRows }] = await Promise.all([
    userIds.length
      ? admin.from("User").select("id,phone").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; phone: string | null }[] }),
    lessonIds.length
      ? admin.from("Lesson").select("id,title").in("id", lessonIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    admin
      .from("Enrollment")
      .select("id,userId,createdAt")
      .order("createdAt", { ascending: false })
      .limit(200),
  ]);

  const phoneByUser = Object.fromEntries(
    (users ?? []).map((u: { id: string; phone: string | null }) => [u.id, u.phone]),
  );
  const titleByLesson = Object.fromEntries(
    (lessons ?? []).map((l: { id: string; title: string }) => [l.id, l.title]),
  );

  const enrollList = enrollRows ?? [];
  const enrollUserIds = [...new Set(enrollList.map((e: { userId: string }) => e.userId))];
  const { data: enrollUsers } =
    enrollUserIds.length > 0
      ? await admin.from("User").select("id,phone").in("id", enrollUserIds)
      : { data: [] as { id: string; phone: string | null }[] };

  const enrollPhoneByUser = Object.fromEntries(
    (enrollUsers ?? []).map((u: { id: string; phone: string | null }) => [u.id, u.phone]),
  );

  return NextResponse.json({
    grants: grantList.map((g: { id: string; expiresAt: string; createdAt: string; lessonId: string; userId: string }) => ({
      ...g,
      phone: phoneByUser[g.userId] ?? null,
      lessonTitle: titleByLesson[g.lessonId] ?? "Lesson",
    })),
    fullAccessUsers: enrollList.map((e: { id: string; userId: string; createdAt: string }) => ({
      ...e,
      phone: enrollPhoneByUser[e.userId] ?? null,
    })),
  });
}

type PostBody = {
  phone?: string;
  fullPlatformAccess?: boolean;
  lessonIds?: string[];
  expiresAt?: string;
};

export async function POST(request: Request) {
  const gate = await assertCreator();
  if ("error" in gate) return gate.error;

  const { admin } = gate;
  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phone = String(body.phone ?? "").trim();
  if (!isValidUgE164(phone)) {
    return NextResponse.json(
      { error: "Enter a valid Ugandan phone (+256 + 9 digits)." },
      { status: 400 },
    );
  }

  const ensured = await ensureLearnerUserForPhone(admin, phone);
  if ("error" in ensured) {
    return NextResponse.json({ error: ensured.error }, { status: 400 });
  }
  const userId = ensured.userId;
  const fullPlatform = body.fullPlatformAccess === true;
  const lessonIds = Array.isArray(body.lessonIds)
    ? [...new Set(body.lessonIds.filter((id) => typeof id === "string" && id.length > 0))]
    : [];

  let expiresAt = body.expiresAt?.trim();
  if (!expiresAt) {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    expiresAt = d.toISOString();
  }
  const expMs = Date.parse(expiresAt);
  if (Number.isNaN(expMs) || expMs <= Date.now()) {
    return NextResponse.json(
      { error: "expiresAt must be a future date." },
      { status: 400 },
    );
  }

  if (fullPlatform) {
    await admin.from("LearningAccessGrant").delete().eq("userId", userId);

    const { data: existingEnroll } = await admin
      .from("Enrollment")
      .select("id")
      .eq("userId", userId)
      .maybeSingle();

    if (!existingEnroll) {
      const { error: enErr } = await admin.from("Enrollment").insert({
        id: crypto.randomUUID(),
        userId,
      });
      if (enErr) {
        console.error("[studio/access-grants POST enrollment]", enErr);
        return NextResponse.json({ error: enErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, mode: "full_platform" });
  }

  await admin.from("Enrollment").delete().eq("userId", userId);

  if (lessonIds.length === 0) {
    await admin.from("LearningAccessGrant").delete().eq("userId", userId);
    return NextResponse.json({ ok: true, mode: "cleared" });
  }

  const { data: validLessons } = await admin
    .from("Lesson")
    .select("id")
    .in("id", lessonIds)
    .eq("published", true);

  const allowed = new Set(
    (validLessons ?? []).map((r: { id: string }) => r.id),
  );
  const toUpsert = lessonIds.filter((id) => allowed.has(id));

  await admin.from("LearningAccessGrant").delete().eq("userId", userId);

  const rows = toUpsert.map((lessonId) => ({
    userId,
    lessonId,
    expiresAt,
  }));

  const { error: insErr } = await admin.from("LearningAccessGrant").insert(rows);
  if (insErr) {
    console.error("[studio/access-grants POST grants]", insErr);
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    mode: "lessons",
    grantedCount: toUpsert.length,
  });
}

export async function DELETE(request: Request) {
  const gate = await assertCreator();
  if ("error" in gate) return gate.error;

  const { admin } = gate;
  const { searchParams } = new URL(request.url);
  const grantId = searchParams.get("grantId");
  const userId = searchParams.get("userId");

  if (grantId) {
    await admin.from("LearningAccessGrant").delete().eq("id", grantId);
    return NextResponse.json({ ok: true });
  }

  if (userId) {
    await admin.from("Enrollment").delete().eq("userId", userId);
    await admin.from("LearningAccessGrant").delete().eq("userId", userId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "grantId or userId required" }, { status: 400 });
}
