import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { devices, accountingRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDeviceDetail } from "@/lib/queries";

/** Accountant settles the record -> closes the device. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!["accountant", "super_admin"].includes(user.role)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }
  const { id } = await params;
  const deviceId = Number(id);
  const device = await getDeviceDetail(deviceId);
  if (!device) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const receivedAmount = Number(body.receivedAmount ?? (device.accounting?.receivedAmount ?? 0));
  const partCost = Number(body.partCost ?? (device.accounting?.partCost ?? 0));
  const profit = receivedAmount - partCost;

  const existing = await db.select().from(accountingRecords).where(eq(accountingRecords.deviceId, deviceId)).limit(1);
  if (existing[0]) {
    await db
      .update(accountingRecords)
      .set({
        partCost: String(partCost),
        receivedAmount: String(receivedAmount),
        profit: String(profit),
        status: "settled",
        settledAt: new Date(),
      })
      .where(eq(accountingRecords.deviceId, deviceId));
  } else {
    await db.insert(accountingRecords).values({
      deviceId,
      partCost: String(partCost),
      receivedAmount: String(receivedAmount),
      profit: String(profit),
      status: "settled",
      recordedById: user.id,
      settledAt: new Date(),
    });
  }

  await db.update(devices).set({ status: "closed", closedDate: new Date(), updatedAt: new Date() }).where(eq(devices.id, deviceId));

  return NextResponse.json({ ok: true, status: "closed" });
}
