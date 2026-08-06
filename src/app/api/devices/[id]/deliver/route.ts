import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { devices, accountingRecords, partRequests } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDeviceDetail, logDeviceAction } from "@/lib/queries";
import { notifyRoles } from "@/lib/notify";

/** Intake technician delivers the device to the customer -> creates accounting record. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const deviceId = Number(id);
  const device = await getDeviceDetail(deviceId);
  if (!device) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  if (!["intake_technician", "service_manager", "super_admin"].includes(user.role)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const receivedAmount = Number(body.receivedAmount ?? device.finalCost ?? device.estimatedCost ?? 0);

  // total approved parts cost
  const parts = await db
    .select({ price: partRequests.partPrice })
    .from(partRequests)
    .where(eq(partRequests.deviceId, deviceId));
  const partCost = parts.reduce((s, p) => s + Number(p.price || 0), 0);
  const profit = receivedAmount - partCost;

  await db
    .update(devices)
    .set({
      status: "delivered",
      deliveryDate: new Date(),
      // don't overwrite the repair technician's final cost with the collected amount
      ...(Number(device.finalCost) > 0 ? {} : { finalCost: String(receivedAmount) }),
      updatedAt: new Date(),
    })
    .where(eq(devices.id, deviceId));

  await logDeviceAction(deviceId, user.id, "تحویل به مشتری", device.status, "delivered", "دستگاه به مشتری تحویل داده شد.");

  // upsert accounting record
  const existing = await db.select().from(accountingRecords).where(eq(accountingRecords.deviceId, deviceId)).limit(1);
  const laborCost = Number(body.laborCost ?? Math.max(0, receivedAmount - partCost));
  const discount = Number(body.discount ?? 0);
  const tax = Number(body.tax ?? 0);
  const deposit = Number(body.deposit ?? (existing[0]?.deposit || device.deposit || 0));
  const finalPayable = Math.max(0, receivedAmount - deposit);
  const paymentMethod = String(body.paymentMethod || "cash");

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
        receivedAmount: String(receivedAmount),
        profit: String(profit),
        status: "pending",
        recordedById: user.id,
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
      receivedAmount: String(receivedAmount),
      profit: String(profit),
      status: "pending",
      recordedById: user.id,
    });
  }

  await notifyRoles(["accountant", "super_admin"], {
    type: "accounting",
    title: "گزارش تحویل برای حسابداری",
    message: `دستگاه ${device.brand || ""} ${device.model} با رسید ${device.ticketNumber} تحویل شد. مبلغ دریافتی ${receivedAmount} — هزینه قطعه ${partCost} — سود ${profit}.`,
    deviceId,
  });

  return NextResponse.json({ ok: true, status: "delivered", partCost, receivedAmount, profit });
}
