import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { devices, accountingRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDeviceDetail, logDeviceAction } from "@/lib/queries";
import { notify, notifyRoles } from "@/lib/notify";

/**
 * Cancel (withdraw) repair: can be triggered by repair or intake technicians.
 * Marks device as cancelled, records a log entry and notifies relevant parties.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const deviceId = Number(id);
  const device = await getDeviceDetail(deviceId);
  if (!device) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  // allowed roles: both technicians, managers and admins
  if (!["repair_technician", "intake_technician", "service_manager", "super_admin"].includes(user.role)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const note = body.note || "کاربر انصراف از ادامه تعمیر را ثبت کرد.";

  await db
    .update(devices)
    .set({ status: "cancelled", updatedAt: new Date(), closedDate: new Date() })
    .where(eq(devices.id, deviceId));

  await logDeviceAction(deviceId, user.id, "انصراف از تعمیر", device.status, "cancelled", note);

  // Refund deposit if the customer had paid one
  const deposit = Number(device.deposit || 0) || Number(device.accounting?.deposit || 0);
  if (deposit > 0) {
    await db
      .update(accountingRecords)
      .set({ status: "cancelled", notes: "انصراف از تعمیر — بیعانه به مشتری برگشت داده شد." })
      .where(eq(accountingRecords.deviceId, deviceId));
    await logDeviceAction(deviceId, user.id, "برگشت بیعانه", device.status, "cancelled", `بیعانه ${deposit} تومان به مشتری بازگردانده شد.`);
  }

  // notify only the specific assigned technicians + managers/admin (not the whole role)
  try {
    const msg = {
      type: "repair_cancelled",
      title: "انصراف از تعمیر ثبت شد",
      message: `رسید ${device.ticketNumber} (${device.brand || ""} ${device.model}) توسط ${user.fullName || user.username || "کاربر"} انصراف از تعمیر ثبت شد.`,
      deviceId,
    } as any;

    const notifyPromises: Promise<any>[] = [];
    if (device.intakeTechnicianId) notifyPromises.push(notify(device.intakeTechnicianId, msg));
    if (device.repairTechnicianId) notifyPromises.push(notify(device.repairTechnicianId, msg));
    // always notify service manager and super admin
    notifyPromises.push(notifyRoles(["service_manager", "super_admin"], msg));

    await Promise.allSettled(notifyPromises);
  } catch (e) {
    console.error("notify error:", e);
  }

  return NextResponse.json({ ok: true, status: "cancelled" });
}
