"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Field } from "@/components/ui";
import { Headset, Lock, User, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "ورود ناموفق بود");
        setLoading(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("خطا در اتصال به سرور");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 px-4">
      {/* background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sky-600/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-900/40">
            <Headset className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">سامانه خدمات پس از فروش</h1>
          <p className="mt-1 text-sm text-slate-400">مدیریت پذیرش، تعمیر، قطعات و گزارش‌گیری</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">نام کاربری</label>
              <div className="relative">
                <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="نام کاربری خود را وارد کنید"
                  className="bg-white/5 pr-9 text-white placeholder:text-slate-500"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">رمز عبور</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور"
                  className="bg-white/5 px-9 text-white placeholder:text-slate-500"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-200"
                  aria-label="نمایش رمز"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full">
              ورود به سامانه
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-500">
          © {new Date().toLocaleDateString("fa-IR", { year: "numeric" })} — تمامی حقوق محفوظ است
        </p>
      </div>
    </div>
  );
}
