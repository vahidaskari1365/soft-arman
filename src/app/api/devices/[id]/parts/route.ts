import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { devices, partRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDeviceDetail, logDeviceAction } from "@/lib/queries";
import { notifyRoles, getServiceManagers } from "@/lib/notify";

/** Repair technician requests a part (or marks no parts needed). */
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
  const { needsParts, partName, partModel, partPrice, supplier, notes, inventoryItemId } = body as any;

  if (needsParts) {
    if (!partName) return NextResponse.json({ error: "نام قطعه الزامی است" }, { status: 400 });
    await db.insert(partRequests).values({
      deviceId,
      partName,
      partModel: partModel || null,
      partPrice: String(partPrice || 0),
      supplier: supplier || null,
      notes: notes || null,
      inventoryItemId: inventoryItemId ? Number(inventoryItemId) : null,
      status: "pending",
      requestedById: user.id,
    });
    await db
      .update(devices)
      .set({ needsParts: true, status: "awaiting_parts", updatedAt: new Date() })
      .where(eq(devices.id, deviceId));

    await logDeviceAction(deviceId, user.id, "درخواست قطعه", device.status, "awaiting_parts", `درخواست قطعه «${partName}» ثبت شد.`);

    const managers = await getServiceManagers();
    await notifyRoles(["service_manager", "super_admin", "accountant"], {
      type: "parts_request",
      title: "درخواست تایید خرید قطعه",
      message: `برای رسید ${device.ticketNumber} (${device.brand || ""} ${device.model}) قطعه «${partName}» با قیمت ${partPrice || 0} نیاز است.`,
      deviceId,
    });

    return NextResponse.json({ ok: true, status: "awaiting_parts" });
  } else {
    // no parts needed -> straight to in progress
    await db
      .update(devices)
      .set({ needsParts: false, status: "in_progress", updatedAt: new Date() })
      .where(eq(devices.id, deviceId));
    await logDeviceAction(deviceId, user.id, "شروع تعمیر", device.status, "in_progress", "تعمیر بدون نیاز به قطعه آغاز شد.");
    return NextResponse.json({ ok: true, status: "in_progress" });
  }
}
