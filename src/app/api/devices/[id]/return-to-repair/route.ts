import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDeviceDetail, logDeviceAction } from "@/lib/queries";
import { notify } from "@/lib/notify";
import { notifyRoles } from "@/lib/notify";

/** Intake technician can return the device back to repair technician. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const deviceId = Number(id);
  const device = await getDeviceDetail(deviceId);
  if (!device) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  // only intake technician, service manager or super admin can perform this
  if (!["intake_technician", "service_manager", "super_admin"].includes(user.role)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const note = body.note || "ارجاع دستگاه به کارشناس تعمیر برای ادامه فرآیند.";

  // update device status back to in_progress (sent to repair)
  await db.update(devices).set({ status: "in_progress", updatedAt: new Date() }).where(eq(devices.id, deviceId));

  await logDeviceAction(deviceId, user.id, "ارجاع به تعمیرگاه", device.status, "in_progress", note);

  // notify repair technician if assigned, otherwise notify repair role
  try {
    if (device.repairTechnicianId) {
      await notify(device.repairTechnicianId, {
        type: "returned_to_repair",
        title: "دستگاه بازگشت به تعمیر",
        message: `رسید ${device.ticketNumber} (${device.brand || ""} ${device.model}) توسط پذیرش به تعمیر بازگشت.`,
        deviceId,
      });
    } else {
      await notifyRoles(["repair_technician", "service_manager", "super_admin"], {
        type: "returned_to_repair",
        title: "دستگاه بازگشت به تعمیر",
        message: `رسید ${device.ticketNumber} (${device.brand || ""} ${device.model}) توسط پذیرش به تعمیر بازگشت.`,
        deviceId,
      });
    }
  } catch (e) {
    console.error("notify error:", e);
  }

  return NextResponse.json({ ok: true, status: "in_progress" });
}
