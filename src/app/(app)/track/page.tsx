"use client";

import { useState } from "react";
import DeviceTracker from "@/components/device-tracker";

export default function TrackPage() {
  const [deviceId, setDeviceId] = useState<number | null>(null);
  const [input, setInput] = useState("");

  const handleTrack = () => {
    const id = parseInt(input.trim());
    if (!isNaN(id)) setDeviceId(id);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">پیگیری آنلاین وضعیت دستگاه</h1>

      <div className="mb-8 flex gap-3">
        <input
          type="text"
          placeholder="شماره دستگاه (ID)"
          className="flex-1 rounded-xl border px-4 py-3 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleTrack()}
        />
        <button
          onClick={handleTrack}
          className="rounded-xl bg-sky-600 px-8 py-3 text-sm font-medium text-white hover:bg-sky-700"
        >
          پیگیری
        </button>
      </div>

      {deviceId && <DeviceTracker deviceId={deviceId} />}
    </div>
  );
}
