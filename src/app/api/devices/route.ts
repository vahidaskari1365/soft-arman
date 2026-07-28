import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { devices, customers, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { listDevices, getTechnicians } from "@/lib/queries";
import { makeTicketNumber } from "@/lib/format";
import { notify } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const url = new URL(req.url);
  const f = {
    status: url.searchParams.get("status") || undefined,
    search: url.searchParams.get("search") || undefined,
    repairTechnicianId: num(url.searchParams.get("repairTechnicianId")),
    intakeTechnicianId: num(url.searchParams.get("intakeTechnicianId")),
    deviceType: url.searchParams.get("deviceType") || undefined,
    dateFrom: url.searchParams.get("dateFrom") || undefined,
    dateTo: url.searchParams.get("dateTo") || undefined,
    limit: num(url.searchParams.get("limit")) ?? 200,
    offset: num(url.searchParams.get("offset")) ?? 0,
    mine: user.id,
    roleScope: url.searchParams.get("scope") || undefined,
  } as any;

  const items = await listDevices(f);
  const repairTechs = await getTechnicians("repair_technician");
  return NextResponse.json({ items, repairTechs });
}

function num(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!["intake_technician", "service_manager", "super_admin"].includes(user.role)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    customerName,
    customerPhone,
    customerPhone2,
    customerAddress,
    nationalId,
    deviceType,
    brand,
    model,
    accessories,
    problem,
    estimatedCost,
    repairTechnicianId,
  } = body as any;

  if (!customerName || !customerPhone || !model || !problem || !deviceType) {
    return NextResponse.json({ error: "اطلاعات مشتری و دستگاه ناقص است" }, { status: 400 });
  }
  if (!repairTechnicianId) {
    return NextResponse.json({ error: "انتخاب کارشناس تعمیر الزامی است" }, { status: 400 });
  }

  // reuse customer by phone or create
  let customerId: number;
  const existing = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.phone, String(customerPhone)))
    .limit(1);
  if (existing[0]) {
    customerId = existing[0].id;
    await db
      .update(customers)
      .set({ name: customerName, phone2: customerPhone2 || null, address: customerAddress || null, nationalId: nationalId || null })
      .where(eq(customers.id, customerId));
  } else {
    const [created] = await db
      .insert(customers)
      .values({
        name: customerName,
        phone: customerPhone,
        phone2: customerPhone2 || null,
        address: customerAddress || null,
        nationalId: nationalId || null,
      })
      .returning({ id: customers.id });
    customerId = created.id;
  }

  const [device] = await db
    .insert(devices)
    .values({
      ticketNumber: "TEMP",
      customerId,
      deviceType,
      brand: brand || null,
      model,
      accessories: accessories || null,
      problem,
      estimatedCost: String(estimatedCost || 0),
      status: "assigned",
      intakeTechnicianId: user.id,
      repairTechnicianId: Number(repairTechnicianId),
    })
    .returning({ id: devices.id });

  const ticketNumber = makeTicketNumber(device.id);
  await db.update(devices).set({ ticketNumber }).where(eq(devices.id, device.id));

  const tech = await db.select().from(users).where(eq(users.id, Number(repairTechnicianId))).limit(1);
  if (tech[0]) {
    await notify(tech[0].id, {
      type: "new_device",
      title: "دستگاه جدید برای تعمیر",
      message: `دستگاه ${brand || ""} ${model} با رسید ${ticketNumber} به شما ارجاع شد.`,
      deviceId: device.id,
    });
  }

  return NextResponse.json({ id: device.id, ticketNumber });
}
