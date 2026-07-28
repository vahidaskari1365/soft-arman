"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, Button, Input, Field, Select, Textarea } from "@/components/ui";
import { DEVICE_TYPES } from "@/db/schema";
import { api, useFetch } from "@/lib/client";
import { toFa } from "@/lib/format";
import { ClipboardList, Save, Printer, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function NewDevicePage() {
  const router = useRouter();
  const { data: techData } = useFetch<any>("/api/technicians");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ id: number; ticketNumber: string } | null>(null);

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
  });

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

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
            <Link href={`/receipt/${created.id}`}>
              <Button className="w-full">
                <Printer className="h-4 w-4" /> چاپ رسید (۲ نسخه A5)
              </Button>
            </Link>
            <Link href="/devices/new">
              <Button variant="outline" className="w-full" onClick={() => setCreated(null)}>
                پذیرش دستگاه جدید
              </Button>
            </Link>
            <Link href="/inbox">
              <Button variant="ghost" className="w-full">بازگشت به کارتابل</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-extrabold text-slate-800 dark:text-white">
          <ClipboardList className="h-5 w-5 text-sky-600" /> پذیرش دستگاه جدید
        </h1>
        <p className="mt-1 text-xs text-slate-500">اطلاعات مشتری و دستگاه را ثبت کنید.</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Card>
          <CardHeader title="اطلاعات مشتری" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="نام و نام خانوادگی" required>
              <Input value={form.customerName} onChange={(e) => set("customerName", e.target.value)} placeholder="مثلاً علی رضایی" required />
            </Field>
            <Field label="شماره تماس" required>
              <Input value={form.customerPhone} onChange={(e) => set("customerPhone", toFa(e.target.value))} placeholder="۰۹۱۲۳۴۵۶۷۸۹" inputMode="tel" required />
            </Field>
            <Field label="شماره تماس ثانوی">
              <Input value={form.customerPhone2} onChange={(e) => set("customerPhone2", toFa(e.target.value))} inputMode="tel" />
            </Field>
            <Field label="کد ملی">
              <Input value={form.nationalId} onChange={(e) => set("nationalId", toFa(e.target.value))} inputMode="numeric" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="آدرس">
                <Input value={form.customerAddress} onChange={(e) => set("customerAddress", e.target.value)} />
              </Field>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="اطلاعات دستگاه و عیب" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="نوع دستگاه" required>
              <Select value={form.deviceType} onChange={(e) => set("deviceType", e.target.value)}>
                {DEVICE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="برند">
              <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="مثلاً سامسونگ، اپل، سونی" />
            </Field>
            <Field label="مدل دستگاه" required>
              <Input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="مثلاً Galaxy A54" required />
            </Field>
            <Field label="متععلقات همراه دستگاه" hint="شارژر، قاب، گلس و...">
              <Input value={form.accessories} onChange={(e) => set("accessories", e.target.value)} />
            </Field>
            <Field label="شرح مشکل / عیب اعلامی" required>
              <Textarea value={form.problem} onChange={(e) => set("problem", e.target.value)} placeholder="شرح دقیق مشکل دستگاه" required />
            </Field>
            <Field label="هزینه تخمینی تعمیر (تومان)">
              <Input value={form.estimatedCost} onChange={(e) => set("estimatedCost", toFa(e.target.value))} inputMode="numeric" placeholder="۰" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="ارجاع به کارشناس تعمیر" required>
                <Select value={form.repairTechnicianId} onChange={(e) => set("repairTechnicianId", e.target.value)} required>
                  <option value="">— انتخاب کارشناس —</option>
                  {techData?.repair?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
        </Card>

        {error && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>انصراف</Button>
          <Button type="submit" loading={loading}>
            <Save className="h-4 w-4" /> ثبت پذیرش
          </Button>
        </div>
      </form>
    </div>
  );
}
