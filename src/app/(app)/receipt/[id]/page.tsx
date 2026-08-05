"use client";

import { use, useEffect, useState } from "react";
import { Button, Spinner } from "@/components/ui";
import { ReceiptView } from "@/components/receipt-view";
import { Printer, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [d, setD] = useState<any>(null);
  const [cfg, setCfg] = useState<any>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/devices/${id}`).then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([dev, c, me]) => {
      setD(dev);
      setCfg(c);
      setUser(me?.user ?? null);
      setLoading(false);
    });
  }, [id]);

  // Auto-print if ?autoPrint=true
  useEffect(() => {
    if (!loading && d) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("autoPrint") === "true") {
        const timer = setTimeout(() => {
          window.print();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, d]);

  if (loading || !d) return <div className="grid place-items-center py-32"><Spinner /></div>;

  const company = cfg.companyName || "مرکز خدمات پس از فروش";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href={`/devices/${d.id}`} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-sky-600">
          <ArrowRight className="h-3.5 w-3.5" /> بازگشت به دستگاه
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/invoice/${d.id}`}>
            <Button variant="outline">
              <Printer className="h-4 w-4" /> فاکتور نهایی
            </Button>
          </Link>
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> چاپ رسید (۲ نسخه - A5)
          </Button>
        </div>
      </div>
      <ReceiptView copyLabel="نسخه مشتری" d={d} cfg={cfg} company={company} currentUserName={user?.fullName} />
      <ReceiptView copyLabel="نسخه مرکز" d={d} cfg={cfg} company={company} currentUserName={user?.fullName} />
    </div>
  );
}