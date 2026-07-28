import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { devices, customers, accountingRecords, partRequests, users } from "@/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const repairId = url.searchParams.get("repairTechnicianId");
  const intakeId = url.searchParams.get("intakeTechnicianId");
  const deviceType = url.searchParams.get("deviceType");
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");
  const search = url.searchParams.get("search");

  const conds: any[] = [sql`true`];
  if (status && status !== "all") {
    if (status === "open") conds.push(sql`${devices.status} not in ('delivered','closed','cancelled')`);
    else conds.push(eq(devices.status, status as any));
  }
  if (repairId && repairId !== "all") conds.push(eq(devices.repairTechnicianId, Number(repairId)));
  if (intakeId && intakeId !== "all") conds.push(eq(devices.intakeTechnicianId, Number(intakeId)));
  if (deviceType && deviceType !== "all") conds.push(eq(devices.deviceType, deviceType));
  if (dateFrom) conds.push(gte(devices.intakeDate, new Date(dateFrom)));
  if (dateTo) {
    const d = new Date(dateTo);
    d.setHours(23, 59, 59, 999);
    conds.push(lte(devices.intakeDate, d));
  }
  if (search) {
    conds.push(
      sql`(${devices.ticketNumber} ilike ${"%" + search + "%"} OR ${devices.model} ilike ${"%" + search + "%"} OR EXISTS (SELECT 1 FROM ${customers} c WHERE c.id = ${devices.customerId} AND (c.name ilike ${"%" + search + "%"} OR c.phone ilike ${"%" + search + "%"})))`
    );
  }

  // restrict technicians to their own data unless admin/manager
  const restricted = user.role === "repair_technician" || user.role === "intake_technician";
  if (restricted && user.role === "repair_technician") conds.push(eq(devices.repairTechnicianId, user.id));
  if (restricted && user.role === "intake_technician") conds.push(eq(devices.intakeTechnicianId, user.id));

  const partCostSub = sql`(SELECT COALESCE(SUM(pr.part_price),0) FROM ${partRequests} pr WHERE pr.device_id = ${devices.id} AND pr.status='approved')`;

  const rows = await db
    .select({
      id: devices.id,
      ticketNumber: devices.ticketNumber,
      status: devices.status,
      deviceType: devices.deviceType,
      brand: devices.brand,
      model: devices.model,
      problem: devices.problem,
      estimatedCost: devices.estimatedCost,
      finalCost: devices.finalCost,
      intakeDate: devices.intakeDate,
      deliveryDate: devices.deliveryDate,
      customerName: customers.name,
      customerPhone: customers.phone,
      intakeTechName: sql<string | null>`u_in.full_name`,
      repairTechName: sql<string | null>`u_rep.full_name`,
      partCost: sql<string>`${partCostSub}`,
      receivedAmount: accountingRecords.receivedAmount,
      profit: accountingRecords.profit,
      accStatus: accountingRecords.status,
    })
    .from(devices)
    .leftJoin(customers, eq(devices.customerId, customers.id))
    .leftJoin(sql`${users} as u_in`, sql`u_in.id = ${devices.intakeTechnicianId}`)
    .leftJoin(sql`${users} as u_rep`, sql`u_rep.id = ${devices.repairTechnicianId}`)
    .leftJoin(accountingRecords, eq(accountingRecords.deviceId, devices.id))
    .where(and(...conds))
    .orderBy(sql`${devices.intakeDate} DESC`);

  const summary = rows.reduce(
    (acc, r) => {
      acc.count += 1;
      acc.partCost += Number(r.partCost || 0);
      acc.received += Number(r.receivedAmount || 0);
      acc.profit += Number(r.profit || 0) || Number(r.receivedAmount || 0) - Number(r.partCost || 0);
      return acc;
    },
    { count: 0, partCost: 0, received: 0, profit: 0 }
  );

  return NextResponse.json({ items: rows, summary });
}
