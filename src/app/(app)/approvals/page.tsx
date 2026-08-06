"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Spinner, Badge, EmptyState } from "@/components/ui";
import { api } from "@/lib/client";
import { formatMoney, formatDateTime } from "@/lib/format";
import { PackageCheck, Check, X } from "lucide-react";

export default function ApprovalsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/parts-requests?status=pending")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, []);

  async function decide(id: number, action: "approve" | "reject") {
    let reason: string | undefined;
    if (action === "reject") {
      reason = window.prompt("دلیل رد درخواست قطعه (اختیاری):") ?? undefined;
      if (reason === undefined) return;
    }
    setBusy(id);
    try {
      await api(`/api/parts-requests/${id}`, "PATCH", { action, ...(reason ? { reason } : {}) });
      load();
    } catch {
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-extrabold text-slate-800 dark:text-white">
          <PackageCheck className="h-5 w-5 text-amber-600" /> تایید خرید قطعه
        </h1>
        <p className="mt-1 text-xs text-slate-500">درخواست‌های خرید قطعه از کارشناسان تعمیر برای بررسی و تایید</p>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20"><Spinner /></div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState title="درخواست تایید قطعه‌ای وجود ندارد" hint="هنگام ثبت درخواست جدید توسط کارشناسان، اینجا نمایش داده می‌شود." icon={<PackageCheck className="h-10 w-10" />} />
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <Link href={`/devices/${p.deviceId}`} className="font-mono text-sm font-bold text-sky-700 hover:underline dark:text-sky-400">
                    {p.ticketNumber}
                  </Link>
                  <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {p.brand} {p.model}
                  </p>
                  <p className="text-[11px] text-slate-400">{p.deviceType} • درخواست‌دهنده: {p.requestedByName || "—"}</p>
                </div>
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">در انتظار</Badge>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/40">
                <div>
                  <p className="text-slate-400">نام قطعه</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{p.partName}</p>
                </div>
                <div>
                  <p className="text-slate-400">مدل / کد</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{p.partModel || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-400">قیمت قطعه</p>
                  <p className="font-bold text-amber-600">{formatMoney(p.partPrice)}</p>
                </div>
                <div>
                  <p className="text-slate-400">تامین‌کننده</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{p.supplier || "—"}</p>
                </div>
                {p.notes && (
                  <div className="col-span-2">
                    <p className="text-slate-400">توضیحات</p>
                    <p className="text-slate-600 dark:text-slate-300">{p.notes}</p>
                  </div>
                )}
                <div className="col-span-2 text-[11px] text-slate-400">{formatDateTime(p.requestedAt)}</div>
              </div>

              <div className="flex gap-2">
                <Button variant="success" size="sm" className="flex-1" loading={busy === p.id} onClick={() => decide(p.id, "approve")}>
                  <Check className="h-4 w-4" /> تایید خرید
                </Button>
                <Button variant="danger" size="sm" className="flex-1" loading={busy === p.id} onClick={() => decide(p.id, "reject")}>
                  <X className="h-4 w-4" /> رد
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
