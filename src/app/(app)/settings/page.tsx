"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, Button, Input, Field, Spinner } from "@/components/ui";
import { api } from "@/lib/client";
import { Settings as SettingsIcon, Upload, Save, Image as ImageIcon, Wrench } from "lucide-react";

export default function SettingsPage() {
  const [form, setForm] = useState({ companyName: "", tagline: "", address: "", phone: "", logo: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      setForm({ companyName: d.companyName || "", tagline: d.tagline || "", address: d.address || "", phone: d.phone || "", logo: d.logo || "" });
      setLoading(false);
    });
  }, []);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 600 * 1024) {
      setError("حجم لوگو باید کمتر از ۶۰۰ کیلوبایت باشد");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, logo: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      await api("/api/settings", "PUT", form);
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="grid place-items-center py-32"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-extrabold text-slate-800 dark:text-white">
          <SettingsIcon className="h-5 w-5 text-sky-600" /> تنظیمات سامانه
        </h1>
        <p className="mt-1 text-xs text-slate-500">اطلاعات شرکت و لوگو (در رسید و گزارش‌ها استفاده می‌شود)</p>
      </div>

      <Card>
        <CardHeader title="لوگوی شرکت" subtitle="در رسید مشتری و داشبورد نمایش داده می‌شود" />
        <div className="flex flex-col items-center gap-4 p-5 sm:flex-row">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[var(--color-border)] bg-slate-50 dark:bg-slate-800">
            {form.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logo} alt="logo" className="h-full w-full object-contain p-1" />
            ) : (
              <Wrench className="h-8 w-8 text-slate-300" />
            )}
          </div>
          <div className="flex-1">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={onFile} />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> انتخاب فایل لوگو
            </Button>
            {form.logo && (
              <Button variant="ghost" size="sm" className="mr-2" onClick={() => setForm({ ...form, logo: "" })}>
                حذف لوگو
              </Button>
            )}
            <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
              <ImageIcon className="h-3 w-3" /> PNG / JPG / SVG تا ۶۰۰KB
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="اطلاعات شرکت" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="نام شرکت / مرکز">
            <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="مرکز خدمات پس از فروش" />
          </Field>
          <Field label="شعار / توضیح کوتاه">
            <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
          </Field>
          <Field label="تلفن">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" />
          </Field>
          <Field label="آدرس">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] px-5 py-3">
          {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
          {done && <span className="text-xs font-medium text-emerald-600">✓ ذخیره شد</span>}
          <Button loading={saving} onClick={save}>
            <Save className="h-4 w-4" /> ذخیره تنظیمات
          </Button>
        </div>
      </Card>
    </div>
  );
}
