import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { partRequests, devices, inventoryItems } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { logDeviceAction } from "@/lib/queries";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!["service_manager", "super_admin", "accountant"].includes(user.role)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action as "approve" | "reject";

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
    await logDeviceAction(
      pr.deviceId,
      user.id,
      "تایید قطعه",
      "awaiting_parts",
      "parts_approved",
      `درخواست قطعه «${pr.partName}» تایید شد.`
    );

    if (pr.requestedById) {
      await notify(pr.requestedById, {
        type: "parts_approved",
        title: "تایید خرید قطعه توسط حسابداری",
        message: `درخواست خرید قطعه «${pr.partName}» توسط ${user.fullName} تایید شد. اکنون فرم تعمیر برای شما باز است و می‌توانید عملیات تعمیر این دستگاه را ادامه دهید.`,
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

    await logDeviceAction(
      pr.deviceId,
      user.id,
      "رد قطعه",
      "awaiting_parts",
      "assigned",
      `درخواست قطعه «${pr.partName}» توسط مدیر رد شد.`
    );

    if (pr.requestedById) {
      await notify(pr.requestedById, {
        type: "parts_rejected",
        title: "درخواست قطعه رد شد",
        message: `درخواست قطعه رد شد. لطفاً مجدداً بررسی کنید.`,
        deviceId: pr.deviceId,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
