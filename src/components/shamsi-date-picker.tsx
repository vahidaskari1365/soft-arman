"use client";

import { useEffect, useRef, useState } from "react";
import { toFa, toEn, persianToGregorian, formatShortDate } from "@/lib/format";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const FA_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

const FA_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

function getPersianMonthDays(py: number, pm: number): number {
  if (pm <= 6) return 31;
  if (pm <= 11) return 30;
  // Esfand: check leap year
  const g1 = persianToGregorian(py, 1, 1);
  const g2 = persianToGregorian(py + 1, 1, 1);
  if (!g1 || !g2) return 29;
  const diff = (g2.getTime() - g1.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 366 ? 30 : 29;
}

/** Get the day-of-week (0=Saturday .. 6=Friday) for the first day of a Persian month. */
function getPersianMonthStartDow(py: number, pm: number): number {
  const g = persianToGregorian(py, pm, 1);
  if (!g) return 0;
  // Shift so Saturday = 0
  return (g.getDay() + 1) % 7;
}

function parsePersianDateStr(value: string): { y: number; m: number; d: number } | null {
  const clean = toEn(value).replace(/[^0-9]/g, "");
  if (clean.length !== 8) return null;
  const y = parseInt(clean.slice(0, 4), 10);
  const m = parseInt(clean.slice(4, 6), 10);
  const d = parseInt(clean.slice(6, 8), 10);
  if (y < 1300 || y > 1500 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

export default function ShamsiDatePicker({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (gregorianDate: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [py, setPy] = useState(0);
  const [pm, setPm] = useState(0);
  const [selected, setSelected] = useState<{ y: number; m: number; d: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input display from value
  useEffect(() => {
    if (value) {
      const s = formatShortDate(value);
      setInputVal(s);
      const parsed = parsePersianDateStr(s);
      if (parsed) {
        setSelected(parsed);
        setPy(parsed.y);
        setPm(parsed.m);
      }
    } else {
      setInputVal("");
      setSelected(null);
    }
  }, [value]);

  // Init calendar to today if no selection
  useEffect(() => {
    if (py === 0) {
      const today = formatShortDate(new Date().toISOString());
      const p = parsePersianDateStr(today);
      if (p) { setPy(p.y); setPm(p.m); }
    }
  }, [py]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const monthDays = getPersianMonthDays(py, pm);
  const startDow = getPersianMonthStartDow(py, pm);

  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let i = 1; i <= monthDays; i++) days.push(i);

  function selectDay(d: number) {
    const g = persianToGregorian(py, pm, d);
    if (!g) return;
    const iso = g.toISOString().split("T")[0];
    setSelected({ y: py, m: pm, d });
    setInputVal(formatShortDate(iso));
    onChange(iso);
    setOpen(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setInputVal(raw);
    const parsed = parsePersianDateStr(raw);
    if (parsed) {
      const g = persianToGregorian(parsed.y, parsed.m, parsed.d);
      if (g) {
        const iso = g.toISOString().split("T")[0];
        setSelected(parsed);
        setPy(parsed.y);
        setPm(parsed.m);
        onChange(iso);
      }
    } else {
      // Try partial: if user typed 8 digits, still try to convert
      const clean = toEn(raw).replace(/[^0-9]/g, "");
      if (clean.length === 8) {
        const y = parseInt(clean.slice(0, 4), 10);
        const m = parseInt(clean.slice(4, 6), 10);
        const d = parseInt(clean.slice(6, 8), 10);
        if (y >= 1300 && y <= 1500 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
          const g = persianToGregorian(y, m, d);
          if (g) {
            setSelected({ y, m, d });
            setPy(y);
            setPm(m);
            onChange(g.toISOString().split("T")[0]);
          }
        }
      }
    }
  }

  function prevMonth() {
    if (pm === 1) { setPy(py - 1); setPm(12); }
    else setPm(pm - 1);
  }

  function nextMonth() {
    if (pm === 12) { setPy(py + 1); setPm(1); }
    else setPm(pm + 1);
  }

  function goToday() {
    const today = formatShortDate(new Date().toISOString());
    const p = parsePersianDateStr(today);
    if (p) { setPy(p.y); setPm(p.m); selectDay(p.d); }
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={inputVal}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || "۱۴۰۳/۰۵/۱۵"}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 pr-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:bg-slate-900/60 dark:text-slate-100 font-mono"
        />
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-72 animate-fade-in-up rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-xl">
          {/* Header */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="cursor-pointer rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {FA_MONTHS[pm - 1]} {toFa(String(py))}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="cursor-pointer rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-bold text-slate-400">
            {FA_DAYS.map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 text-center text-xs">
            {days.map((d, i) =>
              d === null ? (
                <div key={`e-${i}`} />
              ) : (
                <button
                  key={d}
                  type="button"
                  onClick={() => selectDay(d)}
                  className={`cursor-pointer rounded-lg p-1.5 transition-colors ${
                    selected && selected.y === py && selected.m === pm && selected.d === d
                      ? "bg-sky-600 text-white font-bold"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {toFa(String(d))}
                </button>
              )
            )}
          </div>

          {/* Today button */}
          <button
            type="button"
            onClick={goToday}
            className="mt-2 w-full cursor-pointer rounded-lg bg-slate-100 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 dark:bg-slate-800 dark:text-sky-400 dark:hover:bg-slate-700"
          >
            امروز
          </button>
        </div>
      )}
    </div>
  );
}