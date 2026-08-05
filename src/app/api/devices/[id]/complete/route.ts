import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDeviceDetail, logDeviceAction } from "@/lib/queries";
import { notify } from "@/lib/notify";
import { notifyRoles } from "@/lib/notify";

function normalizeNumberString(v: any): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  let s = String(v);
  // remove common thousands separators and spaces
  s = s.replace(/[\s,٬]/g, "");
  // map Arabic-Indic and Extended Arabic-Indic digits to ASCII
  const map: Record<string, string> = {
    '\u06F0': '0','\u06F1':'1','\u06F2':'2','\u06F3':'3','\u06F4':'4','\u06F5':'5','\u06F6':'6','\u06F7':'7','\u06F8':'8','\u06F9':'9',
    '\u0660':'0','\u0661':'1','\u0662':'2','\u0663':'3','\u0664':'4','\u0665':'5','\u0666':'6','\u0667':'7','\u0668':'8','\u0669':'9',
  };
  s = s.replace(/[\u06F0-\u06F9\u0660-\u0669]/g, (ch) => map[ch] ?? ch);
  // keep digits and dot and minus
  s = s.replace(/[^0-9.\-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

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

  const finalCostNum = normalizeNumberString(body.finalCost ?? device.estimatedCost ?? 0);
  const operationsDone = body.operationsDone || null;
  const repairNotes = body.repairNotes || null;

  await db
    .update(devices)
    .set({
      status: "repair_done",
      operationsDone,
      repairNotes,
      finalCost: String(Math.round(finalCostNum)),
      updatedAt: new Date(),
    })
    .where(eq(devices.id, deviceId));

  await logDeviceAction(
    deviceId,
    user.id,
    "اتمام تعمیر",
    device.status,
    "repair_done",
    operationsDone || "تعمیر دستگاه توسط کارشناس تکمیل شد."
  );

  const notifyPayload = {
    type: "repair_done",
    title: "تعمیر دستگاه تکمیل شد",
    message: `رسید ${device.ticketNumber} (${device.brand || ""} ${device.model}) آماده تحویل به مشتری است. لطفاً با مشتری تماس بگیرید.`,
    deviceId,
  };

  try {
    if (device.intakeTechnicianId) {
      await notify(device.intakeTechnicianId, notifyPayload);
    } else {
      await notifyRoles(["intake_technician", "service_manager", "super_admin"], notifyPayload);
    }
  } catch (e) {
    console.error("notify error:", e);
  }

  return NextResponse.json({ ok: true, status: "repair_done" });
}
