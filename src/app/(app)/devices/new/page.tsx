"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, Button, Input, Field, Select, Textarea, Badge, Modal } from "@/components/ui";
import ShamsiDatePicker from "@/components/shamsi-date-picker";
import { DEVICE_TYPES, WARRANTY_STATUS_LABELS, PHONE_BRANDS } from "@/db/schema";
import { api, useFetch } from "@/lib/client";
import { toFa, formatNumber, formatMoney, formatMoneyInput, parseMoneyInput, makeTicketNumber } from "@/lib/format";
import { ReceiptView } from "@/components/receipt-view";
import { ClipboardList, Save, Printer, CheckCircle2, Search, UserCheck, Phone, ShieldCheck, Clock, DollarSign, Key, Hash } from "lucide-react";
import Link from "next/link";

export default function NewDevicePage() {
  const router = useRouter();
  const { data: techData } = useFetch<any>("/api/technicians");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ id: number; ticketNumber: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((s) => setSettings(s)).catch(() => {});
  }, []);

  // Auto-complete customer search
  const [custQuery, setCustQuery] = useState("");
  const [custResults, setCustResults] = useState<any[]>([]);
  const [searchingCust, setSearchingCust] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerPhone2: "",
    customerAddress: "",
    nationalId: "",
    deviceType: DEVICE_TYPES[0],
    brand: "",
    model: "",
    accessories: "",
    problem: "",
    estimatedCost: "",
    repairTechnicianId: "",
    serialNumber: "",
    devicePassword: "",
    warrantyStatus: "out_of_warranty",
    warrantyDays: "0",
    deadlineDate: "",
    deliveryType: "in_person",
    deposit: "",
    notes: "",
  });

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Search existing customers
  useEffect(() => {
    if (!custQuery || custQuery.trim().length < 3) {
      const timer = setTimeout(() => setCustResults([]), 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(async () => {
      setSearchingCust(true);
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(custQuery)}`).then((r) => r.json());
        setCustResults(res.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingCust(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [custQuery]);

  const selectCustomer = (c: any) => {
    setForm((f) => ({
      ...f,
      customerName: c.name || "",
      customerPhone: c.phone || "",
      customerPhone2: c.phone2 || "",
      customerAddress: c.address || "",
      nationalId: c.nationalId || "",
    }));
    setCustQuery("");
    setCustResults([]);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api("/api/devices", "POST", form);
      setCreated({ id: res.id, ticketNumber: res.ticketNumber });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">دستگاه با موفقیت پذیرش شد</h2>
          <p className="mt-1 text-sm text-slate-500">
            شماره رسید: <span className="font-mono font-bold text-sky-700">{toFa(created.ticketNumber)}</span>
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href={`/receipt/${created.id}?autoPrint=true`}>
              <Button className="w-full">
                <Printer className="h-4 w-4" /> چاپ رسید (۲ نسخه A5 لنداسکیپ)
              </Button>
            </Link>
            <Link href={`/receipt/${created.id}`}>
              <Button variant="outline" className="w-full">
                <Printer className="h-4 w-4" /> پیشنمایش رسید
              </Button>
            </Link>
            <Link href={`/invoice/${created.id}`}>
              <Button variant="outline" className="w-full">
                <Printer className="h-4 w-4" /> پیش‌نمایش فاکتور
              </Button>
            </Link>
            <Link href="/devices/new">
              <Button variant="outline" className="w-full" onClick={() => setCreated(null)}>
                پذیرش دستگاه جدید
              </Button>
            </Link>
            <Link href="/inbox">
              <Button variant="ghost" className="w-full">
                بازگشت به کارتابل
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-extrabold text-slate-800 dark:text-white">
          <ClipboardList className="h-5 w-5 text-sky-600" /> پذیرش دستگاه جدید
        </h1>
        <p className="mt-1 text-xs text-slate-500">اطلاعات مشتری، مشخصات فنی دستگاه، بیعانه و ضرب‌الاجل تحویل را ثبت کنید.</p>
      </div>

      {/* Auto-complete CRM search box */}
      <Card className="p-4 bg-slate-50/70 dark:bg-slate-900/40 border-slate-300 dark:border-slate-800">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-300">
            <UserCheck className="h-4 w-4 text-emerald-600" /> جستجوی مشتری قدیمی در CRM (تکمیل خودکار اطلاعات):
          </label>
          <div className="relative">
            <Input
              value={custQuery}
              onChange={(e) => setCustQuery(e.target.value)}
              placeholder="حداقل ۳ حرف از نام، شماره تماس یا کد ملی مشتری سابق را وارد کنید..."
              className="w-full pl-9 text-xs"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>
          {searchingCust && <p className="text-xs text-slate-400">در حال جستجوی مشتری...</p>}
          {custResults.length > 0 && (
            <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-md dark:border-slate-800 dark:bg-slate-900">
              {custResults.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCustomer(c)}
                  className="flex w-full items-center justify-between rounded p-2 text-right text-xs hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div>
                    <strong className="text-slate-800 dark:text-white">{c.name}</strong>
                    <span className="mr-2 font-mono text-slate-500">{toFa(c.phone)}</span>
                    {c.nationalId && <span className="mr-2 text-slate-400 font-mono">({toFa(c.nationalId)})</span>}
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    انتخاب مشتری ({formatNumber(c.deviceCount || 0)} سابقه)
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-lg bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>}

        <Card>
          <CardHeader title="اطلاعات مشتری" subtitle="اطلاعات هویتی و تماس دارنده دستگاه" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="نام و نام خانوادگی" required>
              <Input value={form.customerName} onChange={(e) => set("customerName", e.target.value)} placeholder="مثلاً علی رضایی" required />
            </Field>
            <Field label="شماره تماس" required>
              <Input
                value={form.customerPhone}
                onChange={(e) => set("customerPhone", toFa(e.target.value))}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                inputMode="tel"
                className="font-mono"
                required
              />
            </Field>
            <Field label="شماره تماس ثانوی">
              <Input
                value={form.customerPhone2}
                onChange={(e) => set("customerPhone2", toFa(e.target.value))}
                inputMode="tel"
                className="font-mono"
                placeholder="۰۲۱۰۰۰۰۰۰۰۰"
              />
            </Field>
            <Field label="کد ملی">
              <Input value={form.nationalId} onChange={(e) => set("nationalId", toFa(e.target.value))} inputMode="numeric" className="font-mono" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="آدرس">
                <Input value={form.customerAddress} onChange={(e) => set("customerAddress", e.target.value)} placeholder="تهران، ..." />
              </Field>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="اطلاعات دستگاه، عیب و سریال" subtitle="مشخصات سخت‌افزاری و شرح مشکل" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="مارک دستگاه">
              <Select value={form.brand} onChange={(e) => { set("brand", e.target.value); set("model", ""); }}>
                <option value="">انتخاب مارک دستگاه</option>
                {Object.keys(PHONE_BRANDS).map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
                <option value="سایر">سایر</option>
              </Select>
            </Field>
            <Field label="نوع دستگاه" required>
              <Select value={form.deviceType} onChange={(e) => set("deviceType", e.target.value)}>
                {DEVICE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="مدل دستگاه" required>
              <Input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="مدل دستگاه" required />
            </Field>
            <Field label="شماره سریال / IMEI" hint="جهت جلوگیری از تشابه دستگاه و پیگیری‌های حقوقی">
              <Input
                value={form.serialNumber}
                onChange={(e) => set("serialNumber", e.target.value)}
                placeholder="358900000000000"
                className="font-mono"
              />
            </Field>
            <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
              <Field label="عیب به اظهار مشتری" required>
                <Textarea value={form.problem} onChange={(e) => set("problem", e.target.value)} placeholder="عیب دستگاه را به نقل از مشتری وارد کنید..." required />
              </Field>
              <Field label="توضیحات">
                <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="توضیحات تکمیلی پذیرش..." />
              </Field>
            </div>
            <Field label="لوازم همراه" hint="شارژر، قاب، گلس، کارتن و...">
              <Input value={form.accessories} onChange={(e) => set("accessories", e.target.value)} placeholder="آداپتور و کابل اصلی" />
            </Field>
            <Field label="رمز عبور / الگو (Pattern/PIN) دستگاه" hint="جهت تست و بررسی توسط کارشناس تعمیر">
              <Input value={form.devicePassword} onChange={(e) => set("devicePassword", e.target.value)} placeholder="مثلاً 1234 یا علامت Z" />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="گارانتی، زمان تحویل (TAT) و امور مالی پذیرش" subtitle="شرایط مالی، بیعانه و تعیین مهلت تحویل" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="وضعیت گارانتی در زمان پذیرش">
              <Select value={form.warrantyStatus} onChange={(e) => set("warrantyStatus", e.target.value)}>
                {Object.entries(WARRANTY_STATUS_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </Select>
            </Field>
            <Field label="تعیین حدود زمان تعمیر" hint="مدت تقریبی انجام تعمیر را به روز وارد کنید">
              <Input type="number" value={form.warrantyDays} onChange={(e) => set("warrantyDays", e.target.value)} className="font-mono" />
            </Field>
            <Field label="نوع تحویل">
              <Select value={form.deliveryType} onChange={(e) => set("deliveryType", e.target.value)}>
                <option value="in_person">حضوری</option>
                <option value="shipping">ارسالی</option>
              </Select>
            </Field>
            <Field label="تاریخ تخمینی تحویل دستگاه" hint="تاریخ شمسی را بنویسید یا از تقویم انتخاب کنید">
              <ShamsiDatePicker
                value={form.deadlineDate}
                onChange={(v) => set("deadlineDate", v)}
                placeholder="۱۴۰۳/۰۵/۱۵"
              />
            </Field>
            <Field label="بیعانه / پیش‌پرداخت دریافتی (تومان)" hint="مبلغ پرداختی توسط مشتری هنگام ثبت پذیرش">
              <Input value={formatMoneyInput(form.deposit)} onChange={(e) => set("deposit", parseMoneyInput(e.target.value))} inputMode="numeric" placeholder="۰" className="font-mono" />
            </Field>
            <Field label="هزینه تخمینی تعمیر (تومان)">
              <Input value={formatMoneyInput(form.estimatedCost)} onChange={(e) => set("estimatedCost", parseMoneyInput(e.target.value))} inputMode="numeric" placeholder="۰" className="font-mono" />
            </Field>
            <Field label="ارجاع به کارشناس تعمیر" required>
              <Select value={form.repairTechnicianId} onChange={(e) => set("repairTechnicianId", e.target.value)} required>
                <option value="">— انتخاب کارشناس —</option>
                {techData?.repair?.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-2 flex-wrap">
          <Link href="/devices">
            <Button type="button" variant="outline">
              انصراف
            </Button>
          </Link>
          <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>
            <Printer className="h-4 w-4" /> پیشنمایش رسید
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            <Save className="h-4 w-4" /> ثبت پذیرش و صدور رسید
          </Button>
        </div>
      </form>

      {/* Receipt preview modal */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="پیشنمایش رسید" size="lg">
        <div className="receipt-preview-content space-y-4">
          <div className="flex justify-end gap-2 no-print">
            <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> چاپ رسید (۲ نسخه A5 لنداسکیپ)</Button>
          </div>
          {(() => {
            const company = settings.companyName || "مرکز خدمات پس از فروش";
            const repairTechName = techData?.repair?.find((t: any) => String(t.id) === String(form.repairTechnicianId))?.fullName || "—";
            const previewData = {
              ticketNumber: makeTicketNumber(0),
              intakeDate: new Date().toISOString(),
              customerName: form.customerName || "—",
              customerPhone: form.customerPhone || "—",
              customerPhone2: form.customerPhone2 || "",
              customerNationalId: form.nationalId || "",
              customerAddress: form.customerAddress || "",
              deviceType: form.deviceType,
              brand: form.brand,
              model: form.model,
              serialNumber: form.serialNumber || "",
              warrantyStatus: form.warrantyStatus === "out_of_warranty" ? "" : form.warrantyStatus,
              accessories: form.accessories || "",
              devicePassword: form.devicePassword || "",
              deliveryType: form.deliveryType,
              warrantyDays: Number(form.warrantyDays) || 0,
              status: "registered",
              problem: form.problem || "—",
              repairTechName: repairTechName,
              estimatedCost: form.estimatedCost || "0",
              deposit: form.deposit || "0",
              finalCost: form.estimatedCost || "0",
              deadlineDate: form.deadlineDate || "",
            };
            return (
              <>
                <ReceiptView copyLabel="نسخه مشتری" d={previewData} cfg={settings} company={company} />
                <ReceiptView copyLabel="نسخه مرکز" d={previewData} cfg={settings} company={company} />
              </>
            );
          })()}
        </div>
      </Modal>
    </div>
  );
}
