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
  const intakeName = d.intakeByName || d.acceptedBy || d.receivedBy || d.intakeUserName || d.intakeUser?.name || "—";
  const customerName = d.customerName || "—";
  const phone = d.customerPhone ? toFa(d.customerPhone) : "—";
  const warrantyLabel = WARRANTY_STATUS_LABELS[d.warrantyStatus || "out_of_warranty"] || "فاقد گارانتی";

  return (
    <div>
      <style>{`@page { size: A5 landscape; margin: 8mm; }
        .print-area { width: 210mm; height: 148mm; }
        .receipt-header-logo { height: 40px; width: 40px; }
        .receipt-company { font-size: 13px; }
        .receipt-sub { font-size: 10px; }
        @media print { .no-print { display: none !important; } }
      `}</style>

      <div className="print-area mb-4 break-after-page border-2 border-slate-800 bg-white p-4 text-slate-900" style={{ width: "210mm", height: "148mm" }}>
        {/* header */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2">
          <div className="flex items-center gap-3">
            {cfg.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cfg.logo} alt="logo" className="receipt-header-logo object-contain" />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-800 text-white text-lg font-bold">H</div>
            )}
            <div>
              <h1 className="text-lg font-extrabold receipt-company">{company}</h1>
              <p className="text-[11px] text-slate-600 receipt-sub">{cfg.tagline || "سامانه مدیریت تعمیرات و قطعات"}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-bold text-white">رسید پذیرش دستگاه</p>
            <p className="mt-1 text-[11px] text-slate-500 font-bold">{copyLabel}</p>
            <div className="mt-1 flex flex-col items-end gap-1 text-[10px] text-slate-600">
              <div>شماره رسید: <b className="font-mono">{toFa(d.ticketNumber)}</b></div>
              <div>تاریخ: {formatDateTime(d.intakeDate)}</div>
            </div>
          </div>
        </div>

        {/* header phones centered below header */}
        <div className="w-full text-center text-[10px] text-slate-600 mt-2">مرکز خدمات پس از فروش — تلفن: 0938 2494101 , 0930 5068332</div>

        <div className="mt-2 rounded-lg border border-slate-300 p-2.5">
          <p className="mb-1.5 border-b border-slate-200 pb-1 text-[10px] font-extrabold text-slate-700">اطلاعات مشتری و دستگاه</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
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
        <div className="mt-2 rounded-lg border border-slate-300 p-2.5">
          <p className="mb-1 border-b border-slate-200 pb-1 text-[10px] font-extrabold text-slate-700">شرح پذیرش</p>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="col-span-2">
              <div className="grid gap-1">
                <Row k="عیب به اظهار مشتری" v={d.problem || "—"} />
                <Row k="لوازم همراه" v={d.accessories || "—"} />
                {/* removed device password as requested */}
              </div>
            </div>
            <div className="col-span-1 border-l border-slate-200 pl-2">
              <div className="text-[10px] font-extrabold text-slate-700 mb-1">توضیحات</div>
              <div className="text-[10px] text-slate-700">{d.notes || d.description || d.intakeNote || "—"}</div>
            </div>
          </div>
        </div>

        {d.customerAddress && (
          <div className="mt-2 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[10px]"><span className="text-slate-500">آدرس: </span>{d.customerAddress}</div>
        )}

        {/* Financial summary and signatures side-by-side */}
        <div className="mt-2 flex items-start gap-3">
          <div className="overflow-hidden rounded-lg border border-slate-300 w-1/3">
            <p className="border-b border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-extrabold text-slate-700">خلاصه مالی</p>
            <table className="w-full text-[10px]"><tbody>
              <tr><td className="border-b border-slate-100 px-2.5 py-1">هزینه تخمینی تعمیر</td><td className="border-b border-slate-100 px-2.5 py-1 text-left font-mono">{formatMoney(d.estimatedCost || 0)}</td></tr>
              <tr><td className="border-b border-slate-100 px-2.5 py-1">پیش‌پرداخت / بیعانه</td><td className="border-b border-slate-100 px-2.5 py-1 text-left font-mono">{formatMoney(d.deposit || 0)}</td></tr>
              <tr className="font-extrabold"><td className="px-2.5 py-1">مبلغ نهایی قابل پرداخت</td><td className="px-2.5 py-1 text-left font-mono">{formatMoney(d.finalCost || d.estimatedCost || 0)}</td></tr>
            </tbody></table>
          </div>

          <div className="flex-1 rounded-lg border border-slate-300 p-3">
            <div className="flex justify-between items-end gap-4 text-[10px] text-slate-600">
              <div className="w-1/2 text-center">
                <div className="border-t border-slate-500 pt-2">امضا مشتری</div>
                <div className="mt-1 font-semibold">{customerName}</div>
              </div>
              <div className="w-1/2 text-center">
                <div className="border-t border-slate-500 pt-2">امضا کارشناس پذیرش</div>
                <div className="mt-1 font-semibold">{intakeName}</div>
              </div>
            </div>
          </div>
        </div>

        {/* barcode and footer terms */}
        <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
          <div className="flex items-center">
            <TicketBarcode value={d.ticketNumber} height={32} />
          </div>
          <div className="max-w-sm text-[9px] text-slate-500 leading-tight">
            {cfg.receiptFooterTerms ||
              "این رسید جهت تحویل دستگاه ارائه شود. تجهیزات امانی تا ۳۰ روز پس از اتمام تعمیر نگهداری شده و مرکز مسئولیتی در قبال آسیب یا مفقود شدن وسایل غیرمجاز نخواهد داشت."
            }
          </div>
        </div>

      </div>
    </div>
  );
}
