import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inventoryItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const rows = await db.select().from(inventoryItems).where(eq(inventoryItems.id, Number(id))).limit(1);
  if (!rows[0]) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!["super_admin", "service_manager", "intake_technician", "repair_technician"].includes(user.role)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const allowed = ["name", "partModel", "sku", "currentStock", "minStockLevel", "buyPrice", "sellPrice", "supplier", "location"];
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of allowed) {
    if (body[k] !== undefined) {
      if (k === "currentStock" || k === "minStockLevel") {
        patch[k] = Number(body[k]) || 0;
      } else if (k === "buyPrice" || k === "sellPrice") {
        patch[k] = String(body[k] || 0);
      } else {
        patch[k] = body[k];
      }
    }
  }

  await db.update(inventoryItems).set(patch).where(eq(inventoryItems.id, Number(id)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!["super_admin", "service_manager"].includes(user.role)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }
  const { id } = await params;
  await db.delete(inventoryItems).where(eq(inventoryItems.id, Number(id)));
  return NextResponse.json({ ok: true });
}
