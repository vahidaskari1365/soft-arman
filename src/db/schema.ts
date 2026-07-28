import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  numeric,
  pgEnum,
} from "drizzle-orm/pg-core";

// ---- Enums -------------------------------------------------------------

export const roleEnum = pgEnum("user_role", [
  "super_admin",
  "service_manager",
  "repair_technician",
  "intake_technician",
  "accountant",
]);

export const deviceStatusEnum = pgEnum("device_status", [
  "registered", // پذیرش اولیه
  "assigned", // تحویل کارشناس تعمییر
  "awaiting_parts", // منتظر تایید خرید قطعه توسط مدیر خدمات
  "parts_approved", // قطعه تایید شد
  "in_progress", // در حال تعمیر (بدون نیاز قطعه یا بعد از تایید)
  "repair_done", // تعمیر تمام شد -> بازگشت به پذیرش
  "delivered", // تحویل به مشتری
  "closed", // تسویه حسابداری
  "cancelled", // لغو شده
]);

// ---- Tables ------------------------------------------------------------

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  role: roleEnum("role").notNull(),
  phone: text("phone"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  phone2: text("phone2"),
  address: text("address"),
  nationalId: text("national_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  ticketNumber: text("ticket_number").notNull().unique(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  deviceType: text("device_type").notNull(),
  brand: text("brand"),
  model: text("model").notNull(),
  accessories: text("accessories"), // متعلقات همراه دستگاه
  problem: text("problem").notNull(),
  estimatedCost: numeric("estimated_cost", { precision: 14, scale: 0 }).default("0"),
  finalCost: numeric("final_cost", { precision: 14, scale: 0 }).default("0"),
  status: deviceStatusEnum("status").notNull().default("registered"),
  intakeTechnicianId: integer("intake_technician_id").references(() => users.id),
  repairTechnicianId: integer("repair_technician_id").references(() => users.id),
  needsParts: boolean("needs_parts").default(false).notNull(),
  repairNotes: text("repair_notes"),
  operationsDone: text("operations_done"),
  intakeDate: timestamp("intake_date", { withTimezone: true }).defaultNow().notNull(),
  deliveryDate: timestamp("delivery_date", { withTimezone: true }),
  closedDate: timestamp("closed_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const partRequests = pgTable("part_requests", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id")
    .notNull()
    .references(() => devices.id),
  partName: text("part_name").notNull(),
  partModel: text("part_model"),
  partPrice: numeric("part_price", { precision: 14, scale: 0 }).default("0"),
  supplier: text("supplier"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  requestedById: integer("requested_by_id").references(() => users.id),
  approvedById: integer("approved_by_id").references(() => users.id),
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});

export const accountingRecords = pgTable("accounting_records", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id")
    .notNull()
    .references(() => devices.id)
    .unique(),
  partCost: numeric("part_cost", { precision: 14, scale: 0 }).default("0"),
  receivedAmount: numeric("received_amount", { precision: 14, scale: 0 }).default("0"),
  profit: numeric("profit", { precision: 14, scale: 0 }).default("0"),
  status: text("status").notNull().default("pending"), // pending | settled
  recordedById: integer("recorded_by_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  settledAt: timestamp("settled_at", { withTimezone: true }),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  deviceId: integer("device_id").references(() => devices.id),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type PartRequest = typeof partRequests.$inferSelect;
export type AccountingRecord = typeof accountingRecords.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "مدیر کل (سوپر یوزر)",
  service_manager: "مدیر خدمات",
  repair_technician: "کارشناس تعمیرات",
  intake_technician: "کارشناس پذیرش",
  accountant: "کارشناس حسابداری",
};

export const DEVICE_TYPES = [
  "گوشی موبایل",
  "ایرپاد",
  "هدفون",
  "هندزفری",
  "پلی استیشن",
  "اسپیکر",
  "تبلت",
  "لپ تاپ",
  "ساعت هوشمند",
  "مودم و شبکه",
  "متفرقه",
];

export const STATUS_LABELS: Record<string, string> = {
  registered: "ثبت پذیرش",
  assigned: "نزد کارشناس تعمیر",
  awaiting_parts: "منتظر تایید قطعه",
  parts_approved: "قطعه تایید شد",
  in_progress: "در حال تعمیر",
  repair_done: "تعمیر پایان یافت",
  delivered: "تحویل به مشتری",
  closed: "تسویه شد",
  cancelled: "لغو شده",
};
