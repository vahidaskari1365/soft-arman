import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, setSessionCookie, ensureSuperAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await ensureSuperAdmin();
  const body = await req.json().catch(() => ({}));
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");

  if (!username || !password) {
    return NextResponse.json({ error: "نام کاربری و رمز عبور الزامی است" }, { status: 400 });
  }

  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const user = rows[0];
  if (!user || !user.active) {
    return NextResponse.json({ error: "کاربر یافت نشد یا غیرفعال است" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "رمز عبور نادرست است" }, { status: 401 });
  }

  await setSessionCookie({ userId: user.id, role: user.role, username: user.username });
  return NextResponse.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
  });
}
