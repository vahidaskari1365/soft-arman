import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDeviceDetail } from "@/lib/queries";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const device = await getDeviceDetail(Number(id));
  if (!device) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  return NextResponse.json(device);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!["intake_technician", "service_manager", "super_admin"].includes(user.role)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const allowed = ["brand", "model", "problem", "estimatedCost", "accessories", "deviceType"];
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of allowed) if (body[k] !== undefined) patch[k] = body[k];
  await db.update(devices).set(patch).where(eq(devices.id, Number(id)));
  return NextResponse.json({ ok: true });
}
