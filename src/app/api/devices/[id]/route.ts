import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { devices, deviceLogs, deviceNotes, partRequests, accountingRecords, notifications } from "@/db/schema";
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
  const allowed = [
    "brand",
    "model",
    "problem",
    "estimatedCost",
    "accessories",
    "deviceType",
    "serialNumber",
    "devicePassword",
    "warrantyStatus",
    "warrantyDays",
    "deadlineDate",
    "deposit",
  ];
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of allowed) {
    if (body[k] !== undefined) {
      if (k === "deadlineDate") {
        patch[k] = body[k] ? new Date(String(body[k])) : null;
      } else if (k === "warrantyDays") {
        patch[k] = Number(body[k]) || 0;
      } else {
        patch[k] = body[k];
      }
    }
  }
  await db.update(devices).set(patch).where(eq(devices.id, Number(id)));
  return NextResponse.json({ ok: true });
}

/**
 * Permanently delete a device and ALL of its related records.
 * Restricted to super_admin only. Records are removed in dependency order to
 * satisfy foreign-key constraints, then the device itself is deleted.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (user.role !== "super_admin") {
    return NextResponse.json({ error: "حذف دستگاه تنها توسط مدیر کل (super_admin) امکان‌پذیر است" }, { status: 403 });
  }
  const { id } = await params;
  const deviceId = Number(id);
  if (!Number.isFinite(deviceId)) {
    return NextResponse.json({ error: "شناسه نامعتبر" }, { status: 400 });
  }

  // Snapshot ticket number / label (also confirms the device exists).
  const snapshot = await db
    .select({ ticketNumber: devices.ticketNumber, brand: devices.brand, model: devices.model })
    .from(devices)
    .where(eq(devices.id, deviceId))
    .limit(1);
  if (!snapshot[0]) {
    return NextResponse.json({ error: "دستگاه یافت نشد" }, { status: 404 });
  }

  // Delete related rows first (order matters for foreign keys).
  await db.delete(notifications).where(eq(notifications.deviceId, deviceId));
  await db.delete(deviceLogs).where(eq(deviceLogs.deviceId, deviceId));
  await db.delete(deviceNotes).where(eq(deviceNotes.deviceId, deviceId));
  await db.delete(partRequests).where(eq(partRequests.deviceId, deviceId));
  await db.delete(accountingRecords).where(eq(accountingRecords.deviceId, deviceId));

  // Finally remove the device.
  await db.delete(devices).where(eq(devices.id, deviceId));

  return NextResponse.json({
    ok: true,
    ticketNumber: snapshot[0]?.ticketNumber ?? null,
    label: [snapshot[0]?.brand, snapshot[0]?.model].filter(Boolean).join(" ").trim(),
  });
}
