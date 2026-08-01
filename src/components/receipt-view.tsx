"use client";

import { toFa, formatMoney, formatDateTime, formatShortDate } from "@/lib/format";
import { STATUS_LABELS, WARRANTY_STATUS_LABELS } from "@/db/schema";
import { TicketBarcode } from "@/components/qr-barcode";

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
          <div className="mt-1 flex gap-3 text-[10px] text-slate-600">
            <span>شماره رسید: <b className="font-mono">{toFa(d.ticketNumber)}</b></span>
            <span>تاریخ: {formatDateTime(d.intakeDate)}</span>
          </div>
        </div>
      </div>

      <div className="mt-2 rounded-lg border border-slate-300 p-2.5">
        <p className="mb-1.5 border-b border-slate-200 pb-1 text-[10px] font-extrabold text-slate-700">اطلاعات مشتری و دستگاه</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          <Row k="نام مشتری" v={d.customerName} />
          <Row k="شماره تماس" v={toFa(d.customerPhone)} />
          <Row k="تلفن ثانوی" v={d.customerPhone2 ? toFa(d.customerPhone2) : "—"} />
          <Row k="کد ملی" v={d.customerNationalId ? toFa(d.customerNationalId) : "—"} />
          <Row k="مارک دستگاه" v={d.brand || "—"} />
          <Row k="نوع دستگاه" v={d.deviceType} />
          <Row k="مدل دستگاه" v={d.model} />
          {d.serialNumber && <Row k="شماره سریال / IMEI" v={d.serialNumber} />}
          <Row k="وضعیت گارانتی" v={WARRANTY_STATUS_LABELS[d.warrantyStatus || "out_of_warranty"] || "فاقد گارانتی"} />
          <Row k="نوع تحویل" v={d.deliveryType === "shipping" ? "ارسالی" : "حضوری"} />
          <Row k="وضعیت" v={STATUS_LABELS[d.status] || d.status} />
          {d.deadlineDate && <Row k="تاریخ تخمینی تحویل دستگاه" v={formatShortDate(d.deadlineDate)} />}
        </div>
      </div>
      <div className="mt-2 rounded-lg border border-slate-300 p-2.5">
        <p className="mb-1 border-b border-slate-200 pb-1 text-[10px] font-extrabold text-slate-700">شرح پذیرش</p>
        <div className="grid gap-1 text-[10px]">
          <Row k="عیب به اظهار مشتری" v={d.problem} />
          <Row k="لوازم همراه" v={d.accessories || "—"} />
          <Row k="رمز عبور دستگاه" v={d.devicePassword || "—"} />
        </div>
      </div>
      {d.customerAddress && (
        <div className="mt-2 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[10px]"><span className="text-slate-500">آدرس: </span>{d.customerAddress}</div>
      )}
      <div className="mt-2 overflow-hidden rounded-lg border border-slate-300">
        <p className="border-b border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-extrabold text-slate-700">خلاصه مالی</p>
        <table className="w-full text-[10px]"><tbody>
          <tr><td className="border-b border-slate-100 px-2.5 py-1">هزینه تخمینی تعمیر</td><td className="border-b border-slate-100 px-2.5 py-1 text-left font-mono">{formatMoney(d.estimatedCost)}</td></tr>
          <tr><td className="border-b border-slate-100 px-2.5 py-1">پیش‌پرداخت / بیعانه</td><td className="border-b border-slate-100 px-2.5 py-1 text-left font-mono">{formatMoney(d.deposit || 0)}</td></tr>
          <tr className="font-extrabold"><td className="px-2.5 py-1">مبلغ نهایی قابل پرداخت</td><td className="px-2.5 py-1 text-left font-mono">{formatMoney(d.finalCost || d.estimatedCost || 0)}</td></tr>
        </tbody></table>
      </div>

      {/* barcode */}
      <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
        <div className="flex items-center">
          <TicketBarcode value={d.ticketNumber} height={32} />
        </div>
        <div className="max-w-sm text-[9px] text-slate-500 leading-tight">
          {cfg.receiptFooterTerms ||
            "این رسید جهت تحویل دستگاه ارائه شود. تجهیزات امانی تا ۳۰ روز پس از اتمام تعمیر نگهداری شده و مرکز مسئولیتی در قبال اطلاعات شخصی روی حافظه دستگاه ندارد."}
        </div>
      </div>

      {/* signatures */}
      <div className="mt-2 flex items-end justify-start text-[10px] text-slate-600">
        <div className="w-40 border-t border-slate-500 pt-1 text-center">امضا و اثر انگشت مشتری</div>

      </div>
    </div>
  );
}