"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, Spinner, Input, Select, Button, Field, StatCard, Badge } from "@/components/ui";
import { STATUS_LABELS, DEVICE_TYPES } from "@/db/schema";
import { exportToExcel, useFetch } from "@/lib/client";
import { formatMoney, formatDate, statusColor, toFa, formatNumber, classNames } from "@/lib/format";
import { Download, BarChart3, TrendingUp, Coins, Wrench, Filter } from "lucide-react";

export default function ReportsPage() {
  const { data: techData } = useFetch<any>("/api/technicians");
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ count: 0, partCost: 0, received: 0, profit: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [repairId, setRepairId] = useState("all");
  const [intakeId, setIntakeId] = useState("all");
  const [deviceType, setDeviceType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (status !== "all") p.set("status", status);
      if (repairId !== "all") p.set("repairTechnicianId", repairId);
      if (intakeId !== "all") p.set("intakeTechnicianId", intakeId);
      if (deviceType !== "all") p.set("deviceType", deviceType);
      if (dateFrom) p.set("dateFrom", dateFrom);
      if (dateTo) p.set("dateTo", dateTo);
      fetch(`/api/reports?${p.toString()}`)
        .then((r) => r.json())
        .then((d) => {
          setItems(d.items || []);
          setSummary(d.summary || {});
        })
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [search, status, repairId, intakeId, deviceType, dateFrom, dateTo]);

  function doExport() {
    const rows = items.map((d) => ({
      "رسید": d.ticketNumber,
      "نوع دستگاه": d.deviceType,
      "برند/مدل": [d.brand, d.model].filter(Boolean).join(" "),
      "مشتری": d.customerName || "",
      "تلفن": d.customerPhone || "",
      "کارشناس پذیرش": d.intakeTechName || "",
      "کارشناس تعمیر": d.repairTechName || "",
      "تاریخ پذیرش": d.intakeDate ? formatDate(d.intakeDate) : "",
      "تاریخ تحویل": d.deliveryDate ? formatDate(d.deliveryDate) : "",
      "هزینه تخمینی": Number(d.estimatedCost || 0),
      "هزینه قطعه": Number(d.partCost || 0),
      "مبلغ دریافتی": Number(d.receivedAmount || 0),
      "سود خالص": Number(d.profit || 0),
      "وضعیت": STATUS_LABELS[d.status] || d.status,
    }));
    exportToExcel(rows, `گزارش-خدمات-${formatDate(new Date())}`, "گزارش");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-extrabold text-slate-800 dark:text-white">
            <BarChart3 className="h-5 w-5 text-sky-600" /> گزارش‌گیری
          </h1>
          <p className="mt-1 text-xs text-slate-500">فیلتر بر اساس تاریخ، کارشناس، وضعیت و خروجی اکسل کامل</p>
        </div>
        <Button variant="outline" size="sm" onClick={doExport}>
          <Download className="h-4 w-4" /> خروجی اکسل
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="تعداد دستگاه" value={formatNumber(summary.count)} accent="sky" icon={<BarChart3 className="h-5 w-5" />} />
        <StatCard label="کل هزینه قطعات" value={formatMoney(summary.partCost)} accent="amber" icon={<Wrench className="h-5 w-5" />} />
        <StatCard label="کل دریافتی" value={formatMoney(summary.received)} accent="emerald" icon={<Coins className="h-5 w-5" />} />
        <StatCard label="سود خالص" value={formatMoney(summary.profit)} accent="violet" icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Filter className="h-3.5 w-3.5" /> فیلترهای گزارش
        </div>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          <Field label="جستجو">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="رسید، مدل، مشتری" />
          </Field>
          <Field label="وضعیت">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">همه</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
          <Field label="کارشناس تعمیر">
            <Select value={repairId} onChange={(e) => setRepairId(e.target.value)}>
              <option value="all">همه</option>
              {techData?.repair?.map((t: any) => (
                <option key={t.id} value={t.id}>{t.fullName}</option>
              ))}
            </Select>
          </Field>
          <Field label="کارشناس پذیرش">
            <Select value={intakeId} onChange={(e) => setIntakeId(e.target.value)}>
              <option value="all">همه</option>
              {techData?.intake?.map((t: any) => (
                <option key={t.id} value={t.id}>{t.fullName}</option>
              ))}
            </Select>
          </Field>
          <Field label="نوع دستگاه">
            <Select value={deviceType} onChange={(e) => setDeviceType(e.target.value)}>
              <option value="all">همه</option>
              {DEVICE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="از تاریخ"><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></Field>
          <Field label="تا تاریخ"><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></Field>
        </div>
      </Card>

      <Card>
        <CardHeader title={`نتیجه گزارش (${formatNumber(items.length)} رکورد)`} />
        {loading ? (
          <div className="grid place-items-center py-16"><Spinner /></div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">موردی یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-right text-xs">
              <thead>
                <tr className="text-slate-400">
                  <th className="p-2.5 font-medium">رسید</th>
                  <th className="p-2.5 font-medium">دستگاه</th>
                  <th className="p-2.5 font-medium">تعمیرکار</th>
                  <th className="p-2.5 font-medium">تاریخ پذیرش</th>
                  <th className="p-2.5 font-medium">قطعه</th>
                  <th className="p-2.5 font-medium">دریافتی</th>
                  <th className="p-2.5 font-medium">سود</th>
                  <th className="p-2.5 font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id} className="border-t border-[var(--color-border)] hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-mono font-bold text-sky-700 dark:text-sky-400">{toFa(d.ticketNumber)}</td>
                    <td className="p-2.5 text-slate-700 dark:text-slate-200">{[d.brand, d.model].filter(Boolean).join(" ")}</td>
                    <td className="p-2.5 text-slate-500">{d.repairTechName || "—"}</td>
                    <td className="p-2.5 text-slate-500">{d.intakeDate ? formatDate(d.intakeDate) : "—"}</td>
                    <td className="p-2.5 text-amber-600">{Number(d.partCost) ? formatMoney(d.partCost) : "—"}</td>
                    <td className="p-2.5 text-emerald-600">{Number(d.receivedAmount) ? formatMoney(d.receivedAmount) : "—"}</td>
                    <td className="p-2.5 font-bold text-violet-600">{Number(d.profit) ? formatMoney(d.profit) : "—"}</td>
                    <td className="p-2.5"><Badge className={classNames(statusColor(d.status))}>{STATUS_LABELS[d.status]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
