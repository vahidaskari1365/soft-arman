"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, Button, Input, Field, Badge, Spinner, EmptyState, Modal, StatCard } from "@/components/ui";
import { formatMoney, toFa, formatNumber, statusColor, formatDate } from "@/lib/format";
import { STATUS_LABELS } from "@/db/schema";
import { api } from "@/lib/client";
import {
  UserCheck,
  Phone,
  MapPin,
  Wrench,
  ArrowRight,
  Edit3,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
} from "lucide-react";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Customer Form
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", phone2: "", address: "", nationalId: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${id}`).then((r) => r.json());
      setData(res);
      if (res.customer) {
        setForm({
          name: res.customer.name || "",
          phone: res.customer.phone || "",
          phone2: res.customer.phone2 || "",
          address: res.customer.address || "",
          nationalId: res.customer.nationalId || "",
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadProfile, 0);
    return () => clearTimeout(timer);
  }, [id]);

  const saveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      setError("نام و شماره تماس الزامی است");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api(`/api/customers/${id}`, "PATCH", form);
      setModalOpen(false);
      await loadProfile();
    } catch (err: any) {
      setError(err.message || "خطا در ویرایش اطلاعات مشتری");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="grid place-items-center py-32">
        <Spinner />
      </div>
    );
  }

  const { customer: c, devices: devList, summary } = data;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/customers" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-sky-600">
        <ArrowRight className="h-3.5 w-3.5" /> بازگشت به لیست مشتریان
      </Link>

      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">{c.name}</h1>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                پرونده ۳۶۰ درجه مشتری
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-mono">
                <Phone className="h-4 w-4 text-slate-400" />
                تلفن اصلی: <strong className="text-slate-700 dark:text-slate-300">{toFa(c.phone)}</strong>
              </span>
              {c.phone2 && (
                <span className="flex items-center gap-1 font-mono">
                  تلفن دوم: <strong className="text-slate-700 dark:text-slate-300">{toFa(c.phone2)}</strong>
                </span>
              )}
              {c.nationalId && (
                <span className="flex items-center gap-1 font-mono">
                  کد ملی: <strong className="text-slate-700 dark:text-slate-300">{toFa(c.nationalId)}</strong>
                </span>
              )}
            </div>
            {c.address && (
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                {c.address}
              </p>
            )}
          </div>
          <Button onClick={() => setModalOpen(true)} variant="outline" size="sm">
            <Edit3 className="h-4 w-4" /> ویرایش اطلاعات مشتری
          </Button>
        </div>
      </Card>

      {/* Financial & Statistics Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="تعداد کل دستگاه‌های پذیرش‌شده" value={formatNumber(summary.totalDevices)} accent="sky" icon={<Wrench className="h-5 w-5" />} />
        <StatCard label="مجموع مبالغ دریافتی از مشتری" value={formatMoney(summary.totalReceived)} accent="emerald" icon={<DollarSign className="h-5 w-5" />} />
        <StatCard label="مجموع بیعانه پرداختی" value={formatMoney(summary.totalDeposit)} accent="violet" icon={<Clock className="h-5 w-5" />} />
        <StatCard label="مجموع سود خالص از این مشتری" value={formatMoney(summary.totalProfit)} accent="amber" icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      {/* Devices History Table */}
      <Card>
        <CardHeader title="تاریخچه دستگاه‌های پذیرش‌شده" subtitle="تمامی دستگاه‌هایی که این مشتری تاکنون به مرکز تحویل داده است" />
        {devList.length === 0 ? (
          <div className="p-6">
            <EmptyState title="دستگاهی ثبت نشده است" hint="تاکنون دستگاهی برای این مشتری ثبت نشده است." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                <tr>
                  <th className="p-3">شماره رسید</th>
                  <th className="p-3">برند و مدل</th>
                  <th className="p-3">نوع دستگاه</th>
                  <th className="p-3">شرح مشکل</th>
                  <th className="p-3">وضعیت</th>
                  <th className="p-3">هزینه / دریافتی</th>
                  <th className="p-3">بیعانه</th>
                  <th className="p-3">تاریخ پذیرش</th>
                  <th className="p-3 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {devList.map((d: any) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-slate-800 dark:text-white">{toFa(d.ticketNumber)}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-white">{[d.brand, d.model].filter(Boolean).join(" • ")}</td>
                    <td className="p-3 text-slate-500">{d.deviceType}</td>
                    <td className="p-3 max-w-xs truncate text-slate-600 dark:text-slate-300">{d.problem}</td>
                    <td className="p-3">
                      <Badge className={statusColor(d.status)}>{STATUS_LABELS[d.status]}</Badge>
                    </td>
                    <td className="p-3 font-bold">{formatMoney(d.receivedAmount || d.finalCost || d.estimatedCost)}</td>
                    <td className="p-3 text-slate-500">{formatMoney(d.deposit)}</td>
                    <td className="p-3 text-slate-500">{d.intakeDate ? formatDate(d.intakeDate) : "—"}</td>
                    <td className="p-3 text-left">
                      <Link href={`/devices/${d.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          مشاهده پرونده دستگاه
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Customer Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="ویرایش اطلاعات مشتری">
        <form onSubmit={saveCustomer} className="space-y-4">
          {error && <div className="rounded-lg bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="نام و نام خانوادگی *" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="شماره موبایل *" required>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="font-mono" />
            </Field>
            <Field label="شماره موبایل دوم">
              <Input value={form.phone2} onChange={(e) => setForm({ ...form, phone2: e.target.value })} className="font-mono" />
            </Field>
            <Field label="کد ملی">
              <Input value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} className="font-mono" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="آدرس">
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" variant="primary" loading={busy}>
              ذخیره تغییرات
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
