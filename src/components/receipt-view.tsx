"use client";

import { toFa, formatMoney, formatDateTime, formatShortDate } from "@/lib/format";
import { STATUS_LABELS, WARRANTY_STATUS_LABELS } from "@/db/schema";
import { TicketBarcode, TicketQrCode } from "@/components/qr-barcode";

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-1">
      <span className="text-slate-500">{k}:</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}

export function ReceiptView({ copyLabel, d, cfg, company }: { copyLabel: string; d: any; cfg: any; company: string }) {
  return (
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
          <p className="mt-1 text-[11px] text-slate-500 font-bold">{copyLabel}</p>
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
        {d.serialNumber && <Row k="شماره سریال / IMEI" v={d.serialNumber} />}
        {d.warrantyStatus && <Row k="وضعیت گارانتی" v={WARRANTY_STATUS_LABELS[d.warrantyStatus] || "—"} />}
        <Row k="متعلقات" v={d.accessories || "—"} />
        <Row k="وضعیت" v={STATUS_LABELS[d.status] || d.status} />
        <div className="col-span-2">
          <Row k="شرح مشکل" v={d.problem} />
        </div>
        <Row k="کارشناس تعمیر" v={d.repairTechName || "—"} />
        <Row k="هزینه تخمینی" v={formatMoney(d.estimatedCost)} />
        {Number(d.deposit) > 0 && <Row k="پیش‌پرداخت / بیعانه" v={formatMoney(d.deposit)} />}
        {d.deadlineDate && <Row k="تاریخ تحویل تقریبی / ضرب‌الاجل (SLA)" v={formatShortDate(d.deadlineDate)} />}
      </div>

      {d.customerAddress && (
        <div className="mt-1.5 text-[12px]"><span className="text-slate-500">آدرس: </span>{d.customerAddress}</div>
      )}

      {/* barcode & QR */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
        <div className="flex items-center gap-3">
          <TicketQrCode value={d.ticketNumber} size={56} />
          <TicketBarcode value={d.ticketNumber} height={32} />
        </div>
        <div className="max-w-xs text-[10px] text-slate-500 leading-relaxed">
          {cfg.receiptFooterTerms ||
            "این رسید جهت تحویل دستگاه ارائه شود. تجهیزات امانی تا ۳۰ روز پس از اتمام تعمیر نگهداری شده و مرکز مسئولیتی در قبال اطلاعات شخصی روی حافظه دستگاه ندارد."}
        </div>
      </div>

      {/* signatures */}
      <div className="mt-6 flex items-end justify-between text-[11px] text-slate-600">
        <div className="w-40 border-t border-slate-500 pt-1 text-center">امضا و اثر انگشت مشتری</div>
        <div className="w-40 border-t border-slate-500 pt-1 text-center">امضا و مهر مرکز</div>
      </div>
    </div>
  );
}