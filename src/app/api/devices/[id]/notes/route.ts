import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deviceNotes, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { addDeviceNote } from "@/lib/queries";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const rows = await db
    .select({
      id: deviceNotes.id,
      note: deviceNotes.note,
      createdAt: deviceNotes.createdAt,
      userName: sql<string | null>`u.full_name`,
      userRole: sql<string | null>`u.role`,
    })
    .from(deviceNotes)
    .leftJoin(sql`${users} as u`, sql`u.id = ${deviceNotes.userId}`)
    .where(eq(deviceNotes.deviceId, Number(id)))
    .orderBy(desc(deviceNotes.createdAt));

  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const note = body.note ? String(body.note).trim() : "";

  if (!note) {
    return NextResponse.json({ error: "متن یادداشت خالی است" }, { status: 400 });
  }

  await addDeviceNote(Number(id), user.id, note);
  return NextResponse.json({ ok: true });
}
