import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, devices } from "@/db/schema";
import { eq, ilike, or, desc, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await requireUser();
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const limit = Number(url.searchParams.get("limit")) || 100;

  const cond = search
    ? or(ilike(customers.name, `%${search}%`), ilike(customers.phone, `%${search}%`), ilike(customers.nationalId, `%${search}%`))
    : undefined;

  const items = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      phone2: customers.phone2,
      address: customers.address,
      nationalId: customers.nationalId,
      createdAt: customers.createdAt,
      deviceCount: sql<number>`(SELECT COUNT(*)::int FROM ${devices} WHERE ${devices.customerId} = ${customers.id})`,
    })
    .from(customers)
    .where(cond)
    .orderBy(desc(customers.createdAt))
    .limit(limit);

  return NextResponse.json({ items });
}
