"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import { Card, CardHeader, Button, Input, Field, Select, Textarea, Badge, Spinner } from "@/components/ui";
import { STATUS_LABELS } from "@/db/schema";
import { api, useFetch } from "@/lib/client";
import { toFa, formatMoney, formatDate, formatDateTime, statusColor, classNames } from "@/lib/format";
import {
  ArrowRight,
  Printer,
  PackageCheck,
  CheckCircle2,
  Truck,
  Calculator,
  AlertTriangle,
  Wrench,
  Clock,
  XCircle,
} from "lucide-react";

type Detail = any;

export default function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, refetch } = useFetch<Detail>(`/api/devices/${id}`);
  const [me, setMe] = useState<any>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user));
  }, []);

  async function action(label: string, fn: () => Promise<any>) {
    setBusy(label);
    setError("");
    try {
      await fn();
      await refetch();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  if (loading || !data) {
    return (
      <div className="grid place-items-center py-32">
        <Spinner />
      </div>
    );
  }

  const d = data;
  const role = me?.role;
  const canRepair = role === "repair_technician" || role === "super_admin";
  const canDeliver = role === "intake_technician" || role === "service_manager" || role === "super_admin";
  const canAccount = role === "accountant" || role === "super_admin";

  const isAwaitingParts = d.status === "awaiting_parts";
  const isAssignedToRepair = d.status === "assigned";
  const canDoRepairOps = d.status === "in_progress" || d.status === "parts_approved";
  const isRepairDone = d.status === "repair_done";
  const isDelivered = d.status === "delivered";
  const isClosed = d.status === "closed";

  return (
    <div className="space-y-4">
      <Link href="/devices" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-sky-600">
        <ArrowRight className="h-3.5 w-3.5" /> بازگشت به لیست دستگاه‌ها
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xl font-extrabold text-slate-800 dark:text-white">{toFa(d.ticketNumber)}</h1>
            <Badge className={statusColor(d.status)}>{STATUS_LABELS[d.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {[d.brand, d.model].filter(Boolean).join(" • ") || d.deviceType} — {d.deviceType}
          </p>
        </div>
        <Link href={`/receipt/${d.id}`}>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4" /> چاپ رسید
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: details */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="اطلاعات دستگاه" />
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <Info label="نوع دستگاه" value={d.deviceType} />
              <Info label="برند / مدل" value={[d.brand, d.model].filter(Boolean).join(" - ") || "—"} />
              <Info label="متععلقات" value={d.accessories || "—"} />
              <Info label="هزینه تخمینی" value={formatMoney(d.estimatedCost)} />
              <div className="sm:col-span-2">
                <Info label="شرح مشکل" value={d.problem} />
              </div>
              <Info label="کارشناس پذیرش" value={d.intakeTechName || "—"} />
              <Info label="کارشناس تعمیر" value={d.repairTechName || "—"} />
              <Info label="تاریخ پذیرش" value={formatDateTime(d.intakeDate)} />
              {d.deliveryDate && <Info label="تاریخ تحویل" value={formatDateTime(d.deliveryDate)} />}
              {d.finalCost && Number(d.finalCost) > 0 && <Info label="هزینه نهایی" value={formatMoney(d.finalCost)} />}
            </div>
          </Card>

          <Card>
            <CardHeader title="اطلاعات مشتری" />
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <Info label="نام" value={d.customerName} />
              <Info label="تلفن" value={toFa(d.customerPhone)} />
              {d.customerPhone2 && <Info label="تلفن ثانوی" value={toFa(d.customerPhone2)} />}
              {d.customerNationalId && <Info label="کد ملی" value={toFa(d.customerNationalId)} />}
              {d.customerAddress && <div className="sm:col-span-2"><Info label="آدرس" value={d.customerAddress} /></div>}
            </div>
          </Card>

          {/* Parts */}
          {d.parts?.length > 0 && (
            <Card>
              <CardHeader title="قطعات درخواستی" subtitle={`تعداد: ${toFa(d.parts.length)}`} />
              <div className="divide-y divide-[var(--color-border)]">
                {d.parts.map((p: any) => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">{p.partName} {p.partModel && <span className="text-slate-400">— {p.partModel}</span>}</p>
                      <p className="text-xs text-slate-400">{formatMoney(p.partPrice)} • {formatDateTime(p.requestedAt)}</p>
                    </div>
                    <Badge
                      className={
                        p.status === "approved"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                          : p.status === "rejected"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                      }
                    >
                      {p.status === "approved" ? "تایید شد" : p.status === "rejected" ? "رد شد" : "در انتظار تایید"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {d.repairNotes && (
            <Card>
              <CardHeader title="گزارش تعمیر و عملیات انجام‌شده" />
              <div className="space-y-2 p-5 text-sm text-slate-600 dark:text-slate-300">
                {d.operationsDone && <p><span className="font-semibold text-slate-700 dark:text-slate-200">عملیات: </span>{d.operationsDone}</p>}
                <p><span className="font-semibold text-slate-700 dark:text-slate-200">یادداشت کارشناس: </span>{d.repairNotes}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Right: workflow actions */}
        <div className="space-y-4">
          <WorkflowPanel
            d={d}
            role={role}
            canRepair={canRepair}
            canDeliver={canDeliver}
            canAccount={canAccount}
            isAwaitingParts={isAwaitingParts}
            isAssignedToRepair={isAssignedToRepair}
            canDoRepairOps={canDoRepairOps}
            isRepairDone={isRepairDone}
            isDelivered={isDelivered}
            isClosed={isClosed}
            busy={busy}
            action={action}
          />

          {/* Accounting summary */}
          {d.accounting && (
            <Card className="p-4">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
                <Calculator className="h-4 w-4 text-violet-600" /> خلاصه مالی
              </p>
              <div className="space-y-2 text-xs">
                <Row label="مبلغ دریافتی از مشتری" value={formatMoney(d.accounting.receivedAmount)} />
                <Row label="هزینه قطعه خریداری‌شده" value={formatMoney(d.accounting.partCost)} />
                <div className="my-1 border-t border-[var(--color-border)]" />
                <Row label="سود خالص" value={formatMoney(d.accounting.profit)} bold accent="emerald" />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={classNames("font-semibold", bold && accent === "emerald" && "text-emerald-600 dark:text-emerald-400", !bold && "text-slate-700 dark:text-slate-200")}>
        {value}
      </span>
    </div>
  );
}

/* -------- Workflow action panel -------- */
function WorkflowPanel({
  d, role, canRepair, canDeliver, canAccount, isAwaitingParts, isAssignedToRepair, canDoRepairOps, isRepairDone, isDelivered, isClosed, busy, action,
}: any) {
  const [partsMode, setPartsMode] = useState<"none" | "yes" | "">("");
  const [partForm, setPartForm] = useState({ partName: "", partModel: "", partPrice: "", supplier: "", notes: "" });
  const [opsForm, setOpsForm] = useState({ operationsDone: "", repairNotes: "", finalCost: d.estimatedCost || "" });
  const [deliverForm, setDeliverForm] = useState({ receivedAmount: d.finalCost || d.estimatedCost || "0" });
  const [accForm, setAccForm] = useState({ receivedAmount: d.accounting?.receivedAmount || d.finalCost || "0", partCost: d.accounting?.partCost || "0" });

  // nothing actionable
  if (isClosed)
    return (
      <Card className="p-5 text-center">
        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">این دستگاه تکمیل و تسویه شده است.</p>
      </Card>
    );

  if (isAwaitingParts && !canDeliver)
    return (
      <Card className="p-5 text-center">
        <Clock className="mx-auto mb-2 h-8 w-8 text-amber-500 animate-pulse-soft" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">در انتظار تایید خرید قطعه</p>
        <p className="mt-1 text-xs text-slate-400">پس از تایید مدیر خدمات، عملیات تعمیر باز می‌شود.</p>
      </Card>
    );

  return (
    <Card className="p-5">
      <p className="mb-4 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
        <Wrench className="h-4 w-4 text-sky-600" /> عملیات فرآیند
      </p>

      {/* Step 1: repair tech decides parts */}
      {canRepair && isAssignedToRepair && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">آیا برای تعمیر این دستگاه نیاز به خرید قطعه هست؟</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPartsMode("yes")}
              className={classNames(
                "cursor-pointer rounded-xl border p-3 text-center text-xs font-semibold transition-colors",
                partsMode === "yes" ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200" : "border-[var(--color-border)] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <PackageCheck className="mx-auto mb-1 h-5 w-5" /> نیاز به خرید قطعه دارد
            </button>
            <button
              type="button"
              onClick={() => setPartsMode("none")}
              className={classNames(
                "cursor-pointer rounded-xl border p-3 text-center text-xs font-semibold transition-colors",
                partsMode === "none" ? "border-sky-400 bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200" : "border-[var(--color-border)] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <XCircle className="mx-auto mb-1 h-5 w-5" /> نیاز به قطعه نیست
            </button>
          </div>

          {partsMode === "none" && (
            <Button className="w-full" loading={busy === "noparts"} onClick={() => action("noparts", () => api(`/api/devices/${d.id}/parts`, "POST", { needsParts: false }))}>
              شروع تعمیر (بدون قطعه)
            </Button>
          )}

          {partsMode === "yes" && (
            <div className="space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
              <Field label="نام قطعه" required>
                <Input value={partForm.partName} onChange={(e) => setPartForm({ ...partForm, partName: e.target.value })} placeholder="مثلاً صفحه نمایش" />
              </Field>
              <Field label="مدل / کد قطعه">
                <Input value={partForm.partModel} onChange={(e) => setPartForm({ ...partForm, partModel: e.target.value })} />
              </Field>
              <Field label="قیمت قطعه (تومان)" required>
                <Input value={partForm.partPrice} onChange={(e) => setPartForm({ ...partForm, partPrice: toFa(e.target.value) })} inputMode="numeric" />
              </Field>
              <Field label="تامین‌کننده">
                <Input value={partForm.supplier} onChange={(e) => setPartForm({ ...partForm, supplier: e.target.value })} />
              </Field>
              <p className="text-[11px] text-slate-400">پس از ثبت، کل این فرم برای تایید به مدیر خدمات ارسال می‌شود.</p>
              <Button
                className="w-full"
                loading={busy === "parts"}
                onClick={() => action("parts", () => api(`/api/devices/${d.id}/parts`, "POST", { needsParts: true, ...partForm }))}
              >
                <AlertTriangle className="h-4 w-4" /> ارسال برای تایید خرید قطعه
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: repair tech completes operations */}
      {canRepair && canDoRepairOps && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-emerald-600">✓ قطعه تایید شد / تعمیر در حال انجام است. عملیات انجام‌شده را ثبت کنید.</p>
          <Field label="عملیات انجام‌شده">
            <Textarea value={opsForm.operationsDone} onChange={(e) => setOpsForm({ ...opsForm, operationsDone: e.target.value })} placeholder="مثلاً تعویض صفحه، فلش..." />
          </Field>
          <Field label="یادداشت تعمیر">
            <Textarea value={opsForm.repairNotes} onChange={(e) => setOpsForm({ ...opsForm, repairNotes: e.target.value })} />
          </Field>
          <Field label="هزینه نهایی تعمیر (تومان)">
            <Input value={opsForm.finalCost} onChange={(e) => setOpsForm({ ...opsForm, finalCost: toFa(e.target.value) })} inputMode="numeric" />
          </Field>
          <Button
            variant="success"
            className="w-full"
            loading={busy === "complete"}
            onClick={() => action("complete", () => api(`/api/devices/${d.id}/complete`, "POST", opsForm))}
          >
            <CheckCircle2 className="h-4 w-4" /> اتمام تعمیرات
          </Button>
        </div>
      )}

      {/* Step 3: intake delivers */}
      {canDeliver && isRepairDone && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-cyan-600">✓ تعمیر تکمیل شد. لطفاً با مشتری تماس بگیرید و دستگاه را تحویل دهید.</p>
          <Field label="مبلغ دریافتی از مشتری (تومان)">
            <Input value={deliverForm.receivedAmount} onChange={(e) => setDeliverForm({ ...deliverForm, receivedAmount: toFa(e.target.value) })} inputMode="numeric" />
          </Field>
          <Button
            className="w-full"
            loading={busy === "deliver"}
            onClick={() => action("deliver", () => api(`/api/devices/${d.id}/deliver`, "POST", deliverForm))}
          >
            <Truck className="h-4 w-4" /> تحویل به مشتری
          </Button>
        </div>
      )}

      {/* Step 4: accountant settles */}
      {canAccount && isDelivered && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-violet-600">✓ دستگاه تحویل شد. اطلاعات مالی را برای تسویه ثبت کنید.</p>
          <Field label="مبلغ دریافتی از مشتری (تومان)">
            <Input value={accForm.receivedAmount} onChange={(e) => setAccForm({ ...accForm, receivedAmount: toFa(e.target.value) })} inputMode="numeric" />
          </Field>
          <Field label="هزینه قطعه خریداری‌شده (تومان)">
            <Input value={accForm.partCost} onChange={(e) => setAccForm({ ...accForm, partCost: toFa(e.target.value) })} inputMode="numeric" />
          </Field>
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            سود خالص: {formatMoney(Number(toEn2(accForm.receivedAmount)) - Number(toEn2(accForm.partCost)))}
          </div>
          <Button
            variant="success"
            className="w-full"
            loading={busy === "settle"}
            onClick={() => action("settle", () => api(`/api/devices/${d.id}/accounting`, "POST", accForm))}
          >
            <Calculator className="h-4 w-4" /> تسویه و بستن
          </Button>
        </div>
      )}

      {isAwaitingParts && canDeliver && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
          این دستگاه در انتظار تایید قطعه توسط مدیر خدمات است.
        </p>
      )}
    </Card>
  );
}

function toEn2(v: string) {
  return String(v).replace(/[^\d.-]/g, "");
}
