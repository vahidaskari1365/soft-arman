import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

/** Notify a specific user. */
export async function notify(userId: number, data: { type: string; title: string; message: string; deviceId?: number | null }) {
  await db.insert(notifications).values({
    userId,
    type: data.type,
    title: data.title,
    message: data.message,
    deviceId: data.deviceId ?? null,
    read: false,
  });
}

/** Notify all users matching one or more roles. */
export async function notifyRoles(
  roles: ("super_admin" | "service_manager" | "repair_technician" | "intake_technician" | "accountant")[],
  data: { type: string; title: string; message: string; deviceId?: number | null }
) {
  const rows = await db.select({ id: users.id }).from(users).where(inArray(users.role, roles));
  await Promise.all(rows.map((r) => notify(r.id, data)));
}

export async function getServiceManagers() {
  return db.select().from(users).where(eq(users.role, "service_manager"));
}

export async function getIntakeTechnician(id: number) {
  return id;
}
