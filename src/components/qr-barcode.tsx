"use client";

import React from "react";

/** Renders a deterministic SVG linear barcode from any string (like ticketNumber). */
export function TicketBarcode({ value, height = 48, className = "" }: { value: string; height?: number; className?: string }) {
  if (!value) return null;

  // Simple deterministic barcode bars generator based on char codes
  const bars: { x: number; width: number }[] = [];
  let currentX = 10;
  const str = `*${value}*`; // wrap with start/stop markers

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    const pattern = (code * 13 + i * 7) % 15;
    const barWidth1 = (pattern % 3) + 1;
    const gap1 = ((pattern >> 2) % 2) + 1;
    const barWidth2 = ((pattern >> 1) % 2) + 1;
    const gap2 = 1;

    bars.push({ x: currentX, width: barWidth1 });
    currentX += barWidth1 + gap1;
    bars.push({ x: currentX, width: barWidth2 });
    currentX += barWidth2 + gap2;
  }

  const totalWidth = currentX + 10;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full max-w-[220px]"
        style={{ height: `${height}px` }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={totalWidth} height={height} fill="#ffffff" />
        {bars.map((b, idx) => (
          <rect key={idx} x={b.x} y={4} width={b.width} height={height - 8} fill="#000000" />
        ))}
      </svg>
      <span className="mt-1 font-mono text-xs font-bold tracking-widest text-slate-900">{value}</span>
    </div>
  );
}

/** Renders a deterministic 21x21 SVG QR-like code from a string. */
export function TicketQrCode({ value, size = 80, className = "" }: { value: string; size?: number; className?: string }) {
  if (!value) return null;

  const gridSize = 21;
  const grid: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  // Draw 7x7 corner finders
  function drawFinder(r0: number, c0: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          grid[r0 + r][c0 + c] = true;
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, gridSize - 7);
  drawFinder(gridSize - 7, 0);

  // Fill data cells deterministically based on hash of string
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  let index = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // skip finders
      if ((r < 7 && c < 7) || (r < 7 && c >= gridSize - 7) || (r >= gridSize - 7 && c < 7)) continue;
      const charCode = value.charCodeAt(index % value.length);
      const val = (charCode * (r + 1) * (c + 1) + idxHash(hash, index)) % 10;
      grid[r][c] = val > 4;
      index++;
    }
  }

  function idxHash(h: number, i: number) {
    return Math.abs((h ^ (i * 997)) % 100);
  }

  return (
    <div className={`inline-flex flex-col items-center rounded border border-slate-300 bg-white p-1.5 ${className}`}>
      <svg
        viewBox={`0 0 ${gridSize} ${gridSize}`}
        style={{ width: `${size}px`, height: `${size}px` }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={gridSize} height={gridSize} fill="#ffffff" />
        {grid.map((row, r) =>
          row.map((cell, c) =>
            cell ? <rect key={`${r}-${c}`} x={c} y={r} width={1.05} height={1.05} fill="#0f172a" /> : null
          )
        )}
      </svg>
    </div>
  );
}
