"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, Spinner, StatCard, Badge, Button, EmptyState } from "@/components/ui";
import { STATUS_LABELS } from "@/db/schema";
import { exportToExcel } from "@/lib/client";
import { formatMoney, formatDateTime, toFa, formatNumber, classNames, statusColor, formatDate } from "@/lib/format";
import { Calculator, Coins, TrendingUp, Clock, Download } from "lucide-react";

export default function AccountingPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [settled, setSettled] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/reports?status=delivered").then((r) => r.json()),
      fetch("/api/reports?status=closed").then((r) => r.json()),
      fetch("/api/stats").then((r) => r.json()),
    ]).then(([p, s, st]) => {
      setPending(p.items || []);
      setSettled(s.items || []);
      setStats(st);
      setLoading(false);
    });
  }, []);

  function exportAll() {
    const rows = [...pending, ...settled].map((d) => ({
      "رسید": d.ticketNumber,
      "دستگاه": [d.brand, d.model].filter(Boolean).join(" "),
      "مشتری": d.customerName || "",
      "کارشناس تعمیر": d.repairTechName || "",
      "تاریخ پذیرش": d.intakeDate ? formatDate(d.intakeDate) : "",
      "تاریخ تحویل": d.deliveryDate ? formatDate(d.deliveryDate) : "",
      "هزینه قطعه": Number(d.partCost || 0),
      "مبلغ دریافتی": Number(d.receivedAmount || 0),
      "سود خالص": Number(d.profit || 0) || Number(d.receivedAmount || 0) - Number(d.partCost || 0),
      "وضعیت": STATUS_LABELS[d.status],
    }));
    exportToExcel(rows, `حسابداری-${formatDate(new Date())}`, "حسابداری");
  }

  const fin = stats?.financials;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-extrabold text-slate-800 dark:text-white">
            <Calculator className="h-5 w-5 text-violet-600" /> حسابداری و مالی
          </h1>
          <p className="mt-1 text-xs text-slate-500">مدیریت درآمد، هزینه قطعات و سود خالص</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportAll}>
          <Download className="h-4 w-4" /> خروجی اکسل
        </Button>
      </div>

      {fin && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="کل درآمد دریافتی" value={formatMoney(fin.received)} accent="emerald" icon={<Coins className="h-5 w-5" />} />
          <StatCard label="کل هزینه قطعات" value={formatMoney(fin.partCost)} accent="amber" icon={<Calculator className="h-5 w-5" />} />
          <StatCard label="سود خالص کل" value={formatMoney(fin.profit)} accent="sky" icon={<TrendingUp className="h-5 w-5" />} />
          <StatCard label="در انتظار تسویه" value={formatNumber(fin.pending)} accent="violet" icon={<Clock className="h-5 w-5" />} />
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-20"><Spinner /></div>
      ) : (
        <>
          <Card>
            <CardHeader title="در انتظار تسویه حساب" subtitle="دستگاه‌های تحویل‌شده که نیازمند ثبت نهایی مالی هستند" />
            {pending.length === 0 ? (
              <EmptyState title="موردی در انتظار تسویه نیست" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-right text-xs">
                  <thead>
                    <tr className="text-slate-400">
                      <th className="p-2.5 font-medium">رسید</th>
                      <th className="p-2.5 font-medium">دستگاه</th>
                      <th className="p-2.5 font-medium">دریافتی</th>
                      <th className="p-2.5 font-medium">قطعه</th>
                      <th className="p-2.5 font-medium">سود</th>
                      <th className="p-2.5 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((d) => (
                      <tr key={d.id} className="border-t border-[var(--color-border)]">
                        <td className="p-2.5 font-mono text-sky-700 dark:text-sky-400">{toFa(d.ticketNumber)}</td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-200">{[d.brand, d.model].filter(Boolean).join(" ")}</td>
                        <td className="p-2.5 text-emerald-600">{formatMoney(d.receivedAmount)}</td>
                        <td className="p-2.5 text-amber-600">{formatMoney(d.partCost)}</td>
                        <td className="p-2.5 font-bold text-violet-600">{formatMoney(Number(d.profit) || Number(d.receivedAmount) - Number(d.partCost))}</td>
                        <td className="p-2.5"><Link href={`/devices/${d.id}`}><Button size="sm">تسویه</Button></Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="تاریخچه تسویه‌شده" subtitle="سوابق مالی بسته‌شده" />
            {settled.length === 0 ? (
              <EmptyState title="سابقه‌ای ثبت نشده" />
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full min-w-[720px] text-right text-xs">
                  <thead className="sticky top-0 bg-[var(--color-surface)]">
                    <tr className="text-slate-400">
                      <th className="p-2.5 font-medium">رسید</th>
                      <th className="p-2.5 font-medium">دستگاه</th>
                      <th className="p-2.5 font-medium">دریافتی</th>
                      <th className="p-2.5 font-medium">قطعه</th>
                      <th className="p-2.5 font-medium">سود خالص</th>
                      <th className="p-2.5 font-medium">تحویل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settled.map((d) => (
                      <tr key={d.id} className="border-t border-[var(--color-border)]">
                        <td className="p-2.5 font-mono text-sky-700 dark:text-sky-400">{toFa(d.ticketNumber)}</td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-200">{[d.brand, d.model].filter(Boolean).join(" ")}</td>
                        <td className="p-2.5 text-emerald-600">{formatMoney(d.receivedAmount)}</td>
                        <td className="p-2.5 text-amber-600">{formatMoney(d.partCost)}</td>
                        <td className="p-2.5 font-bold text-violet-600">{formatMoney(Number(d.profit) || Number(d.receivedAmount) - Number(d.partCost))}</td>
                        <td className="p-2.5 text-slate-400">{d.deliveryDate ? formatDateTime(d.deliveryDate) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
