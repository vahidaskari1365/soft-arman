import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  users,
  customers,
  devices,
  partRequests,
  accountingRecords,
  inventoryItems,
  suppliers,
  deviceLogs,
  deviceNotes,
  settings,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز (فقط سوپریوزر)" }, { status: 403 });
  }

  const [
    usersList,
    customersList,
    devicesList,
    partRequestsList,
    accountingList,
    inventoryList,
    suppliersList,
    logsList,
    notesList,
    settingsList,
  ] = await Promise.all([
    db.select().from(users),
    db.select().from(customers),
    db.select().from(devices),
    db.select().from(partRequests),
    db.select().from(accountingRecords),
    db.select().from(inventoryItems),
    db.select().from(suppliers),
    db.select().from(deviceLogs),
    db.select().from(deviceNotes),
    db.select().from(settings),
  ]);

  const backupData = {
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    data: {
      users: usersList,
      customers: customersList,
      devices: devicesList,
      partRequests: partRequestsList,
      accountingRecords: accountingList,
      inventoryItems: inventoryList,
      suppliers: suppliersList,
      deviceLogs: logsList,
      deviceNotes: notesList,
      settings: settingsList,
    },
  };

  const json = JSON.stringify(backupData, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="soft-arman-backup-${dateStr}.json"`,
    },
  });
}
