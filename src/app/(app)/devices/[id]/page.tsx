"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, Button, Input, Field, Select, Textarea, Badge, Spinner, Modal } from "@/components/ui";
import ShamsiDatePicker from "@/components/shamsi-date-picker";
import { STATUS_LABELS, WARRANTY_STATUS_LABELS, PAYMENT_METHOD_LABELS, DEVICE_TYPES, PHONE_BRANDS } from "@/db/schema";
import { api, useFetch } from "@/lib/client";
import { toFa, toEn, formatNumber, formatMoney, formatMoneyInput, parseMoneyInput, formatDate, formatDateTime, statusColor, classNames, formatShortDate } from "@/lib/format";
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
  Pencil,
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

  // Edit form
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [techs, setTechs] = useState<any[]>([]);

  function setEditField(k: string, v: string) {
    setEditForm((f: any) => ({ ...f, [k]: v }));
  }

  function openEdit() {
    setEditForm({
      customerName: d?.customerName || "",
      customerPhone: d?.customerPhone || "",
      customerPhone2: d?.customerPhone2 || "",
      nationalId: d?.customerNationalId || "",
      customerAddress: d?.customerAddress || "",
      deviceType: d?.deviceType || "",
      brand: d?.brand || "",
      model: d?.model || "",
      serialNumber: d?.serialNumber || "",
      devicePassword: d?.devicePassword || "",
      accessories: d?.accessories || "",
      problem: d?.problem || "",
      estimatedCost: String(d?.estimatedCost || "0"),
      deposit: String(d?.deposit || "0"),
      warrantyStatus: d?.warrantyStatus || "out_of_warranty",
      warrantyDays: String(d?.warrantyDays || "0"),
      deadlineDate: d?.deadlineDate || "",
      deliveryType: d?.deliveryType || "in_person",
      repairTechnicianId: String(d?.repairTechnicianId || ""),
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    setSavingEdit(true);
    setError("");
    try {
      await api(`/api/devices/${d.id}`, "PATCH", editForm);
      setEditOpen(false);
      await refetch();
    } catch (err: any) {
      setError(err.message || "خطا در ویرایش اطلاعات");
    } finally {
      setSavingEdit(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(Date.now());
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => setMe(d.user));
      fetch("/api/technicians")
        .then((r) => r.json())
        .then((res) => setTechs(res.repair || []))
        .catch(() => {});
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
  const canEdit = role === "intake_technician" || role === "service_manager" || role === "super_admin";

  const isAwaitingParts = d.status === "awaiting_parts";
  const isAssignedToRepair = d.status === "assigned" || d.status === "registered";
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
          {canEdit && (
            <Button variant="outline" size="sm" onClick={openEdit}>
              <Pencil className="h-4 w-4" /> ویرایش اطلاعات
            </Button>
          )}
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
              {d.warrantyDays > 0 && <Info label="تعیین حدود زمان تعمیر" value={`${formatNumber(d.warrantyDays)} روز`} />}
              {d.deadlineDate && <Info label="تاریخ تخمینی تحویل دستگاه" value={formatShortDate(d.deadlineDate)} />}
              <Info label="نوع تحویل" value={d.deliveryType === "shipping" ? "ارسالی" : "حضوری"} />
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
              <CardHeader title="قطعات درخواستی" subtitle={`تعداد: ${formatNumber(d.parts.length)}`} />
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
            setError={setError}
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

      {/* Edit intake form modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="ویرایش اطلاعات پذیرش" size="lg">
        <div className="grid max-h-[70vh] gap-4 overflow-y-auto p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> اطلاعات مشتری
            </p>
          </div>
          <Field label="نام و نام خانوادگی">
            <Input value={editForm.customerName || ""} onChange={(e) => setEditField("customerName", e.target.value)} />
          </Field>
          <Field label="شماره تماس">
            <Input value={editForm.customerPhone || ""} onChange={(e) => setEditField("customerPhone", e.target.value)} inputMode="tel" className="font-mono" />
          </Field>
          <Field label="شماره تماس ثانوی">
            <Input value={editForm.customerPhone2 || ""} onChange={(e) => setEditField("customerPhone2", e.target.value)} inputMode="tel" className="font-mono" />
          </Field>
          <Field label="کد ملی">
            <Input value={editForm.nationalId || ""} onChange={(e) => setEditField("nationalId", e.target.value)} inputMode="numeric" className="font-mono" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="آدرس">
              <Input value={editForm.customerAddress || ""} onChange={(e) => setEditField("customerAddress", e.target.value)} />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
              <Wrench className="h-4 w-4 text-sky-600" /> مشخصات دستگاه و عیب
            </p>
          </div>
          <Field label="نوع دستگاه">
            <Select value={editForm.deviceType || ""} onChange={(e) => setEditField("deviceType", e.target.value)}>
              {DEVICE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="مارک دستگاه">
            <Select value={editForm.brand || ""} onChange={(e) => setEditField("brand", e.target.value)}>
              <option value="">انتخاب مارک</option>
              {Object.keys(PHONE_BRANDS).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
              <option value="سایر">سایر</option>
            </Select>
          </Field>
          <Field label="مدل دستگاه">
            <Input value={editForm.model || ""} onChange={(e) => setEditField("model", e.target.value)} />
          </Field>
          <Field label="شماره سریال / IMEI">
            <Input value={editForm.serialNumber || ""} onChange={(e) => setEditField("serialNumber", e.target.value)} className="font-mono" />
          </Field>
          <Field label="رمز عبور / PIN">
            <Input value={editForm.devicePassword || ""} onChange={(e) => setEditField("devicePassword", e.target.value)} />
          </Field>
          <Field label="لوازم همراه">
            <Input value={editForm.accessories || ""} onChange={(e) => setEditField("accessories", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="شرح مشکل">
              <Textarea value={editForm.problem || ""} onChange={(e) => setEditField("problem", e.target.value)} />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
              <Calendar className="h-4 w-4 text-violet-600" /> گارانتی، زمان تحویل و امور مالی
            </p>
          </div>
          <Field label="وضعیت گارانتی">
            <Select value={editForm.warrantyStatus || "out_of_warranty"} onChange={(e) => setEditField("warrantyStatus", e.target.value)}>
              {Object.entries(WARRANTY_STATUS_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </Select>
          </Field>
          <Field label="تعیین حدود زمان تعمیر (روز)">
            <Input value={editForm.warrantyDays || "0"} onChange={(e) => setEditField("warrantyDays", toEn(e.target.value).replace(/[^0-9]/g, ""))} inputMode="numeric" className="font-mono" />
          </Field>
          <Field label="نوع تحویل">
            <Select value={editForm.deliveryType || "in_person"} onChange={(e) => setEditField("deliveryType", e.target.value)}>
              <option value="in_person">حضوری</option>
              <option value="shipping">ارسالی</option>
            </Select>
          </Field>
          <Field label="کارشناس تعمیر (تغییر ارجاع)">
            <Select value={editForm.repairTechnicianId || ""} onChange={(e) => setEditField("repairTechnicianId", e.target.value)}>
              <option value="">— انتخاب کارشناس —</option>
              {techs.map((t: any) => (
                <option key={t.id} value={t.id}>{t.fullName}</option>
              ))}
            </Select>
          </Field>
          <Field label="تاریخ تخمینی تحویل دستگاه">
            <ShamsiDatePicker value={editForm.deadlineDate || ""} onChange={(v) => setEditField("deadlineDate", v)} placeholder="۱۴۰۳/۰۵/۱۵" />
          </Field>
          <Field label="هزینه تخمینی تعمیر (تومان)">
            <Input value={formatMoneyInput(editForm.estimatedCost || "0")} onChange={(e) => setEditField("estimatedCost", parseMoneyInput(e.target.value))} inputMode="numeric" className="font-mono" />
          </Field>
          <Field label="بیعانه / پیش‌پرداخت (تومان)">
            <Input value={formatMoneyInput(editForm.deposit || "0")} onChange={(e) => setEditField("deposit", parseMoneyInput(e.target.value))} inputMode="numeric" className="font-mono" />
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] p-4">
          <Button variant="outline" onClick={() => setEditOpen(false)}>انصراف</Button>
          <Button loading={savingEdit} onClick={saveEdit}>
            <CheckCircle2 className="h-4 w-4" /> ثبت ویرایش
          </Button>
        </div>
      </Modal>
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
  setError,
}: any) {
  const [partsMode, setPartsMode] = useState<"none" | "yes" | "">("");
  const [invItems, setInvItems] = useState<any[]>([]);
  const [partsList, setPartsList] = useState<{ id: number; partName: string; partModel: string; partPrice: string; supplier: string; notes: string; inventoryItemId: string }[]>([]);
  const [opsForm, setOpsForm] = useState({ operationsDone: "", repairNotes: "", finalCost: d.estimatedCost || "" });

  // Delivery / Accounting forms
  const [deliverForm, setDeliverForm] = useState({
    receivedAmount: String(Number(d.finalCost || 0) || Number(d.estimatedCost || 0) || 0),
    laborCost: "0",
    discount: "0",
    tax: "0",
    deposit: d.deposit || "0",
    paymentMethod: "cash",
  });

  const [accForm, setAccForm] = useState({
    receivedAmount: String(Number(d.accounting?.receivedAmount || 0) || Number(d.finalCost || 0) || Number(d.estimatedCost || 0) || 0),
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

  const selectInventoryItem = (partId: number, itemId: string) => {
    const item = invItems.find((x) => String(x.id) === String(itemId));
    setPartsList((prev) =>
      prev.map((p) => {
        if (p.id !== partId) return p;
        if (item) {
          return {
            ...p,
            partName: item.name,
            partModel: item.partModel || "",
            partPrice: String(item.sellPrice || item.buyPrice || 0),
            supplier: item.supplier || "",
            notes: `کد انبار: ${item.sku || item.id}`,
            inventoryItemId: String(item.id),
          };
        }
        return { ...p, inventoryItemId: "" };
      })
    );
  };

  function addPart() {
    setPartsList((prev) => [
      ...prev,
      { id: Date.now(), partName: "", partModel: "", partPrice: "", supplier: "", notes: "", inventoryItemId: "" },
    ]);
  }

  function removePart(id: number) {
    setPartsList((prev) => prev.filter((p) => p.id !== id));
  }

  function updatePart(id: number, field: string, value: string) {
    setPartsList((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  async function submitParts() {
    const validParts = partsList.filter((p) => p.partName.trim());
    if (validParts.length === 0) {
      setError("حداقل یک قطعه وارد کنید");
      return;
    }
    await action("parts", async () => {
      for (const part of validParts) {
        await api(`/api/devices/${d.id}/parts`, "POST", {
          needsParts: true,
          partName: part.partName,
          partModel: part.partModel,
          partPrice: part.partPrice,
          supplier: part.supplier,
          notes: part.notes,
          inventoryItemId: part.inventoryItemId || undefined,
        });
      }
    });
  }

  // nothing actionable
  if (d.status === "cancelled")
    return (
      <Card className="p-5 text-center">
        <XCircle className="mx-auto mb-2 h-8 w-8 text-rose-500" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">این دستگاه لغو شده است (انصراف از تعمیر)</p>
        <p className="mt-1 text-xs text-slate-400">تاریخچه ثبت‌شده در تایم‌لاین قابل مشاهده است.</p>
      </Card>
    );

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
        <p className="mt-1 text-xs text-slate-400">پس از تایید کارشناس حسابداری، عملیات تعمیر باز می‌شود.</p>
        {canRepair && (
          <Button variant="danger" className="mt-4 w-full" loading={busy === "cancel"} onClick={cancelRepair}>
            <XCircle className="h-4 w-4" /> انصراف از تعمیر
          </Button>
        )}
      </Card>
    );

  function cancelRepair() {
    const reason = window.prompt("در صورت تمایل دلیل انصراف مشتری را وارد کنید (اختیاری):");
    if (reason === null) return;
    action("cancel", () => api(`/api/devices/${d.id}/cancel`, "POST", { note: reason?.trim() || undefined }));
  }

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
              onClick={() => { setPartsMode("yes"); if (partsList.length === 0) addPart(); }}
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
              onClick={() => { setPartsMode("none"); setPartsList([]); }}
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
            <div className="space-y-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
              {invItems.length > 0 && partsList.length > 0 && (
                <Field label="انتخاب سریع از موجودی انبار (برای قطعه آخر)">
                  <Select
                    value={partsList[partsList.length - 1]?.inventoryItemId || ""}
                    onChange={(e) => selectInventoryItem(partsList[partsList.length - 1].id, e.target.value)}
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

              {partsList.map((part, idx) => (
                <div key={part.id} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/60">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">قطعه {idx + 1}</span>
                    {partsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePart(part.id)}
                        className="cursor-pointer rounded p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label="نام قطعه *">
                      <Input
                        value={part.partName}
                        onChange={(e) => updatePart(part.id, "partName", e.target.value)}
                        placeholder="مثلاً صفحه نمایش آیفون 13"
                        className="text-xs"
                      />
                    </Field>
                    <Field label="مدل / کد قطعه">
                      <Input
                        value={part.partModel}
                        onChange={(e) => updatePart(part.id, "partModel", e.target.value)}
                        className="text-xs"
                      />
                    </Field>
                    <Field label="قیمت قطعه (تومان) *">
                      <Input
                        value={formatMoneyInput(part.partPrice)}
                        onChange={(e) => updatePart(part.id, "partPrice", parseMoneyInput(e.target.value))}
                        inputMode="numeric"
                        className="text-xs font-mono"
                      />
                    </Field>
                    <Field label="تامین‌کننده">
                      <Input
                        value={part.supplier}
                        onChange={(e) => updatePart(part.id, "supplier", e.target.value)}
                        className="text-xs"
                      />
                    </Field>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addPart}
                className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 p-2 text-xs font-semibold text-slate-500 hover:border-sky-400 hover:text-sky-600 transition-colors dark:border-slate-600 dark:hover:border-sky-500"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                افزودن قطعه دیگر
              </button>

              <p className="text-[11px] text-slate-400">
                در صورت انتخاب از انبار، پس از تایید توسط کارشناس حسابداری، موجودی قطعه خودکار کسر می‌شود.
              </p>
              <Button
                className="w-full"
                loading={busy === "parts"}
                onClick={submitParts}
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
              value={formatMoneyInput(deliverForm.receivedAmount)}
              onChange={(e) => setDeliverForm({ ...deliverForm, receivedAmount: parseMoneyInput(e.target.value) })}
              inputMode="numeric"
              className="font-mono"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="اجرت تعمیرات">
              <Input
                value={formatMoneyInput(deliverForm.laborCost)}
                onChange={(e) => setDeliverForm({ ...deliverForm, laborCost: parseMoneyInput(e.target.value) })}
                inputMode="numeric"
              />
            </Field>
            <Field label="تخفیف">
              <Input
                value={formatMoneyInput(deliverForm.discount)}
                onChange={(e) => setDeliverForm({ ...deliverForm, discount: parseMoneyInput(e.target.value) })}
                inputMode="numeric"
              />
            </Field>
            <Field label="بیعانه پرداختی قبلی">
              <Input
                value={formatMoneyInput(deliverForm.deposit)}
                onChange={(e) => setDeliverForm({ ...deliverForm, deposit: parseMoneyInput(e.target.value) })}
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
          <Button
            variant="outline"
            className="w-full"
            loading={busy === "return"}
            onClick={() => {
              const ok = window.confirm("آیا این دستگاه به کارشناس تعمیرات برگردانده شود؟");
              if (!ok) return;
              action("return", () => api(`/api/devices/${d.id}/return-to-repair`, "POST", {}));
            }}
          >
            <Wrench className="h-4 w-4" /> برگشت به کارشناس تعمیرات
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
                value={formatMoneyInput(accForm.receivedAmount)}
                onChange={(e) => setAccForm({ ...accForm, receivedAmount: parseMoneyInput(e.target.value) })}
                inputMode="numeric"
                className="font-mono"
              />
            </Field>
            <Field label="هزینه قطعات">
              <Input
                value={formatMoneyInput(accForm.partCost)}
                onChange={(e) => setAccForm({ ...accForm, partCost: parseMoneyInput(e.target.value) })}
                inputMode="numeric"
                className="font-mono"
              />
            </Field>
            <Field label="اجرت خدمات">
              <Input
                value={formatMoneyInput(accForm.laborCost)}
                onChange={(e) => setAccForm({ ...accForm, laborCost: parseMoneyInput(e.target.value) })}
                inputMode="numeric"
              />
            </Field>
            <Field label="تخفیف">
              <Input
                value={formatMoneyInput(accForm.discount)}
                onChange={(e) => setAccForm({ ...accForm, discount: parseMoneyInput(e.target.value) })}
                inputMode="numeric"
              />
            </Field>
            <Field label="مالیات VAT">
              <Input
                value={formatMoneyInput(accForm.tax)}
                onChange={(e) => setAccForm({ ...accForm, tax: parseMoneyInput(e.target.value) })}
                inputMode="numeric"
              />
            </Field>
            <Field label="بیعانه کسرشده">
              <Input
                value={formatMoneyInput(accForm.deposit)}
                onChange={(e) => setAccForm({ ...accForm, deposit: parseMoneyInput(e.target.value) })}
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

      {(canRepair && (isAssignedToRepair || canDoRepairOps)) && (
        <div className="mt-4 border-t border-dashed border-[var(--color-border)] pt-3">
          <Button variant="danger" className="w-full" loading={busy === "cancel"} onClick={cancelRepair}>
            <XCircle className="h-4 w-4" /> انصراف از تعمیر
          </Button>
          <p className="mt-1 text-center text-[11px] text-slate-400">
            در صورت انصراف مشتری، وضعیت دستگاه «لغو شده» ثبت و در تاریخچه عملیات ذخیره می‌شود.
          </p>
        </div>
      )}
    </Card>
  );
}
