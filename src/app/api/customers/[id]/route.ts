import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, devices, accountingRecords } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const customerId = Number(id);

  const rows = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
  const customer = rows[0];
  if (!customer) return NextResponse.json({ error: "مشتری یافت نشد" }, { status: 404 });

  const custDevices = await db
    .select({
      id: devices.id,
      ticketNumber: devices.ticketNumber,
      deviceType: devices.deviceType,
      brand: devices.brand,
      model: devices.model,
      problem: devices.problem,
      status: devices.status,
      estimatedCost: devices.estimatedCost,
      finalCost: devices.finalCost,
      deposit: devices.deposit,
      deadlineDate: devices.deadlineDate,
      intakeDate: devices.intakeDate,
      deliveryDate: devices.deliveryDate,
      receivedAmount: sql<string | null>`(SELECT ${accountingRecords.receivedAmount} FROM ${accountingRecords} WHERE ${accountingRecords.deviceId} = ${devices.id} LIMIT 1)`,
      partCost: sql<string | null>`(SELECT ${accountingRecords.partCost} FROM ${accountingRecords} WHERE ${accountingRecords.deviceId} = ${devices.id} LIMIT 1)`,
      profit: sql<string | null>`(SELECT ${accountingRecords.profit} FROM ${accountingRecords} WHERE ${accountingRecords.deviceId} = ${devices.id} LIMIT 1)`,
    })
    .from(devices)
    .where(eq(devices.customerId, customerId))
    .orderBy(desc(devices.createdAt));

  let totalReceived = 0;
  let totalPartCost = 0;
  let totalProfit = 0;
  let totalDeposit = 0;

  for (const d of custDevices) {
    totalReceived += Number(d.receivedAmount || d.finalCost || 0);
    totalPartCost += Number(d.partCost || 0);
    totalProfit += Number(d.profit || 0);
    totalDeposit += Number(d.deposit || 0);
  }

  const summary = {
    totalDevices: custDevices.length,
    totalReceived,
    totalPartCost,
    totalProfit,
    totalDeposit,
  };

  return NextResponse.json({
    customer,
    devices: custDevices,
    summary,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!["super_admin", "service_manager", "intake_technician"].includes(user.role)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const allowed = ["name", "phone", "phone2", "address", "nationalId"];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (body[k] !== undefined) patch[k] = body[k];

  await db.update(customers).set(patch).where(eq(customers.id, Number(id)));
  return NextResponse.json({ ok: true });
}
