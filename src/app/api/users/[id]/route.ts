import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireRole, hashPassword } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("super_admin");
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (body.fullName) patch.fullName = body.fullName;
  if (body.role) patch.role = body.role;
  if (body.phone !== undefined) patch.phone = body.phone;
  if (body.active !== undefined) patch.active = body.active;
  if (body.password) patch.passwordHash = await hashPassword(body.password);
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "بدون تغییر" }, { status: 400 });
  await db.update(users).set(patch).where(eq(users.id, Number(id)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireRole("super_admin");
  const { id } = await params;
  if (Number(id) === me.id) return NextResponse.json({ error: "نمی‌توانید حساب خود را حذف کنید" }, { status: 400 });
  await db.delete(users).where(eq(users.id, Number(id)));
  return NextResponse.json({ ok: true });
}
