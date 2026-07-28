"use client";

import { useEffect, useState } from "react";
import { Card, Spinner, Input, Select, Button, Field } from "@/components/ui";
import DeviceTable, { type DeviceRow } from "@/components/device-table";
import { STATUS_LABELS, DEVICE_TYPES } from "@/db/schema";
import { exportToExcel } from "@/lib/client";
import { Search, Download, Wrench, Filter } from "lucide-react";

export default function DevicesListPage() {
  const [items, setItems] = useState<DeviceRow[]>([]);
  const [techs, setTechs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [repairId, setRepairId] = useState("all");
  const [deviceType, setDeviceType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (status !== "all") p.set("status", status);
    if (repairId !== "all") p.set("repairTechnicianId", repairId);
    if (deviceType !== "all") p.set("deviceType", deviceType);
    if (dateFrom) p.set("dateFrom", dateFrom);
    if (dateTo) p.set("dateTo", dateTo);
    fetch(`/api/devices?${p.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
        setTechs(d.repairTechs || []);
      })
      .finally(() => setLoading(false));
  }, [search, status, repairId, deviceType, dateFrom, dateTo]);

  function doExport() {
    const rows = items.map((d) => ({
      "رسید": d.ticketNumber,
      "نوع دستگاه": d.deviceType,
      "برند/مدل": [d.brand, d.model].filter(Boolean).join(" "),
      "مشتری": d.customerName || "",
      "تلفن": d.customerPhone || "",
      "کارشناس تعمیر": d.repairTechName || "",
      "کارشناس پذیرش": d.intakeTechName || "",
      "تاریخ پذیرش": d.intakeDate ? new Date(d.intakeDate).toLocaleDateString("fa-IR") : "",
      "وضعیت": STATUS_LABELS[d.status] || d.status,
    }));
    exportToExcel(rows, "ليست-دستگاه‌ها", "دستگاه‌ها");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-extrabold text-slate-800 dark:text-white">
            <Wrench className="h-5 w-5 text-sky-600" /> لیست دستگاه‌ها
          </h1>
          <p className="mt-1 text-xs text-slate-500">جستجو، فیلتر و مشاهده تمام دستگاه‌های پذیرش‌شده</p>
        </div>
        <Button variant="outline" size="sm" onClick={doExport}>
          <Download className="h-4 w-4" /> خروجی اکسل
        </Button>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Filter className="h-3.5 w-3.5" /> فیلترها
        </div>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Field label="جستجو (رسید، مدل، مشتری)">
              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" placeholder="جستجو..." />
              </div>
            </Field>
          </div>
          <Field label="وضعیت">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">همه وضعیت‌ها</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
          <Field label="کارشناس تعمیر">
            <Select value={repairId} onChange={(e) => setRepairId(e.target.value)}>
              <option value="all">همه</option>
              {techs.map((t) => (
                <option key={t.id} value={t.id}>{t.fullName}</option>
              ))}
            </Select>
          </Field>
          <Field label="نوع دستگاه">
            <Select value={deviceType} onChange={(e) => setDeviceType(e.target.value)}>
              <option value="all">همه</option>
              {DEVICE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="از تاریخ">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </Field>
          <Field label="تا تاریخ">
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="grid place-items-center py-20">
            <Spinner />
          </div>
        ) : (
          <DeviceTable items={items} />
        )}
      </Card>
    </div>
  );
}
