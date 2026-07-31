"use client";

import { use, useEffect, useState } from "react";
import { Button, Spinner } from "@/components/ui";
import { toFa, formatNumber, formatMoney, formatDateTime } from "@/lib/format";
import { STATUS_LABELS, WARRANTY_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/db/schema";
import { Printer, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { TicketBarcode, TicketQrCode } from "@/components/qr-barcode";

function InvoiceCopyView({
  copyLabel,
  d,
  cfg,
  company,
  approvedParts,
  partCostTotal,
  laborCost,
  discount,
  tax,
  deposit,
  subtotal,
  grandTotal,
  finalPayable,
  paymentMethodLabel,
}: {
  copyLabel: string;
  d: any;
  cfg: any;
  company: string;
  approvedParts: any[];
  partCostTotal: number;
  laborCost: number;
  discount: number;
  tax: number;
  deposit: number;
  subtotal: number;
  grandTotal: number;
  finalPayable: number;
  paymentMethodLabel: string;
}) {
  return (
    <div className="print-area mb-6 break-after-page border-2 border-slate-800 bg-white p-6 text-slate-900 shadow-sm" style={{ width: "100%" }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          {cfg.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cfg.logo} alt="logo" className="h-16 w-16 object-contain" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-xl bg-slate-800 text-white text-xl font-bold">H</div>
          )}
          <div>
            <h1 className="text-xl font-extrabold">{company}</h1>
            <p className="text-xs text-slate-600">{cfg.tagline || "سامانه خدمات پس از فروش و تعمیرات"}</p>
            <p className="text-xs text-slate-600">
              تلفن: <span className="font-mono">{toFa(cfg.phone || "—")}</span> {cfg.address ? `• ${cfg.address}` : ""}
            </p>
          </div>
        </div>
        <div className="text-center">
          <p className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-bold text-white">صورت‌حساب نهایی خدمات و قطعات</p>
          <p className="mt-1 text-xs text-slate-500 font-bold">{copyLabel}</p>
        </div>
      </div>

      {/* Ticket info banner */}
      <div className="my-4 flex flex-wrap items-center justify-between rounded-lg bg-slate-100 px-4 py-3">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs text-slate-500">شماره رسید: </span>
            <span className="font-mono text-xl font-extrabold tracking-wider text-slate-900">{toFa(d.ticketNumber)}</span>
          </div>
          <div className="border-r border-slate-300 pr-4">
            <span className="text-xs text-slate-500">وضعیت: </span>
            <span className="font-bold text-slate-800">{STATUS_LABELS[d.status] || d.status}</span>
          </div>
        </div>
        <div className="flex flex-col text-left text-xs text-slate-600">
          <span>تاریخ پذیرش: {formatDateTime(d.intakeDate)}</span>
          {d.deliveryDate && <span>تاریخ تحویل: {formatDateTime(d.deliveryDate)}</span>}
        </div>
      </div>

      {/* Customer & Device details */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs border-b border-slate-300 pb-4">
        <Row k="نام مشتری" v={d.customerName} />
        <Row k="شماره تماس" v={toFa(d.customerPhone)} />
        {d.customerNationalId && <Row k="کد ملی" v={toFa(d.customerNationalId)} />}
        {d.customerAddress && <Row k="آدرس مشتری" v={d.customerAddress} />}
        <Row k="نوع دستگاه / برند" v={[d.deviceType, d.brand].filter(Boolean).join(" - ")} />
        <Row k="مدل دستگاه" v={d.model} />
        {d.serialNumber && <Row k="شماره سریال / IMEI" v={d.serialNumber} />}
        <Row k="شرح مشکل اولیه" v={d.problem} />
        {d.operationsDone && <Row k="عملیات انجام‌شده" v={d.operationsDone} />}
      </div>

      {/* Warranty box */}
      {(d.warrantyStatus || (d.warrantyDays && d.warrantyDays > 0)) && (
        <div className="my-3 flex items-center justify-between rounded border border-emerald-300 bg-emerald-50/70 p-2.5 text-xs text-emerald-900">
          <div className="flex items-center gap-2 font-bold">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <span>ضمانت خدمات تعمیر: {WARRANTY_STATUS_LABELS[d.warrantyStatus || "out_of_warranty"] || "—"}</span>
          </div>
          {d.warrantyDays > 0 && <span className="font-mono font-extrabold">{formatNumber(d.warrantyDays)} روز گارانتی تعمیر</span>}
        </div>
      )}

      {/* Itemized Parts Table */}
      <div className="my-4">
        <h3 className="mb-2 text-xs font-extrabold text-slate-800">ریز قطعات مصرفی و خدمات فنی</h3>
        <table className="w-full text-right text-xs border-collapse">
          <thead>
            <tr className="border-y-2 border-slate-800 bg-slate-50 font-bold">
              <th className="py-2 px-3">شرح خدمت / نام قطعه</th>
              <th className="py-2 px-3">مدل / توضیحات</th>
              <th className="py-2 px-3 text-left">مبلغ (ریال)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {/* Labor row */}
            <tr>
              <td className="py-2 px-3 font-bold">اجرت تعمیرات و خدمات فنی تخصصی</td>
              <td className="py-2 px-3 text-slate-500">{d.operationsDone || "خدمات عیب‌یابی و رفع عیب"}</td>
              <td className="py-2 px-3 text-left font-mono font-bold">{formatMoney(laborCost)}</td>
            </tr>
            {/* Parts rows */}
            {approvedParts.map((p: any) => (
              <tr key={p.id}>
                <td className="py-2 px-3">{p.partName}</td>
                <td className="py-2 px-3 text-slate-500">{p.partModel || "قطعه تعویضی"}</td>
                <td className="py-2 px-3 text-left font-mono">{formatMoney(p.partPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial totals breakdown */}
      <div className="mt-4 flex justify-end border-t border-slate-300 pt-3">
        <div className="w-80 space-y-1.5 text-xs">
          <Row k="جمع هزینه قطعات مصرفی:" v={formatMoney(partCostTotal)} />
          <Row k="اجرت تعمیر و خدمات فنی:" v={formatMoney(laborCost)} />
          <Row k="جمع کل خدمات و قطعات:" v={formatMoney(subtotal)} />
          {discount > 0 && <Row k="تخفیف:" v={formatMoney(discount)} />}
          {tax > 0 && <Row k="مالیات بر ارزش افزوده:" v={formatMoney(tax)} />}
          {deposit > 0 && <Row k="کسر پیش‌پرداخت / بیعانه:" v={formatMoney(deposit)} />}
          <div className="my-1 border-t-2 border-slate-800" />
          <div className="flex justify-between font-bold text-sm">
            <span>مبلغ نهایی پرداخت‌شده / قابل پرداخت:</span>
            <span className="font-mono">{formatMoney(finalPayable || grandTotal)}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-600 pt-1">
            <span>روش تسویه:</span>
            <span className="font-bold">{paymentMethodLabel}</span>
          </div>
        </div>
      </div>

      {/* Barcode / QR & Terms footer */}
      <div className="mt-6 flex flex-wrap items-center justify-between border-t border-slate-300 pt-4">
        <div className="flex items-center gap-4">
          <TicketQrCode value={d.ticketNumber} size={64} />
          <TicketBarcode value={d.ticketNumber} height={36} />
        </div>

        <div className="max-w-xs text-[11px] text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">قوانین و ضمانت‌نامه صورت‌حساب:</p>
          <p>
            {cfg.invoiceFooterTerms ||
              "ضمانت تعمیر تنها شامل قطعات تعویضی و اجرت کار انجام‌گرفته در این صورت‌حساب بوده و خسارات ناشی از ضربه، آب‌خوردگی یا نوسان برق خارج از گارانتی است."}
          </p>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-8 grid grid-cols-2 gap-8 pt-4 text-center text-xs">
        <div className="border-t border-slate-400 pt-2">
          <p className="font-bold">مهر و امضای کارشناس / مرکز خدمات</p>
        </div>
        <div className="border-t border-slate-400 pt-2">
          <p className="font-bold">امضا و تایید سلامت تحویل توسط مشتری</p>
        </div>
      </div>
    </div>
  );
}

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
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

  if (loading || !d) {
    return (
      <div className="grid place-items-center py-32">
        <Spinner />
      </div>
    );
  }

  const company = cfg.companyName || "مرکز خدمات پس از فروش";
  const acc = d.accounting || {};
  const approvedParts = (d.parts || []).filter((p: any) => p.status === "approved");

  // Calculations
  const partCostTotal = approvedParts.reduce((s: number, p: any) => s + Number(p.partPrice || 0), 0) || Number(acc.partCost || 0);
  const receivedAmount = Number(acc.receivedAmount || d.finalCost || d.estimatedCost || 0);
  const laborCost = Number(acc.laborCost ?? Math.max(0, receivedAmount - partCostTotal));
  const discount = Number(acc.discount || 0);
  const tax = Number(acc.tax || 0);
  const deposit = Number(acc.deposit ?? d.deposit ?? 0);
  const subtotal = laborCost + partCostTotal;
  const grandTotal = Math.max(0, subtotal + tax - discount);
  const finalPayable = Number(acc.finalPayable ?? Math.max(0, grandTotal - deposit));
  const paymentMethodLabel = PAYMENT_METHOD_LABELS[acc.paymentMethod || "cash"] || "نقدی";

  return (
    <div className="mx-auto max-w-3xl">
      {/* Top action bar */}
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/devices/${d.id}`} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-sky-600">
          <ArrowRight className="h-3.5 w-3.5" /> بازگشت به پرونده دستگاه
        </Link>
        <div className="flex items-center gap-2">
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> چاپ فاکتور (Ctrl + P)
          </Button>
        </div>
      </div>

      {/* Two copies for print */}
      <InvoiceCopyView
        copyLabel="نسخه مشتری"
        d={d}
        cfg={cfg}
        company={company}
        approvedParts={approvedParts}
        partCostTotal={partCostTotal}
        laborCost={laborCost}
        discount={discount}
        tax={tax}
        deposit={deposit}
        subtotal={subtotal}
        grandTotal={grandTotal}
        finalPayable={finalPayable}
        paymentMethodLabel={paymentMethodLabel}
      />
      <div className="print-page-break" />
      <InvoiceCopyView
        copyLabel="نسخه حسابداری / بایگانی"
        d={d}
        cfg={cfg}
        company={company}
        approvedParts={approvedParts}
        partCostTotal={partCostTotal}
        laborCost={laborCost}
        discount={discount}
        tax={tax}
        deposit={deposit}
        subtotal={subtotal}
        grandTotal={grandTotal}
        finalPayable={finalPayable}
        paymentMethodLabel={paymentMethodLabel}
      />
    </div>
  );
}

function Row({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-slate-500">{k}</span>
      <span className="font-bold text-slate-800">{v}</span>
    </div>
  );
}
