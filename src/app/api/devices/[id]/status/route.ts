import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { devices, deviceLogs, users, customers } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

/** Public device status + timeline for the customer tracker (/track). No auth required. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const query = String(id ?? "").trim();
  if (!query) {
    return NextResponse.json({ error: "شماره سریال نامعتبر" }, { status: 400 });
  }

  // lookup by serial number (preferred), fallback to numeric device id
  const numericId = /^\d+$/.test(query) ? Number(query) : null;
  let match = await db
    .select({ id: devices.id })
    .from(devices)
    .where(eq(devices.serialNumber, query))
    .limit(1);
  if (!match[0] && numericId !== null) {
    match = await db.select({ id: devices.id }).from(devices).where(eq(devices.id, numericId)).limit(1);
  }
  if (!match[0]) return NextResponse.json({ error: "دستگاه یافت نشد" }, { status: 404 });
  const deviceId = match[0].id;

  const rows = await db
    .select({
      id: devices.id,
      ticketNumber: devices.ticketNumber,
      brand: devices.brand,
      model: devices.model,
      deviceType: devices.deviceType,
      serialNumber: devices.serialNumber,
      status: devices.status,
      customerName: customers.name,
      intakeDate: devices.intakeDate,
      deliveryDate: devices.deliveryDate,
      closedDate: devices.closedDate,
      updatedAt: devices.updatedAt,
    })
    .from(devices)
    .leftJoin(customers, eq(devices.customerId, customers.id))
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
