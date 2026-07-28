"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";

export const CHART_COLORS = ["#0284c7", "#7c3aed", "#0d9488", "#d97706", "#dc2626", "#2563eb", "#9333ea", "#16a34a", "#64748b", "#db2777"];

export function StatusDonut({ data }: { data: { name: string; value: number }[] }) {
  const filtered = data.filter((d) => d.value > 0);
  if (filtered.length === 0)
    return <div className="grid h-56 place-items-center text-xs text-slate-400">داده‌ای موجود نیست</div>;
  return (
    <ResponsiveContainer width="100%" height={224}>
      <PieChart>
        <Pie data={filtered} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {filtered.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "none", fontFamily: "Vazirmatn", fontSize: 12 }}
          formatter={(v: any) => [`${Number(v).toLocaleString("fa-IR")} عدد`, "تعداد"]}
        />
        <Legend wrapperStyle={{ fontFamily: "Vazirmatn", fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TechBar({ data, dataKey = "total", name = "تعداد" }: { data: any[]; dataKey?: string; name?: string }) {
  if (!data || data.length === 0)
    return <div className="grid h-56 place-items-center text-xs text-slate-400">داده‌ای موجود نیست</div>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
        <XAxis dataKey="name" tick={{ fontFamily: "Vazirmatn", fontSize: 11, fill: "#64748b" }} interval={0} angle={-12} textAnchor="end" height={60} />
        <YAxis tick={{ fontFamily: "Vazirmatn", fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontFamily: "Vazirmatn", fontSize: 12 }} cursor={{ fill: "rgba(2,132,199,0.08)" }} />
        <Bar dataKey={dataKey} name={name} radius={[6, 6, 0, 0]} fill="#0284c7" maxBarSize={46} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TimelineLine({ data }: { data: { day: string; count: number }[] }) {
  if (!data || data.length === 0)
    return <div className="grid h-56 place-items-center text-xs text-slate-400">داده‌ای موجود نیست</div>;
  const formatted = data.map((d) => ({ ...d, label: new Date(d.day).toLocaleDateString("fa-IR", { day: "numeric", month: "short" }) }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={formatted} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
        <XAxis dataKey="label" tick={{ fontFamily: "Vazirmatn", fontSize: 10, fill: "#64748b" }} />
        <YAxis tick={{ fontFamily: "Vazirmatn", fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontFamily: "Vazirmatn", fontSize: 12 }} />
        <Line type="monotone" dataKey="count" name="تعداد" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3, fill: "#0284c7" }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
