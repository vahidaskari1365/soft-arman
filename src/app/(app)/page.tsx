"use client";

import { useFetch } from "@/lib/client";
import { Card, CardHeader, StatCard, Spinner, Badge } from "@/components/ui";
import { StatusDonut, TechBar, TimelineLine } from "@/components/charts";
import { STATUS_LABELS, ROLE_LABELS } from "@/db/schema";
import { toFa, formatNumber, formatMoney, statusColor, classNames } from "@/lib/format";
import {
  Wrench,
  Clock,
  CheckCircle2,
  PackageCheck,
  TrendingUp,
  Coins,
  Inbox as InboxIcon,
  Truck,
  CalendarClock,
  Users,
} from "lucide-react";

export default function DashboardPage() {
  const { data, loading } = useFetch<any>("/api/stats");

  if (loading || !data) {
    return (
      <div className="grid place-items-center py-32">
        <Spinner />
      </div>
    );
  }

  const statusCounts: Record<string, number> = data.statusCounts || {};
  const donutData = Object.entries(STATUS_LABELS)
    .filter(([k]) => statusCounts[k])
    .map(([k, v]) => ({ key: k, name: v, value: statusCounts[k] }));

  const isRepair = data.role === "repair_technician";
  const isIntake = data.role === "intake_technician";
  const isManager = data.role === "super_admin" || data.role === "service_manager";

  return (
    <div className="space-y-5">
      {/* Manager / Accountant financial overview */}
      {data.financials && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="درآمد کل دریافتی" value={formatMoney(data.financials.received)} accent="emerald" icon={<Coins className="h-5 w-5" />} />
          <StatCard label="هزینه کل قطعات" value={formatMoney(data.financials.partCost)} accent="amber" icon={<Wrench className="h-5 w-5" />} />
          <StatCard label="سود خالص" value={formatMoney(data.financials.profit)} accent="sky" icon={<TrendingUp className="h-5 w-5" />} />
          <StatCard label="در انتظار تسویه" value={formatNumber(data.financials.pending)} accent="violet" icon={<Clock className="h-5 w-5" />} />
        </div>
      )}

      {/* Repair technician cards */}
      {isRepair && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="دستگاه‌های در دست من" value={formatNumber(data.inHand)} accent="sky" icon={<InboxIcon className="h-5 w-5" />} />
          <StatCard label="منتظر تایید قطعه" value={formatNumber(data.awaitingApproval)} accent="amber" icon={<PackageCheck className="h-5 w-5" />} />
          <StatCard label="تعمیرهای تکمیل‌شده" value={formatNumber(data.completed)} accent="emerald" icon={<CheckCircle2 className="h-5 w-5" />} />
          <StatCard label="مجموع کارکرد" value={formatNumber(data.total)} accent="violet" icon={<Wrench className="h-5 w-5" />} />
        </div>
      )}

      {/* Intake technician cards */}
      {isIntake && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="پذیرش‌های من" value={formatNumber(data.total)} accent="sky" icon={<InboxIcon className="h-5 w-5" />} />
          <StatCard label="در حال تعمیر" value={formatNumber(data.inRepair)} accent="violet" icon={<Wrench className="h-5 w-5" />} />
          <StatCard label="آماده تحویل به مشتری" value={formatNumber(data.readyForDelivery)} accent="amber" icon={<CalendarClock className="h-5 w-5" />} />
          <StatCard label="تحویل‌شده به مشتری" value={formatNumber(data.delivered)} accent="emerald" icon={<Truck className="h-5 w-5" />} />
        </div>
      )}

      {/* Status distribution + timeline */}
      {(isManager || data.financials) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="توزیع دستگاه‌ها بر اساس وضعیت" subtitle="نمای شماتیک از وضعیت کلی" />
            <div className="p-4">
              <StatusDonut data={donutData} />
            </div>
          </Card>
          <Card>
            <CardHeader title="دستگاه‌های پذیرش‌شده در ۱۴ روز اخیر" subtitle="روند زمانی" />
            <div className="p-4">
              <TimelineLine data={data.timeline || []} />
            </div>
          </Card>
        </div>
      )}

      {/* Repair tech performance timeline */}
      {isRepair && (
        <Card>
          <CardHeader title="کارکرد تعمیرات من در ۱۴ روز اخیر" subtitle="تعداد تعمیرهای تکمیل‌شده روزانه" />
          <div className="p-4">
            <TimelineLine data={data.performance || []} />
          </div>
        </Card>
      )}

      {/* Per-technician KPI (management) */}
      {data.techKpis && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader title="عملکرد کارشناسان تعمیر" subtitle="مقایسه تعداد تعمیرها" />
            <div className="p-4">
              <TechBar data={(data.techKpis || []).map((t: any) => ({ name: t.name, total: t.done }))} dataKey="total" name="تعمیر تکمیل‌شده" />
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="جدول KPI کارشناسان" subtitle="عملکرد پذیرش و تعمیر" />
            <div className="overflow-x-auto p-3">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="text-slate-400">
                    <th className="p-2 font-medium">کارشناس تعمیر</th>
                    <th className="p-2 font-medium">در دست</th>
                    <th className="p-2 font-medium">تکمیل‌شده</th>
                    <th className="p-2 font-medium">مجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.techKpis || []).map((t: any) => (
                    <tr key={t.id} className="border-t border-[var(--color-border)]">
                      <td className="p-2 font-semibold text-slate-700 dark:text-slate-200">{t.name}</td>
                      <td className="p-2"><Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">{formatNumber(t.inHand)}</Badge></td>
                      <td className="p-2"><Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">{formatNumber(t.done)}</Badge></td>
                      <td className="p-2 font-bold">{formatNumber(t.total)}</td>
                    </tr>
                  ))}
                  {(data.intakeKpis || []).length > 0 && (
                    <>
                      <tr><td colSpan={4} className="bg-slate-50 p-2 text-[11px] font-bold text-slate-500 dark:bg-slate-800/40">کارشناسان پذیرش</td></tr>
                      {data.intakeKpis.map((t: any) => (
                        <tr key={t.id} className="border-t border-[var(--color-border)]">
                          <td className="p-2 font-semibold text-slate-700 dark:text-slate-200">{t.name}</td>
                          <td className="p-2 text-slate-400">—</td>
                          <td className="p-2"><Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-200">{formatNumber(t.delivered)}</Badge></td>
                          <td className="p-2 font-bold">{formatNumber(t.total)}</td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {!isManager && !isRepair && !isIntake && !data.financials && (
        <Card className="p-8 text-center text-sm text-slate-500">
          به سامانه خوش آمدید. برای مشاهده گزارش‌ها از منو استفاده کنید.
        </Card>
      )}
    </div>
  );
}
