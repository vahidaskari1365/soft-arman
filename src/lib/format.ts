/** Shared formatting + helpers for the Hamrah Repair Service app. */

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFa(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

export function toEn(input: string): string {
  return input.replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));
}

/** Format a number with thousands separators and Persian digits, e.g. "۱,۵۰۰,۰۰۰". */
export function formatNumber(value: string | number | null | undefined): string {
  const n = Number(toEn(String(value ?? "0")).replace(/[^0-9.-]/g, "")) || 0;
  const grouped = new Intl.NumberFormat("en-US", { useGrouping: true }).format(Math.round(n));
  return toFa(grouped);
}

/** Format an amount (Rial) with thousands separators, e.g. "۱,۰۰۰,۰۰۰ ریال". */
export function formatMoney(value: string | number | null | undefined): string {
  const n = Number(toEn(String(value ?? "0")).replace(/[^0-9.-]/g, "")) || 0;
  const grouped = new Intl.NumberFormat("en-US", { useGrouping: true }).format(Math.round(n));
  return toFa(grouped) + " ریال";
}

/** Format an amount (Rial) with thousands separators, no currency label. */
export function formatMoneyPlain(value: string | number | null | undefined): string {
  const n = Number(toEn(String(value ?? "0")).replace(/[^0-9.-]/g, "")) || 0;
  return new Intl.NumberFormat("en-US", { useGrouping: true }).format(Math.round(n));
}

export function toNumber(value: unknown): number {
  const n = Number(toEn(String(value ?? "0")).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Format a date value as a Jalali/Shamsi date string.
 * Uses Intl.DateTimeFormat with fa-IR-u-ca-persian for a real Persian (Jalali) calendar.
 */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return "—";
  }
}

/**
 * Format a date-time value as a Jalali/Shamsi date-time string.
 * Uses Intl.DateTimeFormat with fa-IR-u-ca-persian for a real Persian (Jalali) calendar.
 */
export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}

/**
 * Format a short date in Jalali/Shamsi format (e.g., ۱۴۰۳/۰۵/۱۵).
 * Uses Intl.DateTimeFormat with fa-IR-u-ca-persian for a real Persian (Jalali) calendar.
 */
export function formatShortDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}

/**
 * Format a time value in Jalali/Shamsi format (e.g., ۱۴:۳۰).
 * Uses Intl.DateTimeFormat with fa-IR-u-ca-persian for proper Persian digits.
 */
export function formatTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}

/**
 * Convert a Persian (Jalali) date string (e.g. "1403/05/15" or "1403-05-15") to a Gregorian Date object.
 * Uses the Borkowski algorithm for accurate conversion.
 */
export function persianToGregorian(persianDateStr: string): Date | null {
  const parts = persianDateStr.split(/[/\-]/);
  if (parts.length !== 3) return null;
  const py = parseInt(parts[0]);
  const pm = parseInt(parts[1]);
  const pd = parseInt(parts[2]);
  if (isNaN(py) || isNaN(pm) || isNaN(pd)) return null;

  const epbase = py - (py >= 0 ? 474 : 473);
  const epyear = 474 + (epbase % 2820);

  const jdn = pd
    + (pm <= 7 ? (pm - 1) * 31 : (pm - 1) * 30 + 6)
    + Math.floor((epyear * 682 - 110) / 2816)
    + (epyear - 1) * 365
    + Math.floor(epbase / 2820) * 1029983
    + 1948320 - 1;

  const j = jdn - 1721425;
  const g = Math.floor((j - 141) / 146097);
  const d = j - 141 - g * 146097;
  const e = Math.floor((d + 2) / 3657);
  const f = d - Math.floor((3657 * e) / 100) + 31;
  const h = Math.floor(f * 80 / 2447);
  const day = f - Math.floor(2447 * h / 80);
  const month = h - Math.floor(h / 11);
  const year = 400 * g + Math.floor((e + 2) / 29) + 621 + h - Math.floor(h / 11);

  return new Date(year, month - 1, day);
}

/**
 * Format a raw number string for display in a money input field.
 * Adds thousands separators and converts to Persian digits.
 * Returns the formatted string suitable for display.
 */
export function formatMoneyInput(raw: string): string {
  const digits = toEn(raw).replace(/[^0-9]/g, "");
  if (!digits) return "";
  const grouped = new Intl.NumberFormat("en-US", { useGrouping: true }).format(parseInt(digits, 10));
  return toFa(grouped);
}

/**
 * Parse a money input value back to raw digits.
 * Strips everything except digits, returns English digit string.
 */
export function parseMoneyInput(formatted: string): string {
  return toEn(formatted).replace(/[^0-9]/g, "");
}

/** Generates a ticket number like HS-۱۴۰۳-۰۰۰123 */
export function makeTicketNumber(seq: number): string {
  const year = new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(new Date());
  return `HS-${toFa(year)}-${toFa(String(seq).padStart(5, "0"))}`;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    registered: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200",
    assigned: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
    awaiting_parts: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
    parts_approved: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-200",
    in_progress: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200",
    repair_done: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200",
    delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
    closed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200",
    cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
  };
  return map[status] ?? "bg-slate-100 text-slate-700";
}

export function roleColor(role: string): string {
  const map: Record<string, string> = {
    super_admin: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
    service_manager: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
    repair_technician: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
    intake_technician: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-200",
    accountant: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200",
  };
  return map[role] ?? "bg-slate-100 text-slate-700";
}

export function classNames(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}