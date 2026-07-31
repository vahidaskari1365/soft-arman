"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { classNames, toFa } from "@/lib/format";
import {
  LayoutDashboard,
  Inbox,
  Wrench,
  ClipboardList,
  PackageCheck,
  BarChart3,
  Calculator,
  Users,
  Settings as SettingsIcon,
  LogOut,
  Moon,
  Sun,
  Bell,
  BellRing,
  Menu,
  X,
  CheckCircle2,
  Boxes,
  UserCheck,
} from "lucide-react";

type Role = "super_admin" | "service_manager" | "repair_technician" | "intake_technician" | "accountant";

type NavItem = { href: string; label: string; icon: ReactNode; roles: Role[] };

const NAV: NavItem[] = [
  { href: "/", label: "داشبورد", icon: <LayoutDashboard className="h-[18px] w-[18px]" />, roles: ["super_admin", "service_manager", "repair_technician", "intake_technician", "accountant"] },
  { href: "/inbox", label: "کارتابل من", icon: <Inbox className="h-[18px] w-[18px]" />, roles: ["repair_technician", "intake_technician", "service_manager", "super_admin"] },
  { href: "/devices/new", label: "پذیرش دستگاه", icon: <ClipboardList className="h-[18px] w-[18px]" />, roles: ["intake_technician", "super_admin", "service_manager"] },
  { href: "/devices", label: "لیست دستگاه‌ها", icon: <Wrench className="h-[18px] w-[18px]" />, roles: ["super_admin", "service_manager", "repair_technician", "intake_technician", "accountant"] },
  { href: "/approvals", label: "تایید قطعه‌ها", icon: <PackageCheck className="h-[18px] w-[18px]" />, roles: ["service_manager", "super_admin", "accountant"] },
  { href: "/track", label: "پیگیری آنلاین", icon: <Wrench className="h-[18px] w-[18px]" />, roles: ["super_admin", "service_manager", "repair_technician", "intake_technician", "accountant"] },
  { href: "/inventory", label: "انبار و قطعات", icon: <Boxes className="h-[18px] w-[18px]" />, roles: ["super_admin", "service_manager", "repair_technician", "intake_technician"] },
  { href: "/customers", label: "مشتریان (CRM)", icon: <UserCheck className="h-[18px] w-[18px]" />, roles: ["super_admin", "service_manager", "intake_technician", "accountant"] },
  { href: "/accounting", label: "حسابداری", icon: <Calculator className="h-[18px] w-[18px]" />, roles: ["accountant", "super_admin"] },
  { href: "/reports", label: "گزارش‌گیری", icon: <BarChart3 className="h-[18px] w-[18px]" />, roles: ["super_admin", "service_manager", "accountant", "intake_technician", "repair_technician"] },
  { href: "/users", label: "مدیریت کاربران", icon: <Users className="h-[18px] w-[18px]" />, roles: ["super_admin"] },
  { href: "/settings", label: "تنظیمات", icon: <SettingsIcon className="h-[18px] w-[18px]" />, roles: ["super_admin"] },
];

export type AppUser = {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  roleLabel: string;
};

type Settings = { companyName: string; logo: string; tagline: string; address: string; phone: string };

