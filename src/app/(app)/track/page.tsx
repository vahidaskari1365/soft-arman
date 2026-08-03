"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DeviceTracker from "@/components/device-tracker";
import { Search, Radar } from "lucide-react";

function TrackInner() {
  const searchParams = useSearchParams();
  const initialSerial = (searchParams.get("id") || "").trim();
  const [serial, setSerial] = useState<string | null>(initialSerial || null);
  const [input, setInput] = useState(initialSerial);

  const handleTrack = () => {
    const value = input.trim();
    if (value) setSerial(value);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-800 dark:text-white">
          <Radar className="h-6 w-6 text-sky-600" /> پیگیری آنلاین وضعیت دستگاه
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          برای مشاهده لحظه‌ای وضعیت ۵ مرحله‌ای دستگاه، شماره سریال دستگاه را وارد کنید.
        </p>
      </div>

      <div className="mb-8 flex gap-2">
        <input
          type="text"
          placeholder="شماره سریال / IMEI دستگاه"
          className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:bg-slate-900/60 dark:text-slate-100"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleTrack()}
        />
        <button
          onClick={handleTrack}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-sky-600 px-8 py-3 text-sm font-medium text-white hover:bg-sky-700"
        >
          <Search className="h-4 w-4" /> پیگیری
        </button>
      </div>

      {serial ? (
        <DeviceTracker key={serial} serial={serial} />
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <Radar className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm font-semibold text-slate-500">هنوز دستگاهی برای پیگیری انتخاب نشده است.</p>
          <p className="mt-1 text-xs text-slate-400">شماره سریال دستگاه را وارد کرده و دکمه «پیگیری» را بزنید.</p>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="grid place-items-center py-32"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600" /></div>}>
      <TrackInner />
    </Suspense>
  );
}
