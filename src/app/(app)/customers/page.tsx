"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Input, Spinner, EmptyState, StatCard } from "@/components/ui";
import { toFa, formatNumber } from "@/lib/format";
import { UserCheck, Search, Phone, MapPin, Wrench, ArrowLeft, Users } from "lucide-react";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      const res = await fetch(`/api/customers?${p.toString()}`).then((r) => r.json());
      setItems(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadCustomers, 0);
    return () => clearTimeout(timer);
  }, [search]);

  const totalDevicesAll = items.reduce((sum, c) => sum + (Number(c.deviceCount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-slate-800 dark:text-white">
            <UserCheck className="h-6 w-6 text-emerald-600" /> مدیریت مشتریان (CRM)
          </h1>
          <p className="mt-1 text-xs text-slate-500">مشاهده لیست مشتریان، جستجوی سریع و پرونده ۳۶۰ درجه سوابق تعمیراتی</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو نام مشتری، شماره موبایل، کد ملی..."
            className="w-full pl-9 pr-3 text-xs"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="تعداد کل مشتریان ثبت‌شده" value={formatNumber(items.length)} accent="emerald" icon={<Users className="h-5 w-5" />} />
        <StatCard label="مجموع دستگاه‌های پذیرش‌شده" value={formatNumber(totalDevicesAll)} accent="sky" icon={<Wrench className="h-5 w-5" />} />
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="grid place-items-center py-24">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="مشتری یافت نشد" hint="مشتریان هنگام ثبت پذیرش دستگاه جدید به صورت خودکار در سیستم ثبت می‌شوند." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Card key={c.id} className="flex flex-col justify-between p-5 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-800 dark:text-white">{c.name}</h3>
                    {c.nationalId && <p className="mt-0.5 font-mono text-xs text-slate-400">کد ملی: {toFa(c.nationalId)}</p>}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <Wrench className="h-3.5 w-3.5" /> {formatNumber(c.deviceCount || 0)} دستگاه
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{toFa(c.phone)}</span>
                    {c.phone2 && <span className="font-mono text-slate-400">({toFa(c.phone2)})</span>}
                  </div>
                  {c.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                      <span className="line-clamp-2">{c.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Link href={`/customers/${c.id}`}>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs">
                    مشاهده پرونده ۳۶۰ درجه <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
