import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/db/schema";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  const settingRows = await db.select().from(settings);
  const cfg: Record<string, string> = {};
  for (const s of settingRows) cfg[s.key] = s.value ?? "";

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      roleLabel: ROLE_LABELS[user.role] ?? user.role,
    },
    settings: {
      companyName: cfg.companyName || "مرکز خدمات پس از فروش",
      logo: cfg.logo || "",
      tagline: cfg.tagline || "سامانه مدیریت تعمیرات و قطعات",
      address: cfg.address || "",
      phone: cfg.phone || "",
    },
  });
}
