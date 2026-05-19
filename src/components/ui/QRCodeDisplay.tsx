"use client";

import { useEffect, useRef } from "react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  label?: string;
}

export default function QRCodeDisplay({ value, size = 200, label }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Simple QR code placeholder — in production, use the qrcode library
    // This renders the value as a visual placeholder
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Generate a simple matrix pattern based on the value hash
    const moduleCount = 25;
    const moduleSize = size / moduleCount;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Simple hash-based pattern for visual representation
    const hash = simpleHash(value);
    ctx.fillStyle = "#000000";

    // Draw finder patterns (corners)
    drawFinderPattern(ctx, 0, 0, moduleSize);
    drawFinderPattern(ctx, (moduleCount - 7) * moduleSize, 0, moduleSize);
    drawFinderPattern(ctx, 0, (moduleCount - 7) * moduleSize, moduleSize);

    // Draw data modules
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (isFinderArea(row, col, moduleCount)) continue;
        const bit = (hash + row * 31 + col * 17) % 3;
        if (bit === 0) {
          ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
        }
      }
    }
  }, [value, size]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-gray-100">
        <canvas ref={canvasRef} width={size} height={size} />
      </div>
      {label && (
        <p className="text-sm text-gray-500 font-mono tracking-wider">{label}</p>
      )}
      <p className="text-xs text-gray-400 mt-1">
        Présentez ce QR code au serveur
      </p>
    </div>
  );
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function drawFinderPattern(ctx: CanvasRenderingContext2D, x: number, y: number, moduleSize: number) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);
  ctx.fillStyle = "#000000";
  ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
}

function isFinderArea(row: number, col: number, count: number): boolean {
  return (
    (row < 8 && col < 8) ||
    (row < 8 && col >= count - 8) ||
    (row >= count - 8 && col < 8)
  );
}