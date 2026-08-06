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

export function ReceiptView({ copyLabel, d, cfg, company, currentUserName }: { copyLabel: string; d: any; cfg: any; company: string; currentUserName?: string }) {
  const intakeName = d.intakeTechName || currentUserName || d.intakeByName || d.acceptedBy || d.receivedBy || d.intakeUserName || d.intakeUser?.name || "—";
  const customerName = d.customerName || "—";
  const phone = d.customerPhone ? toFa(d.customerPhone) : "—";
  const warrantyLabel = WARRANTY_STATUS_LABELS[d.warrantyStatus || "out_of_warranty"] || "فاقد گارانتی";
  // دیتای notes از API آرایه‌ای از یادداشت‌هاست — اولین یادداشت = توضیحات تکمیلی پذیرش
  const intakeNotes: string = Array.isArray(d.notes)
    ? d.notes.map((n: any) => n.note || "").filter(Boolean).join(" — ")
    : (d.notes || d.description || d.intakeNote || "");

  return (
    <div>
      <div
        className="print-area receipt-a5 mb-4 break-after-page flex flex-col border-2 border-slate-800 bg-white p-2 text-slate-900"
        style={{ width: "200mm", height: "138mm", overflow: "hidden", boxSizing: "border-box" }}
      >
        {/* header — compact */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1">
          <div className="flex items-center gap-2">
            {cfg.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cfg.logo} alt="logo" className="h-7 w-7 object-contain" />
            ) : (
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-slate-800 text-sm font-bold text-white">H</div>
            )}
            <div>
              <h1 className="text-[11px] font-extrabold leading-tight">{company}</h1>
              <p className="text-[8px] leading-tight text-slate-600">{cfg.tagline || "سامانه مدیریت تعمیرات و قطعات"}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-white">رسید پذیرش دستگاه</p>
            <p className="mt-0.5 text-[9px] font-bold text-slate-500">{copyLabel}</p>
            <div className="mt-0.5 flex flex-col items-end gap-0.5 text-[8px] text-slate-600">
              <div>شماره رسید: <b className="font-mono">{toFa(d.ticketNumber)}</b></div>
              <div>تاریخ: {formatDateTime(d.intakeDate)}</div>
            </div>
          </div>
        </div>

        <div className="mt-1.5 rounded-lg border border-slate-300 p-1.5">
          <p className="mb-1 border-b border-slate-200 pb-0.5 text-[9px] font-extrabold text-slate-700">اطلاعات مشتری و دستگاه</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9.5px]">
            <Row k="نام مشتری" v={customerName} />
            <Row k="شماره تماس" v={phone} />
            <Row k="کد ملی" v={d.customerNationalId ? toFa(d.customerNationalId) : "—"} />
            <Row k="مارک دستگاه" v={d.brand || "—"} />
            <Row k="نوع دستگاه" v={d.deviceType || "—"} />
            <Row k="مدل دستگاه" v={d.model || "—"} />
            {d.serialNumber && <Row k="شماره سریال / IMEI" v={d.serialNumber} />}
            <Row k="وضعیت گارانتی" v={warrantyLabel} />
            <Row k="نوع تحویل" v={d.deliveryType === "shipping" ? "ارسالی" : "حضوری"} />
            {d.deadlineDate && <Row k="تاریخ تخمینی تحویل دستگاه" v={formatShortDate(d.deadlineDate)} />}
          </div>
        </div>

        {/* Description and Notes side-by-side */}
        <div className="mt-1.5 rounded-lg border border-slate-300 p-1.5">
          <p className="mb-1 border-b border-slate-200 pb-0.5 text-[9px] font-extrabold text-slate-700">شرح پذیرش</p>
          <div className="grid grid-cols-3 gap-2 text-[9.5px]">
            <div className="col-span-2 rounded-lg border border-slate-300 p-1.5">
              <div className="mb-0.5 text-[9px] font-extrabold text-slate-700">توضیحات</div>
              <div className="text-[9.5px] leading-snug text-slate-700">{intakeNotes || "—"}</div>
            </div>
            <div className="col-span-1 rounded-lg border border-slate-300 p-1.5">
              <div className="grid gap-0.5">
                <Row k="عیب به اظهار مشتری" v={d.problem || "—"} />
                <Row k="لوازم همراه" v={d.accessories || "—"} />
                {/* removed device password as requested */}
              </div>
            </div>
          </div>
        </div>

        {d.customerAddress && (
          <div className="mt-1.5 rounded-lg border border-slate-300 px-2 py-0.5 text-[9.5px]">
            <span className="text-slate-500">آدرس: </span>{d.customerAddress}
          </div>
        )}

        {/* Financial summary and signatures side-by-side */}
        <div className="mt-1.5 flex items-stretch gap-3">
          <div className="w-2/5 overflow-hidden rounded-lg border border-slate-300">
            <p className="border-b border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-extrabold text-slate-700">خلاصه مالی</p>
            <table className="w-full text-[9.5px]"><tbody>
              <tr><td className="border-b border-slate-100 px-2 py-0.5">هزینه تخمینی تعمیر</td><td className="border-b border-slate-100 px-2 py-0.5 text-left font-mono">{formatMoney(d.estimatedCost || 0)}</td></tr>
              <tr><td className="border-b border-slate-100 px-2 py-0.5">پیش‌پرداخت / بیعانه</td><td className="border-b border-slate-100 px-2 py-0.5 text-left font-mono">{formatMoney(d.deposit || 0)}</td></tr>
              <tr className="font-extrabold"><td className="px-2 py-0.5">مبلغ نهایی قابل پرداخت</td><td className="px-2 py-0.5 text-left font-mono">{formatMoney(d.finalCost || d.estimatedCost || 0)}</td></tr>
            </tbody></table>
          </div>

          <div className="flex-1 rounded-lg border border-slate-300 p-1.5">
            <div className="flex h-full items-end justify-between gap-4 text-[9.5px] text-slate-600">
              <div className="w-1/2 text-center">
                <div className="border-t border-slate-500 pt-1">امضا مشتری</div>
                <div className="mt-0.5 font-semibold text-slate-900">{customerName}</div>
              </div>
              <div className="w-1/2 text-center">
                <div className="border-t border-slate-500 pt-1">امضا کارشناس پذیرش</div>
                <div className="mt-0.5 font-semibold text-slate-900">{intakeName}</div>
              </div>
            </div>
          </div>
        </div>

        {/* barcode and footer terms — pinned to bottom */}
        <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-200 pt-1">
          <div className="flex items-center">
            <TicketBarcode value={d.ticketNumber} height={26} />
          </div>
          <div className="max-w-sm text-[8px] leading-snug text-slate-500">
            {cfg.receiptFooterTerms ||
              "این رسید جهت تحویل دستگاه ارائه شود. تجهیزات امانی تا ۳۰ روز پس از اتمام تعمیر نگهداری شده و مرکز مسئولیتی در قبال آسیب یا مفقود شدن وسایل غیرمجاز نخواهد داشت."
            }
          </div>
        </div>

      </div>
    </div>
  );
}
