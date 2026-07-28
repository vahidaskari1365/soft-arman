"use client";

import { use, useEffect, useState } from "react";
import { Button, Spinner } from "@/components/ui";
import { toFa, formatMoney, formatDateTime } from "@/lib/format";
import { STATUS_LABELS } from "@/db/schema";
import { Printer, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [d, setD] = useState<any>(null);
  const [cfg, setCfg] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/devices/${id}`).then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([dev, c]) => {
      setD(dev);
      setCfg(c);
      setLoading(false);
    });
  }, [id]);

  if (loading || !d) return <div className="grid place-items-center py-32"><Spinner /></div>;

  const company = cfg.companyName || "مرکز خدمات پس از فروش";

  const Receipt = ({ copyLabel }: { copyLabel: string }) => (
    <div className="print-area mb-4 break-after-page border-2 border-slate-800 bg-white p-5 text-slate-900" style={{ width: "100%" }}>
      {/* header */}
      <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          {cfg.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cfg.logo} alt="logo" className="h-14 w-14 object-contain" />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-slate-800 text-white text-lg font-bold">H</div>
          )}
          <div>
            <h1 className="text-lg font-extrabold">{company}</h1>
            <p className="text-[11px] text-slate-600">{cfg.tagline || "سامانه مدیریت تعمیرات و قطعات"}</p>
            <p className="text-[11px] text-slate-600">تلفن: {toFa(cfg.phone || "—")} {cfg.address ? `• ${cfg.address}` : ""}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-bold text-white">رسید پذیرش دستگاه</p>
          <p className="mt-1 text-[11px] text-slate-500">{copyLabel}</p>
        </div>
      </div>

      {/* ticket */}
      <div className="my-3 flex items-center justify-between rounded-lg bg-slate-100 px-4 py-2">
        <div>
          <span className="text-[11px] text-slate-500">شماره رسید: </span>
          <span className="font-mono text-lg font-extrabold tracking-wider">{toFa(d.ticketNumber)}</span>
        </div>
        <div className="text-[11px] text-slate-600">تاریخ پذیرش: {formatDateTime(d.intakeDate)}</div>
      </div>

      {/* info grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12px]">
        <Row k="نام مشتری" v={d.customerName} />
        <Row k="شماره تماس" v={toFa(d.customerPhone)} />
        <Row k="تلفن ثانوی" v={d.customerPhone2 ? toFa(d.customerPhone2) : "—"} />
        <Row k="کد ملی" v={d.customerNationalId ? toFa(d.customerNationalId) : "—"} />
        <Row k="نوع دستگاه" v={d.deviceType} />
        <Row k="برند / مدل" v={[d.brand, d.model].filter(Boolean).join(" - ")} />
        <Row k="متععلقات" v={d.accessories || "—"} />
        <Row k="وضعیت" v={STATUS_LABELS[d.status] || d.status} />
        <div className="col-span-2">
          <Row k="شرح مشکل" v={d.problem} />
        </div>
        <Row k="کارشناس تعمیر" v={d.repairTechName || "—"} />
        <Row k="هزینه تخمینی" v={formatMoney(d.estimatedCost)} />
      </div>

      {d.customerAddress && (
        <div className="mt-1.5 text-[12px]"><span className="text-slate-500">آدرس: </span>{d.customerAddress}</div>
      )}

      {/* signatures */}
      <div className="mt-6 flex items-end justify-between text-[11px] text-slate-600">
        <div className="w-40 border-t border-slate-500 pt-1 text-center">امضا و اثر انگشت مشتری</div>
        <div className="text-center text-[10px] text-slate-400">
          این رسید جهت تحویل دستگاه ارائه شود.<br />تجهیزات امانی تا ۳۰ روز پس از اتمام تعمیر نگهداری می‌شود.
        </div>
        <div className="w-40 border-t border-slate-500 pt-1 text-center">امضا و مهر مرکز</div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href={`/devices/${d.id}`} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-sky-600">
          <ArrowRight className="h-3.5 w-3.5" /> بازگشت به دستگاه
        </Link>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> چاپ رسید (۲ نسخه - A5)
        </Button>
      </div>
      <Receipt copyLabel="نسخه مشتری" />
      <Receipt copyLabel="نسخه مرکز" />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-1">
      <span className="text-slate-500">{k}:</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}
