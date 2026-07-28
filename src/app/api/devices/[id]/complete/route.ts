import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDeviceDetail } from "@/lib/queries";
import { notify } from "@/lib/notify";

/** Repair technician completes the repair -> sends back to intake technician. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const deviceId = Number(id);
  const device = await getDeviceDetail(deviceId);
  if (!device) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  if (user.role !== "repair_technician" && user.role !== "super_admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  await db
    .update(devices)
    .set({
      status: "repair_done",
      operationsDone: body.operationsDone || null,
      repairNotes: body.repairNotes || null,
      finalCost: String(body.finalCost ?? device.estimatedCost ?? 0),
      updatedAt: new Date(),
    })
    .where(eq(devices.id, deviceId));

  if (device.intakeTechnicianId) {
    await notify(device.intakeTechnicianId, {
      type: "repair_done",
      title: "تعمیر دستگاه تکمیل شد",
      message: `رسید ${device.ticketNumber} (${device.brand || ""} ${device.model}) آماده تحویل به مشتری است. لطفاً با مشتری تماس بگیرید.`,
      deviceId,
    });
  }

  return NextResponse.json({ ok: true, status: "repair_done" });
}
