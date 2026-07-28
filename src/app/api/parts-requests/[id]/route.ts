import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { partRequests, devices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!["service_manager", "super_admin"].includes(user.role)) {
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
    if (pr.requestedById) {
      await notify(pr.requestedById, {
        type: "parts_approved",
        title: "خرید قطعه تایید شد",
        message: `درخواست قطعه برای رسید مربوطه تایید شد. می‌توانید عملیات تعمیر را ادامه دهید.`,
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
