"use client";

import { useState, useEffect, useRef } from "react";

interface Prize {
  id: string;
  label: string;
  type: string;
}

interface RouletteWheelProps {
  prizes: Prize[];
  onSpinComplete: () => void;
  winningIndex: number;
  spinning: boolean;
  primaryColor?: string;
}

const COLORS = [
  "#d6822e", "#3a1b0e", "#e9bc7e", "#6c381e",
  "#f2d7b0", "#854322", "#fdf8f0", "#a65320",
];

export default function RouletteWheel({
  prizes,
  onSpinComplete,
  winningIndex,
  spinning,
  primaryColor = "#d6822e",
}: RouletteWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);

  const segmentAngle = 360 / prizes.length;

  useEffect(() => {
    drawWheel();
  }, [prizes, rotation]);

  useEffect(() => {
    if (spinning) {
      // Calculate target rotation: multiple full rotations + landing on winning segment
      const targetSegmentCenter = 360 - (winningIndex * segmentAngle + segmentAngle / 2);
      const totalRotation = 360 * 5 + targetSegmentCenter; // 5 full rotations
      setRotation(totalRotation);

      const timer = setTimeout(() => {
        onSpinComplete();
      }, 4200);

      return () => clearTimeout(timer);
    }
  }, [spinning, winningIndex]);

  function drawWheel() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;

    ctx.clearRect(0, 0, size, size);

    prizes.forEach((prize, i) => {
      const startAngle = (i * segmentAngle * Math.PI) / 180;
      const endAngle = ((i + 1) * segmentAngle * Math.PI) / 180;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + (endAngle - startAngle) / 2);
      ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#fdf8f0";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(prize.label.slice(0, 14), radius - 15, 4);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 20, 0, 2 * Math.PI);
    ctx.fillStyle = primaryColor;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  return (
    <div className="relative inline-block">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
        <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-brand-600 drop-shadow-md" />
      </div>

      {/* Wheel */}
      <div
        className={spinning ? "animate-spin-wheel" : ""}
        style={{
          ["--spin-degrees" as string]: `${rotation}deg`,
          transform: spinning ? undefined : `rotate(0deg)`,
          transition: spinning ? undefined : "none",
        }}
      >
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="rounded-full shadow-xl"
        />
      </div>
    </div>
  );
}