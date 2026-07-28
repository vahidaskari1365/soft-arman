import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireRole, hashPassword } from "@/lib/auth";

export async function GET() {
  await requireRole("super_admin");
  const items = await db
    .select({ id: users.id, username: users.username, fullName: users.fullName, role: users.role, phone: users.phone, active: users.active, createdAt: users.createdAt })
    .from(users)
    .orderBy(users.createdAt);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  await requireRole("super_admin");
  const body = await req.json().catch(() => ({}));
  const { username, password, fullName, role, phone } = body as any;
  if (!username || !password || !fullName || !role) {
    return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
  }
  const validRoles = ["service_manager", "repair_technician", "intake_technician", "accountant", "super_admin"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "نقش نامعتبر" }, { status: 400 });
  }
  const dup = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (dup[0]) return NextResponse.json({ error: "این نام کاربری قبلاً ثبت شده" }, { status: 400 });

  const hash = await hashPassword(password);
  await db.insert(users).values({ username, passwordHash: hash, fullName, role, phone: phone || null, active: true });
  return NextResponse.json({ ok: true });
}
