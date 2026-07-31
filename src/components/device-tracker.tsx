"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Wrench, Truck, CreditCard } from "lucide-react";

interface Stage {
  key: string;
  label: string;
  icon: React.ReactNode;
  time?: string;
}

const STAGES: Stage[] = [
  { key: "intake", label: "پذیرش", icon: <CheckCircle2 className="h-5 w-5" /> },
  { key: "parts_approved", label: "تایید قطعه", icon: <Wrench className="h-5 w-5" /> },
  { key: "in_repair", label: "تعمیر", icon: <Clock className="h-5 w-5" /> },
  { key: "delivered", label: "تحویل", icon: <Truck className="h-5 w-5" /> },
  { key: "settled", label: "تسویه", icon: <CreditCard className="h-5 w-5" /> },
];

export default function DeviceTracker({ deviceId }: { deviceId: number }) {
  const [status, setStatus] = useState<string>("intake");
  const [timeline, setTimeline] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/devices/${deviceId}/status`)
      .then((r) => r.json())
      .then((d) => {
        setStatus(d.status || "intake");
        setTimeline(d.timeline || []);
      });
  }, [deviceId]);

  const currentIndex = STAGES.findIndex((s) => s.key === status);

  return (
    <div className="rounded-2xl border bg-white p-6 dark:bg-slate-900">
      <h3 className="mb-4 text-lg font-bold">وضعیت دستگاه #{deviceId}</h3>

      {/* Graphical Progress */}
      <div className="mb-8 flex items-center justify-between">
        {STAGES.map((stage, idx) => {
          const done = idx <= currentIndex;
          return (
            <div key={stage.key} className="flex flex-1 flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  done
                    ? "border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950"
                    : "border-slate-300 text-slate-400"
                }`}
              >
                {stage.icon}
              </div>
              <span className="mt-1.5 text-xs font-medium text-center">
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="space-y-3 text-sm">
        {timeline.length > 0 ? (
          timeline.map((item, i) => (
            <div key={i} className="flex gap-3 border-l-2 border-slate-200 pl-4">
              <div className="mt-1 text-emerald-500">●</div>
              <div>
                <div className="font-medium">{item.action}</div>
                <div className="text-xs text-slate-500">{item.time}</div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400">تایم‌لاین موجود نیست</p>
        )}
      </div>
    </div>
  );
}
