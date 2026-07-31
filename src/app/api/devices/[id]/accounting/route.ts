import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { devices, accountingRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDeviceDetail, logDeviceAction } from "@/lib/queries";

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
  const laborCost = Number(body.laborCost ?? (device.accounting?.laborCost ?? Math.max(0, receivedAmount - partCost)));
  const discount = Number(body.discount ?? (device.accounting?.discount ?? 0));
  const tax = Number(body.tax ?? (device.accounting?.tax ?? 0));
  const deposit = Number(body.deposit ?? (device.accounting?.deposit ?? device.deposit ?? 0));
  const finalPayable = Math.max(0, receivedAmount - deposit);
  const paymentMethod = String(body.paymentMethod || device.accounting?.paymentMethod || "cash");
  const notes = body.notes ? String(body.notes) : device.accounting?.notes || null;
  const profit = receivedAmount - partCost;

  const existing = await db.select().from(accountingRecords).where(eq(accountingRecords.deviceId, deviceId)).limit(1);
  if (existing[0]) {
    await db
      .update(accountingRecords)
      .set({
        partCost: String(partCost),
        laborCost: String(laborCost),
        discount: String(discount),
        tax: String(tax),
        deposit: String(deposit),
        paymentMethod,
        finalPayable: String(finalPayable),
        notes,
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
      laborCost: String(laborCost),
      discount: String(discount),
      tax: String(tax),
      deposit: String(deposit),
      paymentMethod,
      finalPayable: String(finalPayable),
      notes,
      receivedAmount: String(receivedAmount),
      profit: String(profit),
      status: "settled",
      recordedById: user.id,
      settledAt: new Date(),
    });
  }

  await db.update(devices).set({ status: "closed", closedDate: new Date(), updatedAt: new Date() }).where(eq(devices.id, deviceId));
  await logDeviceAction(deviceId, user.id, "تسویه حسابداری", device.status, "closed", "تسویه نهایی حسابداری و بستن دستگاه انجام شد.");

  return NextResponse.json({ ok: true, status: "closed" });
}
