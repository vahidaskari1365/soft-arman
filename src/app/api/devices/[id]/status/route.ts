import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { devices, deviceLogs, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

/** Lightweight public-ish status + timeline used by the DeviceTracker (/track). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const deviceId = Number(id);
  if (!Number.isFinite(deviceId)) {
    return NextResponse.json({ error: "شناسه نامعتبر" }, { status: 400 });
  }

  const rows = await db
    .select({
      id: devices.id,
      ticketNumber: devices.ticketNumber,
      brand: devices.brand,
      model: devices.model,
      deviceType: devices.deviceType,
      status: devices.status,
      intakeDate: devices.intakeDate,
      deliveryDate: devices.deliveryDate,
      closedDate: devices.closedDate,
      updatedAt: devices.updatedAt,
    })
    .from(devices)
    .where(eq(devices.id, deviceId))
    .limit(1);

  const device = rows[0];
  if (!device) return NextResponse.json({ error: "دستگاه یافت نشد" }, { status: 404 });

  const timeline = await db
    .select({
      action: deviceLogs.action,
      note: deviceLogs.note,
      toStatus: deviceLogs.toStatus,
      createdAt: deviceLogs.createdAt,
      userName: sql<string | null>`u.full_name`,
    })
    .from(deviceLogs)
    .leftJoin(sql`${users} as u`, sql`u.id = ${deviceLogs.userId}`)
    .where(eq(deviceLogs.deviceId, deviceId))
    .orderBy(desc(deviceLogs.createdAt));

  return NextResponse.json({ ...device, timeline });
}
