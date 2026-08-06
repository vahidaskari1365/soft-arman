import { NextResponse } from "next/server";
import { db } from "@/db";
import { devices, partRequests, notifications } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

/**
 * Lightweight badge counts for the sidebar:
 *  - inbox:     items currently awaiting action for this user (role-scoped)
 *  - approvals: pending part-purchase requests (for approvers)
 */
export async function GET() {
  const user = await requireUser();

  const cnt = (rows: { count: number }[]) => rows[0]?.count ?? 0;

  // ---- Inbox count (mirrors the /inbox page scoping) ----
  let inbox = 0;
  if (user.role === "repair_technician") {
    inbox = cnt(
      await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(devices)
        .where(
          sql`${devices.repairTechnicianId} = ${user.id} and ${devices.status} in ('registered','assigned','awaiting_parts','parts_approved','in_progress')`
        )
    );
  } else if (user.role === "intake_technician") {
    inbox = cnt(
      await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(devices)
        .where(
          sql`${devices.intakeTechnicianId} = ${user.id} and ${devices.status} not in ('delivered','closed','cancelled')`
        )
    );
  } else if (user.role === "service_manager" || user.role === "super_admin") {
    inbox = cnt(
      await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(devices)
        .where(eq(devices.status, "awaiting_parts"))
    );
  }

  // ---- Approvals count (pending part requests) ----
  let approvals = 0;
  if (["service_manager", "super_admin", "accountant"].includes(user.role)) {
    approvals = cnt(
      await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(partRequests)
        .where(eq(partRequests.status, "pending"))
    );
  }

  return NextResponse.json({ inbox, approvals });
}
