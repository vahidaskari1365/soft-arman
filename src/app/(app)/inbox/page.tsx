"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, Spinner, Badge } from "@/components/ui";
import DeviceTable, { type DeviceRow } from "@/components/device-table";
import { classNames, toFa, formatNumber } from "@/lib/format";
import { Inbox as InboxIcon } from "lucide-react";

export default function InboxPage() {
  const [role, setRole] = useState<string>("");
  const [items, setItems] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      setRole(me.user?.role || "");
      let url = "/api/devices?limit=100";
      if (me.user?.role === "repair_technician") url = "/api/devices?scope=repair&limit=100";
      else if (me.user?.role === "intake_technician") url = "/api/devices?scope=intake&limit=100";
      else if (me.user?.role === "service_manager" || me.user?.role === "super_admin") url = "/api/devices?status=awaiting_parts&limit=100";
      const d = await fetch(url).then((r) => r.json());
      setItems(d.items || []);
      setLoading(false);
    })();
  }, []);

  const title =
    role === "repair_technician"
      ? "دستگاه‌های در دست تعمیر من"
      : role === "intake_technician"
      ? "دستگاه‌های پذیرش‌شده توسط من"
      : "دستگاه‌های منتظر تایید قطعه";

  const readyCount = items.filter((i) => i.status === "repair_done").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-extrabold text-slate-800 dark:text-white">
            <InboxIcon className="h-5 w-5 text-sky-600" /> کارتابل من
          </h1>
          <p className="mt-1 text-xs text-slate-500">{title}</p>
        </div>
        {role === "intake_technician" && readyCount > 0 && (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200 animate-pulse-soft">
            {formatNumber(readyCount)} دستگاه آماده تحویل به مشتری
          </Badge>
        )}
      </div>

      <Card>
        {loading ? (
          <div className="grid place-items-center py-20">
            <Spinner />
          </div>
        ) : (
          <DeviceTable items={items} />
        )}
      </Card>
    </div>
  );
}
