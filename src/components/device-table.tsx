"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";
import { STATUS_LABELS, ROLE_LABELS } from "@/db/schema";
import { toFa, formatDate, statusColor, classNames } from "@/lib/format";
import { Wrench } from "lucide-react";

export type DeviceRow = {
  id: number;
  ticketNumber: string;
  status: string;
  deviceType: string;
  brand: string | null;
  model: string;
  problem: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  intakeTechName?: string | null;
  repairTechName?: string | null;
  intakeDate?: string | null;
};

export default function DeviceTable({ items }: { items: DeviceRow[] }) {
  if (items.length === 0) {
    return (
      <div className="grid place-items-center gap-2 py-14 text-center">
        <Wrench className="h-8 w-8 text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-semibold text-slate-500">دستگاهی یافت نشد</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-right text-xs">
        <thead>
          <tr className="text-slate-400">
            <th className="p-2.5 font-medium">رسید</th>
            <th className="p-2.5 font-medium">دستگاه</th>
            <th className="p-2.5 font-medium">مشتری</th>
            <th className="p-2.5 font-medium">کارشناس تعمیر</th>
            <th className="p-2.5 font-medium">تاریخ پذیرش</th>
            <th className="p-2.5 font-medium">وضعیت</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.id} className="border-t border-[var(--color-border)] hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="p-2.5">
                <Link href={`/devices/${d.id}`} className="font-mono font-bold text-sky-700 hover:underline dark:text-sky-400">
                  {d.ticketNumber}
                </Link>
              </td>
              <td className="p-2.5">
                <div className="font-semibold text-slate-700 dark:text-slate-200">
                  {[d.brand, d.model].filter(Boolean).join(" ") || d.deviceType}
                </div>
                <div className="text-[10px] text-slate-400">{d.deviceType}</div>
              </td>
              <td className="p-2.5">
                <div className="text-slate-600 dark:text-slate-300">{d.customerName || "—"}</div>
                <div className="text-[10px] text-slate-400">{toFa(d.customerPhone || "")}</div>
              </td>
              <td className="p-2.5 text-slate-600 dark:text-slate-300">{d.repairTechName || "—"}</td>
              <td className="p-2.5 text-slate-500">{d.intakeDate ? formatDate(d.intakeDate) : "—"}</td>
              <td className="p-2.5">
                <Badge className={classNames(statusColor(d.status))}>{STATUS_LABELS[d.status] || d.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { STATUS_LABELS, ROLE_LABELS };
