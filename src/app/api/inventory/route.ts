import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inventoryItems } from "@/db/schema";
import { eq, ilike, or, desc, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await requireUser();
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";

  const cond = search
    ? or(
        ilike(inventoryItems.name, `%${search}%`),
        ilike(inventoryItems.partModel, `%${search}%`),
        ilike(inventoryItems.sku, `%${search}%`),
        ilike(inventoryItems.supplier, `%${search}%`)
      )
    : undefined;

  const items = await db
    .select()
    .from(inventoryItems)
    .where(cond)
    .orderBy(desc(inventoryItems.createdAt));

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!["super_admin", "service_manager", "intake_technician", "repair_technician"].includes(user.role)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, partModel, sku, currentStock, minStockLevel, buyPrice, sellPrice, supplier, location } = body;

  if (!name) {
    return NextResponse.json({ error: "نام قطعه الزامی است" }, { status: 400 });
  }

  const [item] = await db
    .insert(inventoryItems)
    .values({
      name: String(name),
      partModel: partModel ? String(partModel) : null,
      sku: sku ? String(sku) : null,
      currentStock: Number(currentStock) || 0,
      minStockLevel: Number(minStockLevel) || 2,
      buyPrice: String(buyPrice || 0),
      sellPrice: String(sellPrice || 0),
      supplier: supplier ? String(supplier) : null,
      location: location ? String(location) : null,
    })
    .returning();

  return NextResponse.json({ ok: true, item });
}
