import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  customers,
  inventoryItems,
  suppliers,
  settings,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز (فقط سوپریوزر)" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const data = body.data || body;

  let settingsCount = 0;
  let customersCount = 0;
  let inventoryCount = 0;
  let suppliersCount = 0;

  // Restore settings
  if (Array.isArray(data.settings)) {
    for (const item of data.settings) {
      if (!item.key) continue;
      const existing = await db.select().from(settings).where(eq(settings.key, String(item.key))).limit(1);
      if (existing[0]) {
        await db.update(settings).set({ value: item.value || null }).where(eq(settings.key, String(item.key)));
      } else {
        await db.insert(settings).values({ key: String(item.key), value: item.value || null });
      }
      settingsCount++;
    }
  }

  // Restore customers
  if (Array.isArray(data.customers)) {
    for (const item of data.customers) {
      if (!item.phone || !item.name) continue;
      const existing = await db.select().from(customers).where(eq(customers.phone, String(item.phone))).limit(1);
      if (existing[0]) {
        await db
          .update(customers)
          .set({
            name: String(item.name),
            phone2: item.phone2 || null,
            address: item.address || null,
            nationalId: item.nationalId || null,
          })
          .where(eq(customers.id, existing[0].id));
      } else {
        await db.insert(customers).values({
          name: String(item.name),
          phone: String(item.phone),
          phone2: item.phone2 || null,
          address: item.address || null,
          nationalId: item.nationalId || null,
        });
      }
      customersCount++;
    }
  }

  // Restore inventory items
  if (Array.isArray(data.inventoryItems)) {
    for (const item of data.inventoryItems) {
      if (!item.name) continue;
      await db.insert(inventoryItems).values({
        name: String(item.name),
        partModel: item.partModel || null,
        sku: item.sku || null,
        currentStock: Number(item.currentStock) || 0,
        minStockLevel: Number(item.minStockLevel) || 2,
        buyPrice: String(item.buyPrice || 0),
        sellPrice: String(item.sellPrice || 0),
        supplier: item.supplier || null,
        location: item.location || null,
      });
      inventoryCount++;
    }
  }

  // Restore suppliers
  if (Array.isArray(data.suppliers)) {
    for (const item of data.suppliers) {
      if (!item.name) continue;
      await db.insert(suppliers).values({
        name: String(item.name),
        contactPerson: item.contactPerson || null,
        phone: item.phone || null,
        address: item.address || null,
        notes: item.notes || null,
      });
      suppliersCount++;
    }
  }

  return NextResponse.json({
    ok: true,
    restored: {
      settings: settingsCount,
      customers: customersCount,
      inventoryItems: inventoryCount,
      suppliers: suppliersCount,
    },
  });
}
