import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { classNames } from "@/lib/format";

/* ---------------- Button ---------------- */
type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-sky-700 text-white hover:bg-sky-800 focus-visible:ring-sky-500 shadow-sm shadow-sky-700/20",
  secondary:
    "bg-slate-800 text-white hover:bg-slate-900 focus-visible:ring-slate-500 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500",
  outline:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-xs px-2.5 py-1.5 gap-1",
  md: "text-sm px-4 py-2 gap-2",
  lg: "text-base px-5 py-2.5 gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  loading,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}) {
  return (
    <button
      className={classNames(
        "inline-flex cursor-pointer items-center justify-center rounded-xl font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

/* ---------------- Card ---------------- */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={classNames(
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------- Badge ---------------- */
export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- Inputs ---------------- */
const fieldBase =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:bg-slate-900/60 dark:text-slate-100";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={classNames(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={classNames(fieldBase, "min-h-[88px] resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={classNames(fieldBase, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}

export function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

/* ---------------- Stat Card ---------------- */
export function StatCard({
  label,
  value,
  icon,
  accent = "sky",
  sub,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: "sky" | "emerald" | "amber" | "rose" | "violet" | "slate";
  sub?: ReactNode;
}) {
  const accents: Record<string, string> = {
    sky: "from-sky-500/15 to-sky-500/0 text-sky-600 dark:text-sky-300",
    emerald: "from-emerald-500/15 to-emerald-500/0 text-emerald-600 dark:text-emerald-300",
    amber: "from-amber-500/15 to-amber-500/0 text-amber-600 dark:text-amber-300",
    rose: "from-rose-500/15 to-rose-500/0 text-rose-600 dark:text-rose-300",
    violet: "from-violet-500/15 to-violet-500/0 text-violet-600 dark:text-violet-300",
    slate: "from-slate-500/15 to-slate-500/0 text-slate-600 dark:text-slate-300",
  };
  return (
    <Card className="overflow-hidden p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-800 dark:text-white">{value}</p>
          {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
        </div>
        {icon && (
          <div className={classNames("grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-b", accents[accent])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------------- Misc ---------------- */
export function Spinner({ className }: { className?: string }) {
  return (
    <span className={classNames("inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600", className)} />
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      {icon && <div className="text-slate-300 dark:text-slate-600">{icon}</div>}
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{title}</p>
      {hint && <p className="max-w-xs text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "md" | "lg";
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={classNames(
          "relative z-10 w-full animate-fade-in-up rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl",
          size === "lg" ? "max-w-2xl" : "max-w-md"
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3.5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="بستن">
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
