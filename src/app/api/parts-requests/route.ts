import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { partRequests, devices, users } from "@/db/schema";
import { eq, desc, sql, getTableColumns } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (!["service_manager", "super_admin", "repair_technician"].includes(user.role)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "pending";

  const rows = await db
    .select({
      ...getTableColumns(partRequests),
      ticketNumber: devices.ticketNumber,
      brand: devices.brand,
      model: devices.model,
      deviceType: devices.deviceType,
      deviceStatus: devices.status,
      requestedByName: sql<string | null>`u.full_name`,
    })
    .from(partRequests)
    .innerJoin(devices, eq(partRequests.deviceId, devices.id))
    .leftJoin(sql`${users} as u`, sql`u.id = ${partRequests.requestedById}`)
    .where(status === "all" ? undefined : eq(partRequests.status, status))
    .orderBy(desc(partRequests.requestedAt));

  return NextResponse.json({ items: rows });
}
