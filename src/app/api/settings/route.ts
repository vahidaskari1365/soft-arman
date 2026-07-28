import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const rows = await db.select().from(settings);
  const cfg: Record<string, string> = {};
  for (const s of rows) cfg[s.key] = s.value ?? "";
  return NextResponse.json({
    companyName: cfg.companyName || "",
    tagline: cfg.tagline || "",
    address: cfg.address || "",
    phone: cfg.phone || "",
    logo: cfg.logo || "",
  });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const allowed = ["companyName", "tagline", "address", "phone", "logo"];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      const value = String(body[key]);
      const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
      if (existing[0]) {
        await db.update(settings).set({ value }).where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({ key, value });
      }
    }
  }
  return NextResponse.json({ ok: true });
}
