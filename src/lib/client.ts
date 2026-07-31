"use client";

import { useCallback, useEffect, useState } from "react";
import * as XLSX from "xlsx";

export function useFetch<T = any>(url: string | null, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string>("");
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    const timer = setTimeout(() => {
      if (!alive) return;
      setLoading(true);
      fetch(url)
        .then(async (r) => {
          if (!r.ok) throw new Error("خطا در دریافت اطلاعات");
          return r.json();
        })
        .then((d) => {
          if (alive) {
            setData(d);
            setError("");
          }
        })
        .catch((e) => alive && setError(e.message || "خطا"))
        .finally(() => alive && setLoading(false));
    }, 0);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, reloadKey, ...deps]);

  return { data, loading, error, refetch };
}

export async function api(url: string, method = "GET", body?: any) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "عملیات ناموفق بود");
  return data;
}

/** Export an array of row objects to a .xlsx file with a given sheet name. */
export function exportToExcel(rows: Record<string, any>[], filename: string, sheetName = "گزارش") {
  const ws = XLSX.utils.json_to_sheet(rows);
  // RTL view
  if (!ws["!cols"]) ws["!cols"] = [];
  ws["!sheetViews"] = [{ RTL: true }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
