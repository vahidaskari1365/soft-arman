import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { partRequests, devices, inventoryItems, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { notify, notifyRoles } from "@/lib/notify";
import { logDeviceAction } from "@/lib/queries";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!["service_manager", "super_admin", "accountant"].includes(user.role)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action as "approve" | "reject";
  const reason = body.reason ? String(body.reason).trim() : "";

  const rows = await db.select().from(partRequests).where(eq(partRequests.id, Number(id))).limit(1);
  const pr = rows[0];
  if (!pr) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  if (action === "approve") {
    await db
      .update(partRequests)
      .set({ status: "approved", approvedById: user.id, approvedAt: new Date() })
      .where(eq(partRequests.id, pr.id));
    await db
      .update(devices)
      .set({ status: "parts_approved", updatedAt: new Date() })
      .where(eq(devices.id, pr.deviceId));

    if (pr.inventoryItemId) {
      await db
        .update(inventoryItems)
        .set({
          currentStock: sql`GREATEST(0, ${inventoryItems.currentStock} - 1)`,
          updatedAt: new Date(),
        })
        .where(eq(inventoryItems.id, pr.inventoryItemId));
    }

    const approverRole = user.role === "accountant" ? "کارشناس حسابداری" : user.role === "service_manager" ? "مدیر خدمات" : "مدیر کل";

    await logDeviceAction(
      pr.deviceId,
      user.id,
      "تایید قطعه",
      "awaiting_parts",
      "parts_approved",
      `درخواست قطعه «${pr.partName}» توسط ${approverRole} تایید شد.`
    );

    // Get the device info for notification
    const deviceRows = await db.select().from(devices).where(eq(devices.id, pr.deviceId)).limit(1);
    const device = deviceRows[0];
    const deviceLabel = device ? `${device.ticketNumber} (${device.brand || ""} ${device.model || ""})`.trim() : `دستگاه شماره ${pr.deviceId}`;

    // If the approver is accountant, notify repair_technician
    if (user.role === "accountant") {
      // Find the assigned repair technician
      if (device?.repairTechnicianId) {
        await notify(device.repairTechnicianId, {
          type: "parts_approved_by_accountant",
          title: "تایید خرید قطعه توسط حسابداری",
          message: `درخواست خرید قطعه «${pr.partName}» برای ${deviceLabel} توسط ${user.fullName} (کارشناس حسابداری) تایید و خریداری شد. اکنون می‌توانید عملیات تعمیر را ادامه دهید.`,
          deviceId: pr.deviceId,
        });
      } else {
        // If no specific technician assigned, notify all repair technicians
        await notifyRoles(["repair_technician"], {
          type: "parts_approved_by_accountant",
          title: "تایید خرید قطعه توسط حسابداری",
          message: `درخواست خرید قطعه «${pr.partName}» برای ${deviceLabel} توسط ${user.fullName} (کارشناس حسابداری) تایید و خریداری شد.`,
          deviceId: pr.deviceId,
        });
      }
    }

    // Also notify the original requester (if different from current user)
    if (pr.requestedById && pr.requestedById !== user.id) {
      await notify(pr.requestedById, {
        type: "parts_approved",
        title: "تایید خرید قطعه",
        message: `درخواست خرید قطعه «${pr.partName}» برای ${deviceLabel} توسط ${user.fullName} (${approverRole}) تایید شد. اکنون فرم تعمیر برای شما باز است و می‌توانید عملیات تعمیر این دستگاه را ادامه دهید.`,
        deviceId: pr.deviceId,
      });
    }
  } else {
    await db
      .update(partRequests)
      .set({ status: "rejected", approvedById: user.id, approvedAt: new Date() })
      .where(eq(partRequests.id, pr.id));
    await db
      .update(devices)
      .set({ status: "assigned", needsParts: false, updatedAt: new Date() })
      .where(eq(devices.id, pr.deviceId));

    const approverRole = user.role === "accountant" ? "کارشناس حسابداری" : user.role === "service_manager" ? "مدیر خدمات" : "مدیر کل";

    await logDeviceAction(
      pr.deviceId,
      user.id,
      "رد قطعه",
      "awaiting_parts",
      "assigned",
      `درخواست قطعه «${pr.partName}» توسط ${approverRole} رد شد.${reason ? ` دلیل: ${reason}` : ""}`
    );

    // Get the device info for notification
    const deviceRows = await db.select().from(devices).where(eq(devices.id, pr.deviceId)).limit(1);
    const device = deviceRows[0];
    const deviceLabel = device ? `${device.ticketNumber} (${device.brand || ""} ${device.model || ""})`.trim() : `دستگاه شماره ${pr.deviceId}`;

    if (pr.requestedById) {
      await notify(pr.requestedById, {
        type: "parts_rejected",
        title: "درخواست قطعه رد شد",
        message: `درخواست خرید قطعه «${pr.partName}» برای ${deviceLabel} توسط ${user.fullName} (${approverRole}) رد شد.${reason ? ` دلیل: ${reason}.` : ""} لطفاً مجدداً بررسی کنید.`,
        deviceId: pr.deviceId,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
