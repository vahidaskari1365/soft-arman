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
 * Uses the proven jalaali-js algorithm for accurate conversion.
 */
export function persianToGregorian(persianDateStr: string): Date | null {
  const parts = persianDateStr.split(/[/\-]/);
  if (parts.length !== 3) return null;
  const py = parseInt(parts[0]);
  const pm = parseInt(parts[1]);
  const pd = parseInt(parts[2]);
  if (isNaN(py) || isNaN(pm) || isNaN(pd)) return null;
  if (py < 1300 || py > 1500 || pm < 1 || pm > 12 || pd < 1 || pd > 31) return null;
  try {
    const jdn = _j2d(py, pm, pd);
    const g = _d2g(jdn);
    return new Date(g.gy, g.gm - 1, g.gd);
  } catch {
    return null;
  }
}

/* ---- jalaali-js internals ---- */
const BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
function _div(a: number, b: number): number { return ~~(a / b); }
function _mod(a: number, b: number): number { return a - ~~(a / b) * b; }

function _jalCal(jy: number) {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jm: number, jump = 0, leap = 0, leapG: number, march: number, n: number;
  let i: number;

  for (i = 1; i < bl; i += 1) {
    jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + _div(jump, 33) * 8 + _div(_mod(jump, 33), 4);
    jp = jm;
  }
  n = jy - jp;

  leapJ = leapJ + _div(n, 33) * 8 + _div(_mod(n, 33) + 3, 4);
  if (_mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  leapG = _div(gy, 4) - _div((_div(gy, 100) + 1) * 3, 4) - 150;
  march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + _div(jump + 4, 33) * 33;
  leap = _mod(_mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

function _j2d(jy: number, jm: number, jd: number): number {
  const r = _jalCal(jy);
  return _g2d(r.gy, 3, r.march) + (jm - 1) * 31 - _div(jm, 7) * (jm - 7) + jd - 1;
}

function _g2d(gy: number, gm: number, gd: number): number {
  let d = _div((gy + _div(gm - 8, 6) + 100100) * 1461, 4) + _div(153 * _mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - _div(_div(gy + 100100 + _div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function _d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j = j + _div(_div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = _div(_mod(j, 1461), 4) * 5 + 308;
  const gd = _mod(i, 153) / 5 + 1;
  const gm = _mod(_div(i, 153), 12) + 1;
  const gy = _div(j, 1461) - 100100 + _div(8 - gm, 6);
  return { gy, gm, gd: Math.floor(gd) };
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