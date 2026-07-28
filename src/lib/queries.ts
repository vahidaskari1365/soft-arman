import { db } from "@/db";
import { devices, customers, users, partRequests, accountingRecords } from "@/db/schema";
import { and, eq, gte, lte, ilike, desc, sql, getTableColumns } from "drizzle-orm";

export type DeviceFilters = {
  status?: string;
  search?: string;
  repairTechnicianId?: number | null;
  intakeTechnicianId?: number | null;
  deviceType?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  mine?: number; // current user id (used for "my inbox")
  roleScope?: string; // role-based scoping
};

export async function listDevices(filters: DeviceFilters = {}) {
  const intake = sql`intake_tech`;
  const repair = sql`repair_tech`;
  const conds: any[] = [];

  if (filters.status && filters.status !== "all") {
    if (filters.status === "active_repair") {
      conds.push(sql`${devices.status} in ('assigned','awaiting_parts','parts_approved','in_progress')`);
    } else if (filters.status === "open") {
      conds.push(sql`${devices.status} not in ('delivered','closed','cancelled')`);
    } else {
      conds.push(eq(devices.status, filters.status as any));
    }
  }
  if (filters.repairTechnicianId) conds.push(eq(devices.repairTechnicianId, filters.repairTechnicianId));
  if (filters.intakeTechnicianId) conds.push(eq(devices.intakeTechnicianId, filters.intakeTechnicianId));
  if (filters.deviceType && filters.deviceType !== "all") conds.push(eq(devices.deviceType, filters.deviceType));
  if (filters.dateFrom) conds.push(gte(devices.intakeDate, new Date(filters.dateFrom)));
  if (filters.dateTo) {
    const d = new Date(filters.dateTo);
    d.setHours(23, 59, 59, 999);
    conds.push(lte(devices.intakeDate, d));
  }
  if (filters.search) {
    conds.push(
      sql`(${devices.ticketNumber} ilike ${"%" + filters.search + "%"} OR ${devices.model} ilike ${"%" + filters.search + "%"} OR ${devices.brand} ilike ${"%" + filters.search + "%"} OR EXISTS (SELECT 1 FROM ${customers} c WHERE c.id = ${devices.customerId} AND (c.name ilike ${"%" + filters.search + "%"} OR c.phone ilike ${"%" + filters.search + "%"})))`
    );
  }

  // role-based scoping for technicians' inbox
  if (filters.roleScope === "repair") {
    conds.push(eq(devices.repairTechnicianId, filters.mine!));
    if (!filters.status) conds.push(sql`${devices.status} in ('assigned','awaiting_parts','parts_approved','in_progress')`);
  }
  if (filters.roleScope === "intake") {
    conds.push(eq(devices.intakeTechnicianId, filters.mine!));
  }

  const rows = await db
    .select({
      ...getTableColumns(devices),
      customerName: customers.name,
      customerPhone: customers.phone,
      customerPhone2: customers.phone2,
      intakeTechName: sql<string | null>`u_in.full_name`,
      repairTechName: sql<string | null>`u_rep.full_name`,
    })
    .from(devices)
    .leftJoin(customers, eq(devices.customerId, customers.id))
    .leftJoin(sql`${users} as u_in`, sql`u_in.id = ${devices.intakeTechnicianId}`)
    .leftJoin(sql`${users} as u_rep`, sql`u_rep.id = ${devices.repairTechnicianId}`)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(devices.createdAt))
    .limit(filters.limit ?? 100)
    .offset(filters.offset ?? 0);

  return rows;
}

export async function getDeviceDetail(id: number) {
  const rows = await db
    .select({
      ...getTableColumns(devices),
      customerName: customers.name,
      customerPhone: customers.phone,
      customerPhone2: customers.phone2,
      customerAddress: customers.address,
      customerNationalId: customers.nationalId,
      intakeTechName: sql<string | null>`u_in.full_name`,
      repairTechName: sql<string | null>`u_rep.full_name`,
    })
    .from(devices)
    .leftJoin(customers, eq(devices.customerId, customers.id))
    .leftJoin(sql`${users} as u_in`, sql`u_in.id = ${devices.intakeTechnicianId}`)
    .leftJoin(sql`${users} as u_rep`, sql`u_rep.id = ${devices.repairTechnicianId}`)
    .where(eq(devices.id, id))
    .limit(1);

  const device = rows[0];
  if (!device) return null;

  const parts = await db
    .select()
    .from(partRequests)
    .where(eq(partRequests.deviceId, id))
    .orderBy(desc(partRequests.requestedAt));

  const acc = await db
    .select()
    .from(accountingRecords)
    .where(eq(accountingRecords.deviceId, id))
    .limit(1);

  return { ...device, parts, accounting: acc[0] ?? null };
}

export async function getTechnicians(role: "repair_technician" | "intake_technician") {
  return db
    .select({ id: users.id, fullName: users.fullName })
    .from(users)
    .where(and(eq(users.role, role), eq(users.active, true)))
    .orderBy(users.fullName);
}
