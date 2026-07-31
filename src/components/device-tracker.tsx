"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Wrench, Truck, CreditCard, PackageSearch, XCircle } from "lucide-react";
import { STATUS_LABELS } from "@/db/schema";
import { toFa, formatDateTime, formatShortDate, classNames } from "@/lib/format";

interface Stage {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const STAGES: Stage[] = [
  { key: "intake", label: "پذیرش", icon: <CheckCircle2 className="h-5 w-5" /> },
  { key: "parts_approved", label: "تایید قطعه", icon: <PackageSearch className="h-5 w-5" /> },
  { key: "in_repair", label: "تعمیر", icon: <Wrench className="h-5 w-5" /> },
  { key: "delivered", label: "تحویل", icon: <Truck className="h-5 w-5" /> },
  { key: "settled", label: "تسویه", icon: <CreditCard className="h-5 w-5" /> },
];

/** Map a raw device status (from the DB enum) to one of the 5 tracker stages (0..4). */
const STATUS_TO_STAGE: Record<string, number> = {
  registered: 0,
  assigned: 0,
  awaiting_parts: 0,
  parts_approved: 1,
  in_progress: 2,
  repair_done: 2,
  delivered: 3,
  closed: 4,
};

export default function DeviceTracker({ deviceId }: { deviceId: number }) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/devices/${deviceId}/status`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.error || "دستگاه یافت نشد");
        }
        return r.json();
      })
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => alive && setError(e.message || "خطا در دریافت وضعیت"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [deviceId]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center dark:bg-slate-900">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600" />
        <p className="mt-3 text-xs text-slate-400">در حال بارگذاری وضعیت دستگاه…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900/50 dark:bg-rose-950/30">
        <XCircle className="mx-auto h-8 w-8 text-rose-500" />
        <p className="mt-2 text-sm font-bold text-rose-700 dark:text-rose-300">{error}</p>
        <p className="mt-1 text-xs text-rose-500/80">لطفاً شماره دستگاه را بررسی کنید.</p>
      </div>
    );
  }

  const status: string = data?.status || "registered";
  const isCancelled = status === "cancelled";
  const currentIndex = STATUS_TO_STAGE[status] ?? 0;

  const stageMeta = [
    { label: "شماره رسید", value: data?.ticketNumber ? toFa(data.ticketNumber) : "—" },
    { label: "نام مشتری", value: data?.customerName || "—" },
    { label: "دستگاه", value: [data?.brand, data?.model].filter(Boolean).join(" • ") || data?.deviceType || "—" },
    { label: "تاریخ پذیرش", value: data?.intakeDate ? formatShortDate(data.intakeDate) : "—" },
    { label: "وضعیت فعلی", value: STATUS_LABELS[status] || status },
  ];

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-800 dark:text-white">
          <Truck className="h-5 w-5 text-sky-600" /> پیگیری آنلاین وضعیت دستگاه
        </h3>
        <span
          className={classNames(
            "rounded-full px-3 py-1 text-xs font-bold",
            isCancelled
              ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
              : "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200"
          )}
        >
          {isCancelled ? "این دستگاه لغو شده است" : "مرحله فعلی تکمیل‌شده"}
        </span>
      </div>

      {/* Meta */}
      <div className="mb-8 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-xs dark:bg-slate-800/40 sm:grid-cols-3 md:grid-cols-5">
        {stageMeta.map((m) => (
          <div key={m.label}>
            <p className="text-slate-400">{m.label}</p>
            <p className="font-bold text-slate-700 dark:text-slate-200">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Graphical 5-stage progress */}
      <div className="relative mb-2 px-2">
        {/* connector line */}
        <div className="absolute right-[10%] left-[10%] top-5 h-1 -translate-y-1/2 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div
          className="absolute right-[10%] top-5 h-1 -translate-y-1/2 rounded-full bg-gradient-to-l from-emerald-500 to-sky-500 transition-all duration-500"
          style={{ width: isCancelled ? "0%" : `${Math.max(0, currentIndex) * 25}%` }}
        />
        <div className="relative flex items-start justify-between">
          {STAGES.map((stage, idx) => {
            const done = !isCancelled && idx <= currentIndex;
            const current = !isCancelled && idx === currentIndex;
            return (
              <div key={stage.key} className="flex w-1/5 flex-col items-center text-center">
                <div
                  className={classNames(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-sm transition-all duration-300",
                    done && "border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
                    current && "scale-110 ring-4 ring-emerald-200 dark:ring-emerald-900/60",
                    !done && "border-slate-300 bg-white text-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-600"
                  )}
                >
                  {done ? <CheckCircle2 className="h-5 w-5" /> : stage.icon}
                </div>
                <span
                  className={classNames(
                    "mt-2 text-[11px] font-semibold leading-tight",
                    done ? "text-emerald-600 dark:text-emerald-300" : "text-slate-400"
                  )}
                >
                  {stage.label}
                </span>
                {current && (
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                    <Clock className="h-3 w-3" /> در جریان
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-8">
        <p className="mb-3 text-xs font-bold text-slate-600 dark:text-slate-300">تایم‌لاین رویدادها</p>
        {data?.timeline?.length > 0 ? (
          <div className="relative border-r-2 border-slate-200 pr-4 dark:border-slate-700">
            {data.timeline.map((item: any, i: number) => (
              <div key={i} className="relative mb-4 last:mb-0">
                <div className="absolute -right-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-sky-600 dark:border-slate-900" />
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold text-slate-800 dark:text-white">
                  <span>{item.action}</span>
                  <span className="text-[11px] font-normal text-slate-400">{formatDateTime(item.createdAt)}</span>
                </div>
                {item.note && <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{item.note}</p>}
                {item.userName && (
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    توسط: <strong>{item.userName}</strong>
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">هنوز رویدادی ثبت نشده است.</p>
        )}
      </div>
    </div>
  );
}
