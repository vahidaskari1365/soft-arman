"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, Button, Input, Field, Badge, Spinner, EmptyState, Modal, StatCard } from "@/components/ui";
import { formatMoney, toFa } from "@/lib/format";
import { Boxes, Plus, Search, AlertTriangle, Trash2, Edit3, Truck, Layers, CheckCircle2 } from "lucide-react";
import { api, useFetch } from "@/lib/client";

export default function InventoryPage() {
  const [tab, setTab] = useState<"items" | "suppliers">("items");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [itemModal, setItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemForm, setItemForm] = useState({
    name: "",
    partModel: "",
    sku: "",
    currentStock: "1",
    minStockLevel: "2",
    buyPrice: "",
    sellPrice: "",
    supplier: "",
    location: "",
  });

  const [supModal, setSupModal] = useState(false);
  const [editingSup, setEditingSup] = useState<any>(null);
  const [supForm, setSupForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    address: "",
    notes: "",
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.set("search", search);

      const [invRes, supRes] = await Promise.all([
        fetch(`/api/inventory?${p.toString()}`).then((r) => r.json()),
        fetch(`/api/suppliers?${p.toString()}`).then((r) => r.json()),
      ]);
      setItems(invRes.items || []);
      setSuppliers(supRes.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadData, 0);
    return () => clearTimeout(timer);
  }, [search]);

  // Inventory Item Handlers
  const openNewItemModal = () => {
    setEditingItem(null);
    setItemForm({
      name: "",
      partModel: "",
      sku: "",
      currentStock: "1",
      minStockLevel: "2",
      buyPrice: "",
      sellPrice: "",
      supplier: suppliers[0]?.name || "",
      location: "",
    });
    setError("");
    setItemModal(true);
  };

  const openEditItemModal = (item: any) => {
    setEditingItem(item);
    setItemForm({
      name: item.name || "",
      partModel: item.partModel || "",
      sku: item.sku || "",
      currentStock: String(item.currentStock ?? 0),
      minStockLevel: String(item.minStockLevel ?? 2),
      buyPrice: String(item.buyPrice || ""),
      sellPrice: String(item.sellPrice || ""),
      supplier: item.supplier || "",
      location: item.location || "",
    });
    setError("");
    setItemModal(true);
  };

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name) {
      setError("نام قطعه الزامی است");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (editingItem) {
        await api(`/api/inventory/${editingItem.id}`, "PATCH", itemForm);
      } else {
        await api("/api/inventory", "POST", itemForm);
      }
      setItemModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || "خطا در ذخیره قطعه");
    } finally {
      setBusy(false);
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm("آیا از حذف این قطعه اطمینان دارید؟")) return;
    try {
      await api(`/api/inventory/${id}`, "DELETE");
      await loadData();
    } catch (err: any) {
      alert(err.message || "خطا در حذف قطعه");
    }
  };

  // Supplier Handlers
  const openNewSupModal = () => {
    setEditingSup(null);
    setSupForm({ name: "", contactPerson: "", phone: "", address: "", notes: "" });
    setError("");
    setSupModal(true);
  };

  const openEditSupModal = (sup: any) => {
    setEditingSup(sup);
    setSupForm({
      name: sup.name || "",
      contactPerson: sup.contactPerson || "",
      phone: sup.phone || "",
      address: sup.address || "",
      notes: sup.notes || "",
    });
    setError("");
    setSupModal(true);
  };

  const saveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supForm.name) {
      setError("نام تامین‌کننده الزامی است");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (editingSup) {
        await api(`/api/suppliers/${editingSup.id}`, "PATCH", supForm);
      } else {
        await api("/api/suppliers", "POST", supForm);
      }
      setSupModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || "خطا در ذخیره تامین‌کننده");
    } finally {
      setBusy(false);
    }
  };

  const deleteSupplier = async (id: number) => {
    if (!confirm("آیا از حذف این تامین‌کننده اطمینان دارید؟")) return;
    try {
      await api(`/api/suppliers/${id}`, "DELETE");
      await loadData();
    } catch (err: any) {
      alert(err.message || "خطا در حذف تامین‌کننده");
    }
  };

  const lowStockCount = items.filter((i) => (i.currentStock || 0) <= (i.minStockLevel || 0)).length;
  const totalStockValue = items.reduce((sum, i) => sum + (Number(i.buyPrice) || 0) * (Number(i.currentStock) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-slate-800 dark:text-white">
            <Boxes className="h-6 w-6 text-sky-600" /> مدیریت انبار و تامین‌کنندگان
          </h1>
          <p className="mt-1 text-xs text-slate-500">انبارداری قطعات، هشدار نقطه سفارش و مدیریت تامین‌کنندگان</p>
        </div>
        <div className="flex items-center gap-2">
          {tab === "items" ? (
            <Button onClick={openNewItemModal} size="sm" variant="primary">
              <Plus className="h-4 w-4" /> افزودن قطعه جدید
            </Button>
          ) : (
            <Button onClick={openNewSupModal} size="sm" variant="primary">
              <Plus className="h-4 w-4" /> افزودن تامین‌کننده
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="تعداد کل اقلام انبار" value={toFa(items.length)} accent="sky" icon={<Layers className="h-5 w-5" />} />
        <StatCard
          label="هشدار کمبود موجودی"
          value={toFa(lowStockCount)}
          accent={lowStockCount > 0 ? "rose" : "emerald"}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard label="ارزش ریالی موجودی خرید" value={formatMoney(totalStockValue)} accent="amber" icon={<Boxes className="h-5 w-5" />} />
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("items")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              tab === "items"
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <Boxes className="h-4 w-4" /> قطعات انبار ({toFa(items.length)})
          </button>
          <button
            onClick={() => setTab("suppliers")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              tab === "suppliers"
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <Truck className="h-4 w-4" /> تامین‌کنندگان ({toFa(suppliers.length)})
          </button>
        </div>
        <div className="relative w-full sm:w-72">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو نام، کد قطعه، تامین‌کننده..."
            className="w-full pl-9 pr-3 text-xs"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Main Table View */}
      {loading ? (
        <div className="grid place-items-center py-24">
          <Spinner />
        </div>
      ) : tab === "items" ? (
        items.length === 0 ? (
          <EmptyState title="قطعه‌ای در انبار یافت نشد" hint="با استفاده از دکمه «افزودن قطعه جدید»، اولین قلم را به انبار اضافه کنید." />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                  <tr>
                    <th className="p-3">کد / SKU</th>
                    <th className="p-3">نام قطعه</th>
                    <th className="p-3">مدل سازگار</th>
                    <th className="p-3">موجودی لحظه‌ای</th>
                    <th className="p-3">قیمت خرید</th>
                    <th className="p-3">قیمت فروش</th>
                    <th className="p-3">تامین‌کننده</th>
                    <th className="p-3">محل نگهداری</th>
                    <th className="p-3 text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((i) => {
                    const isLow = (i.currentStock || 0) <= (i.minStockLevel || 0);
                    return (
                      <tr key={i.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold">{i.sku || "—"}</td>
                        <td className="p-3 font-bold text-slate-800 dark:text-white">{i.name}</td>
                        <td className="p-3 text-slate-500">{i.partModel || "—"}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-mono text-sm font-bold ${isLow ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"}`}>
                              {toFa(i.currentStock)}
                            </span>
                            {isLow && (
                              <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">کمبود موجودی</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3">{formatMoney(i.buyPrice)}</td>
                        <td className="p-3 font-bold text-slate-800 dark:text-white">{formatMoney(i.sellPrice)}</td>
                        <td className="p-3 text-slate-500">{i.supplier || "—"}</td>
                        <td className="p-3 text-slate-500">{i.location || "—"}</td>
                        <td className="p-3 text-left">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditItemModal(i)}
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-sky-600 dark:hover:bg-slate-800"
                              title="ویرایش"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteItem(i.id)}
                              className="rounded p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : suppliers.length === 0 ? (
        <EmptyState title="تامین‌کننده‌ای ثبت نشده است" hint="با دکمه «افزودن تامین‌کننده» اولین فروشنده قطعات را ثبت کنید." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <Card key={s.id} className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-extrabold text-slate-800 dark:text-white">{s.name}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditSupModal(s)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-sky-600 dark:hover:bg-slate-800"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteSupplier(s.id)}
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  <strong className="text-slate-700 dark:text-slate-300">رابط: </strong>
                  {s.contactPerson || "—"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  <strong className="text-slate-700 dark:text-slate-300">تلفن: </strong>
                  <span className="font-mono">{toFa(s.phone) || "—"}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  <strong className="text-slate-700 dark:text-slate-300">آدرس: </strong>
                  {s.address || "—"}
                </p>
                {s.notes && <p className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">{s.notes}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Inventory Item Modal */}
      <Modal open={itemModal} onClose={() => setItemModal(false)} title={editingItem ? "ویرایش قطعه انبار" : "افزودن قطعه جدید به انبار"}>
        <form onSubmit={saveItem} className="space-y-4">
          {error && <div className="rounded-lg bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="نام قطعه *" required>
              <Input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="مثال: ال‌سی‌دی آیفون 13" />
            </Field>
            <Field label="کد قطعه / SKU">
              <Input value={itemForm.sku} onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })} placeholder="SKU-1001" className="font-mono" />
            </Field>
            <Field label="مدل سازگار">
              <Input value={itemForm.partModel} onChange={(e) => setItemForm({ ...itemForm, partModel: e.target.value })} placeholder="iPhone 13, 13 Pro" />
            </Field>
            <Field label="تامین‌کننده">
              <Input value={itemForm.supplier} onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })} placeholder="نام فروشگاه / تامین‌کننده" />
            </Field>
            <Field label="موجودی لحظه‌ای *" required>
              <Input
                type="number"
                value={itemForm.currentStock}
                onChange={(e) => setItemForm({ ...itemForm, currentStock: e.target.value })}
                className="font-mono"
              />
            </Field>
            <Field label="نقطه سفارش (Low Stock Alert) *" required>
              <Input
                type="number"
                value={itemForm.minStockLevel}
                onChange={(e) => setItemForm({ ...itemForm, minStockLevel: e.target.value })}
                className="font-mono"
              />
            </Field>
            <Field label="قیمت خرید (ریال)">
              <Input value={itemForm.buyPrice} onChange={(e) => setItemForm({ ...itemForm, buyPrice: e.target.value })} className="font-mono" />
            </Field>
            <Field label="قیمت فروش (ریال)">
              <Input value={itemForm.sellPrice} onChange={(e) => setItemForm({ ...itemForm, sellPrice: e.target.value })} className="font-mono" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="محل نگهداری در انبار">
                <Input value={itemForm.location} onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })} placeholder="قفسه B - طبقه ۲" />
              </Field>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => setItemModal(false)}>
              انصراف
            </Button>
            <Button type="submit" variant="primary" loading={busy}>
              {editingItem ? "ذخیره تغییرات" : "افزودن به انبار"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Supplier Modal */}
      <Modal open={supModal} onClose={() => setSupModal(false)} title={editingSup ? "ویرایش تامین‌کننده" : "افزودن تامین‌کننده جدید"}>
        <form onSubmit={saveSupplier} className="space-y-4">
          {error && <div className="rounded-lg bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="نام تامین‌کننده *" required>
              <Input value={supForm.name} onChange={(e) => setSupForm({ ...supForm, name: e.target.value })} placeholder="مثال: فروشگاه قطعات همراه" />
            </Field>
            <Field label="رابط / مسئول">
              <Input value={supForm.contactPerson} onChange={(e) => setSupForm({ ...supForm, contactPerson: e.target.value })} placeholder="آقای محمدی" />
            </Field>
            <Field label="شماره تماس">
              <Input value={supForm.phone} onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })} className="font-mono" placeholder="09120000000" />
            </Field>
            <Field label="آدرس">
              <Input value={supForm.address} onChange={(e) => setSupForm({ ...supForm, address: e.target.value })} placeholder="تهران، خیابان جمهوری..." />
            </Field>
            <div className="sm:col-span-2">
              <Field label="یادداشت و اطلاعات حساب">
                <Input value={supForm.notes} onChange={(e) => setSupForm({ ...supForm, notes: e.target.value })} placeholder="شماره حساب یا شرایط خرید اقساطی" />
              </Field>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => setSupModal(false)}>
              انصراف
            </Button>
            <Button type="submit" variant="primary" loading={busy}>
              {editingSup ? "ذخیره تغییرات" : "ثبت تامین‌کننده"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
