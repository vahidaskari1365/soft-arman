"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, Button, Input, Field, Select, Textarea, Badge, Spinner } from "@/components/ui";
import { STATUS_LABELS, WARRANTY_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/db/schema";
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
  History,
  MessageSquare,
  Send,
  ShieldCheck,
  Key,
  Calendar,
  Trash2,
} from "lucide-react";

type Detail = any;

export default function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, loading, refetch } = useFetch<Detail>(`/api/devices/${id}`);
  const [me, setMe] = useState<any>(null);
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  // Internal Note form
  const [noteText, setNoteText] = useState("");
  const [postingNote, setPostingNote] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(Date.now());
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => setMe(d.user));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function action(label: string, fn: () => Promise<any>) {
    setBusy(label);
    setError("");
    try {
      await fn();
      await refetch();
    } catch (err: any) {
      setError(err.message || "خطا در انجام عملیات");
    } finally {
      setBusy("");
    }
  }

  async function submitNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setPostingNote(true);
    try {
      await api(`/api/devices/${id}/notes`, "POST", { note: noteText });
      setNoteText("");
      await refetch();
    } catch (err: any) {
      setError(err.message || "خطا در ثبت یادداشت");
    } finally {
      setPostingNote(false);
    }
  }

  async function handleDelete() {
    if (!data) return;
    const label = [data.brand, data.model].filter(Boolean).join(" • ") || data.deviceType || "";
    const ok = window.confirm(
      `آیا از حذف کامل این دستگاه مطمئن هستید؟\n\nرسید: ${data.ticketNumber}\n${label}\n\n⚠️ این عملیات غیرقابل بازگشت است و تمام تاریخچه عملیات، یادداشت‌ها، درخواست‌های قطعه و اطلاعات حسابداری مرتبط نیز برای همیشه حذف خواهد شد.`
    );
    if (!ok) return;
    setBusy("delete");
    setError("");
    try {
      await api(`/api/devices/${data.id}`, "DELETE");
      router.push("/devices");
    } catch (err: any) {
      setError(err.message || "خطا در حذف دستگاه");
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

  // Check Overdue SLA
  const isOverdue =
    d.deadlineDate &&
    now > 0 &&
    new Date(d.deadlineDate).getTime() < now &&
    !["delivered", "closed", "cancelled"].includes(d.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/devices" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-sky-600">
          <ArrowRight className="h-3.5 w-3.5" /> بازگشت به لیست دستگاه‌ها
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/invoice/${d.id}`}>
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4" /> چاپ فاکتور نهایی
            </Button>
          </Link>
          <Link href={`/receipt/${d.id}`}>
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4" /> چاپ رسید
            </Button>
          </Link>
          {role === "super_admin" && (
            <Button
              variant="danger"
              size="sm"
              loading={busy === "delete"}
              onClick={handleDelete}
              title="حذف کامل دستگاه (فقط مدیر کل)"
            >
              <Trash2 className="h-4 w-4" /> حذف دستگاه
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xl font-extrabold text-slate-800 dark:text-white">{toFa(d.ticketNumber)}</h1>
            <Badge className={statusColor(d.status)}>{STATUS_LABELS[d.status]}</Badge>
            {isOverdue && (
              <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                <AlertTriangle className="h-3 w-3 inline mr-1" /> تأخیر در تحویل (Overdue)
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {[d.brand, d.model].filter(Boolean).join(" • ") || d.deviceType} — {d.deviceType}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: details & history */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="اطلاعات دستگاه و مشخصات فنی" />
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <Info label="نوع دستگاه" value={d.deviceType} />
              <Info label="برند / مدل" value={[d.brand, d.model].filter(Boolean).join(" - ") || "—"} />
              {d.serialNumber && <Info label="شماره سریال / IMEI" value={d.serialNumber} />}
              {d.devicePassword && <Info label="رمز عبور دستگاه (PIN)" value={d.devicePassword} />}
              <Info label="متعلقات همراه" value={d.accessories || "—"} />
              <Info label="هزینه تخمینی" value={formatMoney(d.estimatedCost)} />
              {Number(d.deposit) > 0 && <Info label="پیش‌پرداخت / بیعانه" value={formatMoney(d.deposit)} />}
              {d.warrantyStatus && <Info label="وضعیت گارانتی پذیرش" value={WARRANTY_STATUS_LABELS[d.warrantyStatus] || "—"} />}
              {d.warrantyDays > 0 && <Info label="مدت گارانتی تعمیر" value={`${toFa(d.warrantyDays)} روز`} />}
              {d.deadlineDate && <Info label="تاریخ تحویل تقریبی (SLA)" value={new Date(d.deadlineDate).toLocaleDateString("fa-IR")} />}
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
              {d.customerAddress && (
                <div className="sm:col-span-2">
                  <Info label="آدرس" value={d.customerAddress} />
                </div>
              )}
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
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        {p.partName} {p.partModel && <span className="text-slate-400">— {p.partModel}</span>}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatMoney(p.partPrice)} • {formatDateTime(p.requestedAt)}
                      </p>
                      {p.supplier && <p className="text-xs text-slate-400">تامین‌کننده: {p.supplier}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          p.status === "approved"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : p.status === "rejected"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        }
                      >
                        {p.status === "approved" ? "تایید شد" : p.status === "rejected" ? "رد شد" : "در انتظار تایید"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Audit Trail / Timeline */}
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <History className="h-4 w-4 text-sky-600" /> تایم‌لاین تاریخچه عملیات (Audit Log)
                </span>
              }
              subtitle="ثبت دقیق زمان، کاربر و جزئیات تغییرات وضعیت دستگاه"
            />
            <div className="p-5">
              {(!d.logs || d.logs.length === 0) ? (
                <p className="text-xs text-slate-400">تاریخچه‌ای ثبت نشده است.</p>
              ) : (
                <div className="relative border-r-2 border-slate-200 dark:border-slate-800 pr-4 space-y-4">
                  {d.logs.map((log: any) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -right-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-sky-600 dark:border-slate-900" />
                      <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                        <span>{log.action}</span>
                        <span className="text-[11px] font-normal text-slate-400">{formatDateTime(log.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{log.note || "—"}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        توسط: <strong>{log.userName || "سیستم"}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Internal Notes */}
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-violet-600" /> یادداشت‌های داخلی کارشناسان
                </span>
              }
              subtitle="این یادداشت‌ها فقط برای کادر فنی و مدیریت قابل مشاهده است و در پورتال مشتری نمایش داده نمی‌شود."
            />
            <div className="p-5 space-y-4">
              {/* Note input form */}
              <form onSubmit={submitNote} className="flex gap-2">
                <Input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="یادداشت داخلی جدید درباره این دستگاه بنویسید..."
                  className="w-full text-xs"
                />
                <Button type="submit" size="sm" variant="primary" loading={postingNote}>
                  <Send className="h-4 w-4" /> ارسال
                </Button>
              </form>

              {(!d.notes || d.notes.length === 0) ? (
                <p className="text-xs text-slate-400 text-center py-4">هنوز یادداشتی ثبت نشده است.</p>
              ) : (
                <div className="space-y-2">
                  {d.notes.map((n: any) => (
                    <div key={n.id} className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/50">
                      <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-200">
                        <span>{n.userName || "کاربر"}</span>
                        <span className="text-[11px] font-normal text-slate-400">{formatDateTime(n.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-slate-600 dark:text-slate-300">{n.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right column: actions and accounting */}
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
                <Row label="مجموع مبلغ دریافتی" value={formatMoney(d.accounting.receivedAmount)} />
                <Row label="هزینه قطعات مصرفی" value={formatMoney(d.accounting.partCost)} />
                {Number(d.accounting.laborCost) > 0 && <Row label="اجرت تعمیرات و خدمات" value={formatMoney(d.accounting.laborCost)} />}
                {Number(d.accounting.discount) > 0 && <Row label="تخفیف" value={formatMoney(d.accounting.discount)} />}
                {Number(d.accounting.tax) > 0 && <Row label="مالیات بر ارزش افزوده" value={formatMoney(d.accounting.tax)} />}
                {Number(d.accounting.deposit) > 0 && <Row label="بیعانه کسرشده" value={formatMoney(d.accounting.deposit)} />}
                <div className="my-1 border-t border-[var(--color-border)]" />
                <Row label="سود خالص" value={formatMoney(d.accounting.profit)} bold accent="emerald" />
                {d.accounting.paymentMethod && (
                  <Row label="روش پرداخت" value={PAYMENT_METHOD_LABELS[d.accounting.paymentMethod] || "نقدی"} />
                )}
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
    <div className="text-xs">
      <span className="text-slate-400">{label}: </span>
      <span className="font-semibold text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span
        className={classNames(
          "font-semibold",
          bold && accent === "emerald" && "text-emerald-600 dark:text-emerald-400",
          !bold && "text-slate-700 dark:text-slate-200"
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* -------- Workflow action panel -------- */
function WorkflowPanel({
  d,
  role,
  canRepair,
  canDeliver,
  canAccount,
  isAwaitingParts,
  isAssignedToRepair,
  canDoRepairOps,
  isRepairDone,
  isDelivered,
  isClosed,
  busy,
  action,
}: any) {
  const [partsMode, setPartsMode] = useState<"none" | "yes" | "">("");
  const [invItems, setInvItems] = useState<any[]>([]);
  const [partForm, setPartForm] = useState({
    partName: "",
    partModel: "",
    partPrice: "",
    supplier: "",
    notes: "",
    inventoryItemId: "",
  });
  const [opsForm, setOpsForm] = useState({ operationsDone: "", repairNotes: "", finalCost: d.estimatedCost || "" });

  // Delivery / Accounting forms
  const [deliverForm, setDeliverForm] = useState({
    receivedAmount: d.finalCost || d.estimatedCost || "0",
    laborCost: "0",
    discount: "0",
    tax: "0",
    deposit: d.deposit || "0",
    paymentMethod: "cash",
  });

  const [accForm, setAccForm] = useState({
    receivedAmount: d.accounting?.receivedAmount || d.finalCost || "0",
    partCost: d.accounting?.partCost || "0",
    laborCost: d.accounting?.laborCost || "0",
    discount: d.accounting?.discount || "0",
    tax: d.accounting?.tax || "0",
    deposit: d.accounting?.deposit || d.deposit || "0",
    paymentMethod: d.accounting?.paymentMethod || "cash",
    notes: d.accounting?.notes || "",
  });

  // Fetch inventory items when tech opens parts form
  useEffect(() => {
    if (partsMode === "yes") {
      fetch("/api/inventory")
        .then((r) => r.json())
        .then((res) => setInvItems(res.items || []))
        .catch(() => {});
    }
  }, [partsMode]);

  const selectInventoryItem = (itemId: string) => {
    const item = invItems.find((x) => String(x.id) === String(itemId));
    if (item) {
      setPartForm({
        partName: item.name,
        partModel: item.partModel || "",
        partPrice: String(item.sellPrice || item.buyPrice || 0),
        supplier: item.supplier || "",
        notes: `کد انبار: ${item.sku || item.id}`,
        inventoryItemId: String(item.id),
      });
    } else {
      setPartForm({ ...partForm, inventoryItemId: "" });
    }
  };

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
                partsMode === "yes"
                  ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                  : "border-[var(--color-border)] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <PackageCheck className="mx-auto mb-1 h-5 w-5" /> نیاز به خرید قطعه دارد
            </button>
            <button
              type="button"
              onClick={() => setPartsMode("none")}
              className={classNames(
                "cursor-pointer rounded-xl border p-3 text-center text-xs font-semibold transition-colors",
                partsMode === "none"
                  ? "border-sky-400 bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200"
                  : "border-[var(--color-border)] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <XCircle className="mx-auto mb-1 h-5 w-5" /> نیاز به قطعه نیست
            </button>
          </div>

          {partsMode === "none" && (
            <Button
              className="w-full"
              loading={busy === "noparts"}
              onClick={() => action("noparts", () => api(`/api/devices/${d.id}/parts`, "POST", { needsParts: false }))}
            >
              شروع تعمیر (بدون قطعه)
            </Button>
          )}

          {partsMode === "yes" && (
            <div className="space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
              {invItems.length > 0 && (
                <Field label="انتخاب سریع از موجودی انبار">
                  <Select
                    value={partForm.inventoryItemId}
                    onChange={(e) => selectInventoryItem(e.target.value)}
                    className="text-xs"
                  >
                    <option value="">— ورود دستی قطعه (خارج از انبار) —</option>
                    {invItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({toFa(item.currentStock)} عدد در انبار - {formatMoney(item.sellPrice)})
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              <Field label="نام قطعه *" required>
                <Input
                  value={partForm.partName}
                  onChange={(e) => setPartForm({ ...partForm, partName: e.target.value })}
                  placeholder="مثلاً صفحه نمایش آیفون 13"
                />
              </Field>
              <Field label="مدل / کد قطعه">
                <Input value={partForm.partModel} onChange={(e) => setPartForm({ ...partForm, partModel: e.target.value })} />
              </Field>
              <Field label="قیمت قطعه (تومان) *" required>
                <Input
                  value={partForm.partPrice}
                  onChange={(e) => setPartForm({ ...partForm, partPrice: toFa(e.target.value) })}
                  inputMode="numeric"
                />
              </Field>
              <Field label="تامین‌کننده">
                <Input value={partForm.supplier} onChange={(e) => setPartForm({ ...partForm, supplier: e.target.value })} />
              </Field>
              <p className="text-[11px] text-slate-400">
                در صورت انتخاب از انبار، پس از تایید توسط مدیر خدمات، موجودی قطعه خودکار کسر می‌شود.
              </p>
              <Button
                className="w-full"
                loading={busy === "parts"}
                onClick={() =>
                  action("parts", () => api(`/api/devices/${d.id}/parts`, "POST", { needsParts: true, ...partForm }))
                }
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
          <p className="text-xs font-semibold text-emerald-600">
            ✓ قطعه تایید شد / تعمیر در حال انجام است. عملیات انجام‌شده را ثبت کنید.
          </p>
          <Field label="عملیات انجام‌شده">
            <Textarea
              value={opsForm.operationsDone}
              onChange={(e) => setOpsForm({ ...opsForm, operationsDone: e.target.value })}
              placeholder="مثلاً تعویض صفحه، فلش..."
            />
          </Field>
          <Field label="یادداشت تعمیر">
            <Textarea value={opsForm.repairNotes} onChange={(e) => setOpsForm({ ...opsForm, repairNotes: e.target.value })} />
          </Field>
          <Field label="هزینه نهایی تعمیر (تومان)">
            <Input
              value={opsForm.finalCost}
              onChange={(e) => setOpsForm({ ...opsForm, finalCost: toFa(e.target.value) })}
              inputMode="numeric"
            />
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
        <div className="space-y-3">
          <p className="text-xs font-semibold text-cyan-600">
            ✓ تعمیر تکمیل شد. لطفاً با مشتری تماس بگیرید و دستگاه را تحویل دهید.
          </p>
          <Field label="مجموع مبلغ دریافتی از مشتری (تومان)">
            <Input
              value={deliverForm.receivedAmount}
              onChange={(e) => setDeliverForm({ ...deliverForm, receivedAmount: toFa(e.target.value) })}
              inputMode="numeric"
              className="font-mono"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="اجرت تعمیرات">
              <Input
                value={deliverForm.laborCost}
                onChange={(e) => setDeliverForm({ ...deliverForm, laborCost: toFa(e.target.value) })}
                inputMode="numeric"
              />
            </Field>
            <Field label="تخفیف">
              <Input
                value={deliverForm.discount}
                onChange={(e) => setDeliverForm({ ...deliverForm, discount: toFa(e.target.value) })}
                inputMode="numeric"
              />
            </Field>
            <Field label="بیعانه پرداختی قبلی">
              <Input
                value={deliverForm.deposit}
                onChange={(e) => setDeliverForm({ ...deliverForm, deposit: toFa(e.target.value) })}
                inputMode="numeric"
              />
            </Field>
            <Field label="روش پرداخت">
              <Select
                value={deliverForm.paymentMethod}
                onChange={(e) => setDeliverForm({ ...deliverForm, paymentMethod: e.target.value })}
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
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
        <div className="space-y-3">
          <p className="text-xs font-semibold text-violet-600">
            ✓ دستگاه تحویل شد. اطلاعات مالی را برای تسویه و فاکتور نهایی تایید کنید.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="مبلغ کل دریافتی">
              <Input
                value={accForm.receivedAmount}
                onChange={(e) => setAccForm({ ...accForm, receivedAmount: toFa(e.target.value) })}
                inputMode="numeric"
                className="font-mono"
              />
            </Field>
            <Field label="هزینه قطعات">
              <Input
                value={accForm.partCost}
                onChange={(e) => setAccForm({ ...accForm, partCost: toFa(e.target.value) })}
                inputMode="numeric"
                className="font-mono"
              />
            </Field>
            <Field label="اجرت خدمات">
              <Input
                value={accForm.laborCost}
                onChange={(e) => setAccForm({ ...accForm, laborCost: toFa(e.target.value) })}
                inputMode="numeric"
              />
            </Field>
            <Field label="تخفیف">
              <Input
                value={accForm.discount}
                onChange={(e) => setAccForm({ ...accForm, discount: toFa(e.target.value) })}
                inputMode="numeric"
              />
            </Field>
            <Field label="مالیات VAT">
              <Input
                value={accForm.tax}
                onChange={(e) => setAccForm({ ...accForm, tax: toFa(e.target.value) })}
                inputMode="numeric"
              />
            </Field>
            <Field label="بیعانه کسرشده">
              <Input
                value={accForm.deposit}
                onChange={(e) => setAccForm({ ...accForm, deposit: toFa(e.target.value) })}
                inputMode="numeric"
              />
            </Field>
          </div>
          <Field label="روش پرداخت">
            <Select
              value={accForm.paymentMethod}
              onChange={(e) => setAccForm({ ...accForm, paymentMethod: e.target.value })}
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="توضیحات و اسناد مالی">
            <Input value={accForm.notes} onChange={(e) => setAccForm({ ...accForm, notes: e.target.value })} />
          </Field>
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            سود خالص:{" "}
            {formatMoney(
              Number(String(accForm.receivedAmount).replace(/[^0-9]/g, "")) -
                Number(String(accForm.partCost).replace(/[^0-9]/g, ""))
            )}
          </div>
          <Button
            variant="success"
            className="w-full"
            loading={busy === "settle"}
            onClick={() => action("settle", () => api(`/api/devices/${d.id}/accounting`, "POST", accForm))}
          >
            <Calculator className="h-4 w-4" /> تسویه و بستن تیکت
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