export type NotifItem = { id: number; title: string; message: string; read: boolean; deviceId: number | null; type: string };

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const timer = setTimeout(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("hamrah-theme", next);
    } catch {}
  };
  return { theme, toggle };
}

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [user, setUser] = useState<AppUser | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [counts, setCounts] = useState({ inbox: 0, approvals: 0 });
  const [toasts, setToasts] = useState<NotifItem[]>([]);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const toastsInitedRef = useRef(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setUser(d.user ?? null);
        setSettings(d.settings ?? null);
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadNotifs = () =>
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((d) => setNotifs(d.items ?? []))
        .catch(() => {});
    const loadCounts = () =>
      fetch("/api/me/counts")
        .then((r) => r.json())
        .then((d) => setCounts({ inbox: d.inbox ?? 0, approvals: d.approvals ?? 0 }))
        .catch(() => {});
    loadNotifs();
    loadCounts();
    const id = setInterval(() => {
      loadNotifs();
      loadCounts();
    }, 30000);
    return () => clearInterval(id);
  }, [user]);

  // Surface genuinely new unread notifications as floating toasts.
  useEffect(() => {
    if (notifs.length === 0) return;
    if (!toastsInitedRef.current) {
      // On first load, mark everything as already seen so we don't flood with toasts.
      toastsInitedRef.current = true;
      notifs.forEach((n) => seenIdsRef.current.add(n.id));
      return;
    }
    const fresh = notifs.filter((n) => !n.read && !seenIdsRef.current.has(n.id));
    if (fresh.length > 0) {
      fresh.forEach((n) => seenIdsRef.current.add(n.id));
      setToasts((prev) => [...prev, ...fresh].slice(-4));
    }
  }, [notifs]);

  // Auto-dismiss each toast after a few seconds.
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 7000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }

  const unread = notifs.filter((n) => !n.read).length;

  function logout() {
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      router.replace("/login");
      router.refresh();
    });
  }

  function markAllRead() {
    fetch("/api/notifications/read-all", { method: "POST" }).then(() =>
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
    );
  }

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600" />
      </div>
    );
  }

  const items = NAV.filter((n) => n.roles.includes(user.role));

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600">
          {settings?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo} alt="logo" className="h-full w-full object-cover" />
          ) : (
            <Wrench className="h-5 w-5 text-white" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-800 dark:text-white">
            {settings?.companyName || "خدمات پس از فروش"}
          </p>
          <p className="truncate text-[10px] text-slate-400">{settings?.tagline || "سامانه مدیریت تعمیرات"}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const badgeCount =
            item.href === "/inbox" ? counts.inbox : item.href === "/approvals" ? counts.approvals : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={classNames(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sky-600 text-white shadow-sm shadow-sky-700/30"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"
              )}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {badgeCount > 0 && (
                <span
                  className={classNames(
                    "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold text-white shadow-sm",
                    active ? "bg-white/25" : "bg-rose-500"
                  )}
                >
                  {toFa(badgeCount > 99 ? 99 : badgeCount)}
                  {badgeCount > 99 ? "+" : ""}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-border)] p-3">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-700 text-xs font-bold text-white">
            {user.fullName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-700 dark:text-slate-200">{user.fullName}</p>
            <p className="truncate text-[10px] text-slate-400">{user.roleLabel}</p>
          </div>
          <button onClick={logout} className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30" title="خروج">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 border-l border-[var(--color-border)] bg-[var(--color-surface)] lg:block">
        {SidebarInner}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-72 animate-fade-in-up border-l border-[var(--color-border)] bg-[var(--color-surface)]">
            <button onClick={() => setOpen(false)} className="absolute left-3 top-4 z-10 cursor-pointer rounded-lg p-1 text-slate-400">
              <X className="h-5 w-5" />
            </button>
            {SidebarInner}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pr-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 backdrop-blur-md">
          <button onClick={() => setOpen(true)} className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800">
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {items.find((i) => (i.href === "/" ? pathname === "/" : pathname.startsWith(i.href)))?.label ?? "داشبورد"}
            </h2>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifOpen((o) => !o);
                if (!notifOpen && unread > 0) markAllRead();
              }}
              className="relative cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="اعلان‌ها"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {unread > 9 ? "۹+" : unread}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute left-0 mt-2 w-80 animate-fade-in-up overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
                <div className="border-b border-[var(--color-border)] px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                  اعلان‌های شما
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifs.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-slate-400">اعلانی وجود ندارد</p>
                  ) : (
                    notifs.slice(0, 12).map((n) => (
                      <Link
                        key={n.id}
                        href={n.deviceId ? `/devices/${n.deviceId}` : "#"}
                        onClick={() => setNotifOpen(false)}
                        className="block border-b border-[var(--color-border)] px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{n.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-400">{n.message}</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="تغییر تم"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex cursor-pointer items-center gap-2 rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-700 text-xs font-bold text-white">
                {user.fullName.charAt(0)}
              </div>
            </button>
            {menuOpen && (
              <div className="absolute left-0 mt-2 w-48 animate-fade-in-up overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
                <div className="border-b border-[var(--color-border)] px-4 py-2.5">
                  <p className="truncate text-xs font-bold text-slate-700 dark:text-slate-200">{user.fullName}</p>
                  <p className="truncate text-[10px] text-slate-400">{user.roleLabel}</p>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  <LogOut className="h-4 w-4" /> خروج از حساب
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>

        <footer className="mx-auto max-w-7xl px-6 pb-8 pt-2 text-center text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> سامانه خدمات پس از فروش — راه‌اندازی شده روی سرور محلی شما
          </span>
        </footer>
      </div>

      {/* Floating toast alert (bottom-left corner) */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 left-4 z-50 flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="animate-fade-in-up overflow-hidden rounded-xl border border-sky-200 bg-white shadow-2xl dark:border-sky-900/60 dark:bg-slate-900"
            >
              <div className="flex items-start gap-3 p-3.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white">
                  <BellRing className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{t.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">{t.message}</p>
                  {t.deviceId && (
                    <Link
                      href={`/devices/${t.deviceId}`}
                      onClick={() => dismissToast(t.id)}
                      className="mt-1 inline-block text-[11px] font-semibold text-sky-600 hover:underline dark:text-sky-400"
                    >
                      مشاهده دستگاه ←
                    </Link>
                  )}
                </div>
                <button
                  onClick={() => dismissToast(t.id)}
                  className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  title="بستن"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="h-0.5 w-full bg-sky-100 dark:bg-sky-900/40">
                <div className="h-full bg-sky-500 animate-toast-progress" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
