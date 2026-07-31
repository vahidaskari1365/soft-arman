"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, Spinner, Button, Badge, Modal, Input, Field, Select, EmptyState } from "@/components/ui";
import { ROLE_LABELS } from "@/db/schema";
import { api } from "@/lib/client";
import { formatDate, toFa, roleColor, classNames } from "@/lib/format";
import { UserPlus, Users as UsersIcon, Pencil, Trash2 } from "lucide-react";

const ROLES = Object.keys(ROLE_LABELS);

export default function UsersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ username: "", fullName: "", role: "repair_technician", phone: "", password: "", active: true });

  function load() {
    setLoading(true);
    fetch("/api/users").then((r) => r.json()).then((d) => setItems(d.items || [])).finally(() => setLoading(false));
  }
  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, []);

  function openCreate() {
    setEdit(null);
    setForm({ username: "", fullName: "", role: "repair_technician", phone: "", password: "", active: true });
    setError("");
    setOpen(true);
  }
  function openEdit(u: any) {
    setEdit(u);
    setForm({ username: u.username, fullName: u.fullName, role: u.role, phone: u.phone || "", password: "", active: u.active });
    setError("");
    setOpen(true);
  }

  async function save() {
    setError("");
    setSaving(true);
    try {
      if (edit) {
        const patch: any = { fullName: form.fullName, role: form.role, phone: form.phone, active: form.active };
        if (form.password) patch.password = form.password;
        await api(`/api/users/${edit.id}`, "PATCH", patch);
      } else {
        if (!form.password) throw new Error("رمز عبور الزامی است");
        await api("/api/users", "POST", form);
      }
      setOpen(false);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(u: any) {
    if (!confirm(`حذف کاربر «${u.fullName}»؟`)) return;
    try {
      await api(`/api/users/${u.id}`, "DELETE");
      load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-extrabold text-slate-800 dark:text-white">
            <UsersIcon className="h-5 w-5 text-sky-600" /> مدیریت کاربران
          </h1>
          <p className="mt-1 text-xs text-slate-500">تعریف کاربر و مدیریت دسترسی‌ها</p>
        </div>
        <Button onClick={openCreate}>
          <UserPlus className="h-4 w-4" /> کاربر جدید
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="grid place-items-center py-20"><Spinner /></div>
        ) : items.length === 0 ? (
          <EmptyState title="کاربری وجود ندارد" icon={<UsersIcon className="h-10 w-10" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-right text-xs">
              <thead>
                <tr className="text-slate-400">
                  <th className="p-3 font-medium">نام</th>
                  <th className="p-3 font-medium">نام کاربری</th>
                  <th className="p-3 font-medium">نقش</th>
                  <th className="p-3 font-medium">تلفن</th>
                  <th className="p-3 font-medium">وضعیت</th>
                  <th className="p-3 font-medium">تاریخ ایجاد</th>
                  <th className="p-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className="border-t border-[var(--color-border)] hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-200">{u.fullName}</td>
                    <td className="p-3 font-mono text-slate-500">{u.username}</td>
                    <td className="p-3"><Badge className={classNames(roleColor(u.role))}>{ROLE_LABELS[u.role]}</Badge></td>
                    <td className="p-3 text-slate-500">{toFa(u.phone || "—")}</td>
                    <td className="p-3">
                      <Badge className={u.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200" : "bg-slate-100 text-slate-500"}>
                        {u.active ? "فعال" : "غیرفعال"}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-400">{formatDate(u.createdAt)}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(u)} className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-900/30"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => remove(u)} className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? "ویرایش کاربر" : "کاربر جدید"}>
        <div className="space-y-3">
          <Field label="نام و نام خانوادگی" required>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <Field label="نام کاربری" required>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={!!edit} />
          </Field>
          <Field label="نقش" required>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </Select>
          </Field>
          <Field label="تلفن">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: toFa(e.target.value) })} inputMode="tel" />
          </Field>
          <Field label={edit ? "رمز عبور جدید (اختیاری)" : "رمز عبور"} required={!edit}>
            <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="text" placeholder={edit ? "برای عدم تغییر خالی بگذارید" : ""} />
          </Field>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-sky-600" />
            حساب فعال است
          </label>
          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
            <Button loading={saving} onClick={save}>{edit ? "ذخیره تغییرات" : "ایجاد کاربر"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
