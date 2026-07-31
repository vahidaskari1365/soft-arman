import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { eq, ilike, or, desc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await requireUser();
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";

  const cond = search
    ? or(ilike(suppliers.name, `%${search}%`), ilike(suppliers.contactPerson, `%${search}%`), ilike(suppliers.phone, `%${search}%`))
    : undefined;

  const items = await db
    .select()
    .from(suppliers)
    .where(cond)
    .orderBy(desc(suppliers.createdAt));

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!["super_admin", "service_manager", "intake_technician", "repair_technician"].includes(user.role)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, contactPerson, phone, address, notes } = body;

  if (!name) {
    return NextResponse.json({ error: "نام تامین‌کننده الزامی است" }, { status: 400 });
  }

  const [supplier] = await db
    .insert(suppliers)
    .values({
      name: String(name),
      contactPerson: contactPerson ? String(contactPerson) : null,
      phone: phone ? String(phone) : null,
      address: address ? String(address) : null,
      notes: notes ? String(notes) : null,
    })
    .returning();

  return NextResponse.json({ ok: true, supplier });
}
