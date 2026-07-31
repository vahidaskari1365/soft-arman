"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, Button, Input, Field, Textarea, Spinner, Badge } from "@/components/ui";
import { api } from "@/lib/client";
import {
  Settings as SettingsIcon,
  Upload,
  Save,
  Image as ImageIcon,
  Wrench,
  Download,
  Database,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function SettingsPage() {
  const [form, setForm] = useState({
    companyName: "",
    tagline: "",
    address: "",
    phone: "",
    logo: "",
    receiptFooterTerms: "",
    invoiceFooterTerms: "",
    smsTemplateIntake: "",
    smsTemplateReady: "",
    smsTemplateDelivery: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const restoreFileRef = useRef<HTMLInputElement>(null);

  // Restore state
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setForm({
          companyName: d.companyName || "",
          tagline: d.tagline || "",
          address: d.address || "",
          phone: d.phone || "",
          logo: d.logo || "",
          receiptFooterTerms: d.receiptFooterTerms || "",
          invoiceFooterTerms: d.invoiceFooterTerms || "",
          smsTemplateIntake: d.smsTemplateIntake || "",
          smsTemplateReady: d.smsTemplateReady || "",
          smsTemplateDelivery: d.smsTemplateDelivery || "",
        });
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

  async function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("آیا از بازیابی اطلاعات از فایل پشتیبان اطمینان دارید؟ اطلاعات جدید جایگزین یا اضافه خواهند شد.")) {
      return;
    }
    setRestoring(true);
    setRestoreMsg("");
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await api("/api/settings/restore", "POST", json);
      setRestoreMsg(
        `بازیابی موفقیت‌آمیز! تنظیمات: ${res.restored?.settings || 0} — مشتریان: ${res.restored?.customers || 0} — اقلام انبار: ${res.restored?.inventoryItems || 0}`
      );
    } catch (err: any) {
      alert("خطا در بازیابی فایل پشتیبان: " + (err.message || "فایل نامعتبر است"));
    } finally {
      setRestoring(false);
      if (restoreFileRef.current) restoreFileRef.current.value = "";
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-32">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-extrabold text-slate-800 dark:text-white">
          <SettingsIcon className="h-5 w-5 text-sky-600" /> تنظیمات سامانه و پشتیبان‌گیری
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          مدیریت اطلاعات شرکت، متون قوانین چاپ در رسید و فاکتور نهایی، الگوهای پیامک و تهیه بکاپ
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}
      {done && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> تنظیمات با موفقیت ذخیره شد.
        </div>
      )}

      {/* Basic info card */}
      <Card>
        <CardHeader title="اطلاعات اصلی مرکز خدمات" subtitle="نام، آدرس و لوگوی شرکت که در سربرگ رسیدها و فاکتورها درج می‌شود" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="نام شرکت / مرکز">
            <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="مرکز خدمات پس از فروش" />
          </Field>
          <Field label="شعار / عنوان فرعی">
            <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="سامانه مدیریت تعمیرات و قطعات" />
          </Field>
          <Field label="شماره تلفن">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="۰۲۱-۱۲۳۴۵۶۷۸" className="font-mono" />
          </Field>
          <Field label="آدرس">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="تهران، خیابان..." />
          </Field>

          <div className="sm:col-span-2">
            <Field label="لوگو مرکز خدمات" hint="فرمت PNG یا JPG، ترجیحاً مربعی، حجم کمتر از ۶۰۰ کیلوبایت">
              <div className="flex flex-wrap items-center gap-4">
                {form.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logo} alt="logo" className="h-16 w-16 rounded-xl border object-contain p-1" />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Upload className="h-4 w-4" /> بارگذاری لوگو
                  </Button>
                  {form.logo && (
                    <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, logo: "" })}>
                      حذف لوگو
                    </Button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                </div>
              </div>
            </Field>
          </div>
        </div>
      </Card>

      {/* Print Terms & Rules Card */}
      <Card>
        <CardHeader title="متون قوانین و ضوابط چاپ‌شده در رسید و فاکتور" subtitle="شرایط ضمانت و قواعد نگهداری دستگاه در قسمت پایین فرم‌های چاپی" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="متن قوانین کف رسید پذیرش دستگاه">
            <Textarea
              rows={3}
              value={form.receiptFooterTerms}
              onChange={(e) => setForm({ ...form, receiptFooterTerms: e.target.value })}
              placeholder="این رسید جهت تحویل دستگاه ارائه شود. تجهیزات امانی تا ۳۰ روز پس از اتمام تعمیر نگهداری می‌شود..."
            />
          </Field>
          <Field label="متن قوانین و ضمانت‌نامه فاکتور نهایی">
            <Textarea
              rows={3}
              value={form.invoiceFooterTerms}
              onChange={(e) => setForm({ ...form, invoiceFooterTerms: e.target.value })}
              placeholder="ضمانت تعمیر تنها شامل قطعات تعویضی و اجرت کار انجام‌گرفته در این صورت‌حساب بوده و خسارات ناشی از ضربه یا آب‌خوردگی خارج از گارانتی است..."
            />
          </Field>
        </div>
      </Card>

      {/* SMS Templates Card */}
      <Card>
        <CardHeader title="الگوهای پیامک خودکار (SMS Templates)" subtitle="متن‌های اطلاع‌رسانی به مشتری هنگام تغییر وضعیت دستگاه" />
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <Field label="الگوی پیامک ثبت پذیرش">
            <Textarea
              rows={3}
              value={form.smsTemplateIntake}
              onChange={(e) => setForm({ ...form, smsTemplateIntake: e.target.value })}
              placeholder="مشتری گرامی، دستگاه شما با شماره رسید {ticketNumber} پذیرش شد. جهت پیگیری..."
            />
          </Field>
          <Field label="الگوی پیامک آماده‌سازی دستگاه">
            <Textarea
              rows={3}
              value={form.smsTemplateReady}
              onChange={(e) => setForm({ ...form, smsTemplateReady: e.target.value })}
              placeholder="مشتری گرامی، تعمیر دستگاه با رسید {ticketNumber} پایان یافت و آماده تحویل است..."
            />
          </Field>
          <Field label="الگوی پیامک تحویل و تشکر">
            <Textarea
              rows={3}
              value={form.smsTemplateDelivery}
              onChange={(e) => setForm({ ...form, smsTemplateDelivery: e.target.value })}
              placeholder="با تشکر از اعتماد شما؛ دستگاه {model} تحویل گردید. خدمات مرکز دارای ضمانت می‌باشد..."
            />
          </Field>
        </div>
      </Card>

      {/* Backup & Restore Card */}
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600" /> پشتیبان‌گیری و بازیابی پایگاه داده (Backup & Restore)
            </span>
          }
          subtitle="تهیه فایل خروجی کامل JSON از اطلاعات مشتریان، انبار، دستگاه‌ها و حسابداری جهت محافظت از داده‌ها"
        />
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/40">
            <div>
              <p className="font-bold text-slate-800 dark:text-white">دانلود فایل پشتیبان کامل</p>
              <p className="text-xs text-slate-500">تمامی رکوردهای سیستم در قالب یک فایل استاندارد JSON دانلود می‌شود.</p>
            </div>
            <a href="/api/settings/backup" download>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" /> دانلود فایل پشتیبان (JSON Backup)
              </Button>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
            <div>
              <p className="font-bold text-slate-800 dark:text-white">بازیابی اطلاعات از فایل پشتیبان</p>
              <p className="text-xs text-slate-500">فایل JSON بکاپ قبلی را انتخاب کنید تا اطلاعات مشتریان، انبار و تنظیمات بازیابی شود.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => restoreFileRef.current?.click()} loading={restoring}>
                <Upload className="h-4 w-4" /> آپلود و بازیابی فایل پشتیبان
              </Button>
              <input ref={restoreFileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleRestoreFile} />
            </div>
          </div>

          {restoreMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> {restoreMsg}
            </div>
          )}
        </div>
      </Card>

      <div className="flex justify-end pt-2">
        <Button onClick={save} variant="primary" loading={saving}>
          <Save className="h-4 w-4" /> ذخیره تمامی تنظیمات
        </Button>
      </div>
    </div>
  );
}
