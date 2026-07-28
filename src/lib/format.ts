/** Shared formatting + helpers for the Hamrah Repair Service app. */

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFa(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

export function toEn(input: string): string {
  return input.replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));
}

/** Format an amount (Toman) with thousands separators in Persian digits. */
export function formatMoney(value: string | number | null | undefined): string {
  const n = Number(String(value ?? "0").replace(/[^\d.-]/g, "")) || 0;
  const grouped = new Intl.NumberFormat("en-US").format(Math.round(n));
  return toFa(grouped) + " تومان";
}

export function formatMoneyPlain(value: string | number | null | undefined): string {
  const n = Number(String(value ?? "0").replace(/[^\d.-]/g, "")) || 0;
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

export function toNumber(value: unknown): number {
  const n = Number(String(value ?? "0").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "—";
  }
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
