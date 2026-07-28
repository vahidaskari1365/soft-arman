import { NextResponse } from "next/server";
import { db } from "@/db";
import { devices, users, accountingRecords } from "@/db/schema";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();

  const isRepair = user.role === "repair_technician";
  const isIntake = user.role === "intake_technician";
  const isAccountant = user.role === "accountant";
  const isManager = user.role === "super_admin" || user.role === "service_manager";

  const ownerCol = isRepair ? devices.repairTechnicianId : isIntake ? devices.intakeTechnicianId : null;
  const ownerFilter = ownerCol ? eq(ownerCol, user.id) : sql`true`;

  // status counts (scoped for technicians)
  const statusRows: { status: string; count: number }[] = await db.execute(sql`
    SELECT status, count(*)::int as count FROM ${devices}
    WHERE ${ownerCol ? sql`${ownerCol} = ${user.id}` : sql`true`}
    GROUP BY status
  `).then((r: any) => r.rows ?? r);

  const statusCounts: Record<string, number> = {};
  let total = 0;
  for (const r of statusRows) {
    statusCounts[r.status] = Number(r.count);
    total += Number(r.count);
  }

  const result: any = { total, statusCounts, role: user.role };

  if (isRepair) {
    result.inHand =
      (statusCounts["assigned"] || 0) + (statusCounts["awaiting_parts"] || 0) + (statusCounts["parts_approved"] || 0) + (statusCounts["in_progress"] || 0);
    result.awaitingApproval = statusCounts["awaiting_parts"] || 0;
    result.completed = (statusCounts["repair_done"] || 0) + (statusCounts["delivered"] || 0) + (statusCounts["closed"] || 0);
    // my performance by day (last 14 days)
    const perf: { day: string; count: number }[] = await db.execute(sql`
      SELECT d::date::text as day, count(*)::int as count
      FROM generate_series(now() - interval '13 days', now(), '1 day') AS d
      LEFT JOIN ${devices} dev ON dev.updated_at::date = d::date AND dev.repair_technician_id = ${user.id} AND dev.status IN ('repair_done','delivered','closed')
      GROUP BY d ORDER BY d
    `).then((r: any) => r.rows ?? r);
    result.performance = perf;
  }

  if (isIntake) {
    result.registered = statusCounts["registered"] || 0;
    result.inRepair = (statusCounts["assigned"] || 0) + (statusCounts["awaiting_parts"] || 0) + (statusCounts["parts_approved"] || 0) + (statusCounts["in_progress"] || 0);
    result.readyForDelivery = statusCounts["repair_done"] || 0;
    result.delivered = (statusCounts["delivered"] || 0) + (statusCounts["closed"] || 0);
  }

  if (isManager || isAccountant) {
    // per-technician KPI
    const techKpis: any[] = await db.execute(sql`
      SELECT u.id, u.full_name as name, u.role,
        count(d.*)::int as total,
        count(d.*) FILTER (WHERE d.status IN ('assigned','awaiting_parts','parts_approved','in_progress'))::int as in_hand,
        count(d.*) FILTER (WHERE d.status IN ('repair_done','delivered','closed'))::int as done
      FROM ${users} u LEFT JOIN ${devices} d ON d.repair_technician_id = u.id AND u.role = 'repair_technician'
      WHERE u.role = 'repair_technician'
      GROUP BY u.id, u.full_name, u.role ORDER BY done DESC, total DESC
    `).then((r: any) => r.rows ?? r);

    const intakeKpis: any[] = await db.execute(sql`
      SELECT u.id, u.full_name as name,
        count(d.*)::int as total,
        count(d.*) FILTER (WHERE d.status IN ('delivered','closed'))::int as delivered
      FROM ${users} u LEFT JOIN ${devices} d ON d.intake_technician_id = u.id
      WHERE u.role = 'intake_technician'
      GROUP BY u.id, u.full_name ORDER BY delivered DESC, total DESC
    `).then((r: any) => r.rows ?? r);

    // financials
    const fin: any = await db.execute(sql`
      SELECT
        COALESCE(SUM(received_amount),0)::float8 as received,
        COALESCE(SUM(part_cost),0)::float8 as part_cost,
        COALESCE(SUM(profit),0)::float8 as profit,
        count(*)::int as records,
        count(*) FILTER (WHERE status='pending')::int as pending
      FROM ${accountingRecords}
    `).then((r: any) => (r.rows ?? r)[0] ?? {});

    result.financials = {
      received: Number(fin.received || 0),
      partCost: Number(fin.part_cost || 0),
      profit: Number(fin.profit || 0),
      pending: Number(fin.pending || 0),
    };
    result.techKpis = techKpis.map((t) => ({ ...t, total: Number(t.total), inHand: Number(t.in_hand), done: Number(t.done) }));
    result.intakeKpis = intakeKpis.map((t) => ({ ...t, total: Number(t.total), delivered: Number(t.delivered) }));

    // devices over time (last 14 days)
    const timeline: { day: string; count: number }[] = await db.execute(sql`
      SELECT d::date::text as day, count(*)::int as count
      FROM generate_series(now() - interval '13 days', now(), '1 day') AS d
      LEFT JOIN ${devices} dev ON dev.intake_date::date = d::date
      GROUP BY d ORDER BY d
    `).then((r: any) => r.rows ?? r);
    result.timeline = timeline;
  }

  return NextResponse.json(result);
}
