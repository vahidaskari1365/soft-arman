import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export async function POST() {
  const user = await requireUser();
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, user.id));
  return NextResponse.json({ ok: true });
}
