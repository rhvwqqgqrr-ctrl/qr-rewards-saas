"use client";

import { useEffect, useState } from "react";

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

export default function RouletteWheel({
  prizes,
  onSpinComplete,
  winningIndex,
  spinning,
  primaryColor = "#d6822e",
}: RouletteWheelProps) {
  const [phase, setPhase] = useState<"idle" | "shuffling" | "revealing">("idle");
  const [displayIndex, setDisplayIndex] = useState(0);

  useEffect(() => {
    if (!spinning) {
      setPhase("idle");
      return;
    }

    setPhase("shuffling");

    // Rapidly cycle through prizes for 3 seconds
    let count = 0;
    const interval = setInterval(() => {
      setDisplayIndex(count % prizes.length);
      count++;
    }, 100);

    // After 2.5s, slow down then reveal
    const slowDown = setTimeout(() => {
      clearInterval(interval);
      // Show the winning prize
      setDisplayIndex(winningIndex);
      setPhase("revealing");
    }, 2500);

    // Complete after 3.5s
    const complete = setTimeout(() => {
      onSpinComplete();
    }, 3500);

    return () => {
      clearInterval(interval);
      clearTimeout(slowDown);
      clearTimeout(complete);
    };
  }, [spinning, winningIndex]);

  const currentPrize = prizes[displayIndex] || prizes[0];
  const isNoPrize = currentPrize?.type === "NO_PRIZE";

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Mystery box */}
      <div
        className="relative w-56 h-56 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-500"
        style={{
          background: phase === "revealing"
            ? (isNoPrize ? "linear-gradient(135deg, #6b7280, #9ca3af)" : `linear-gradient(135deg, ${primaryColor}, #f59e0b)`)
            : `linear-gradient(135deg, ${primaryColor}CC, ${primaryColor})`,
          transform: phase === "shuffling" ? "scale(1.05)" : "scale(1)",
        }}
      >
        {/* Decorative ribbon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-3 bg-white/30 absolute" />
          <div className="h-full w-3 bg-white/30 absolute" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4">
          {phase === "idle" && (
            <div className="text-6xl animate-bounce">🎁</div>
          )}
          {phase === "shuffling" && (
            <div className="text-white">
              <div className="text-5xl mb-2 animate-pulse">✨</div>
              <p className="text-lg font-bold animate-pulse">{currentPrize?.label}</p>
            </div>
          )}
          {phase === "revealing" && (
            <div className="animate-bounce">
              <div className="text-5xl mb-2">{isNoPrize ? "😔" : "🎉"}</div>
              <p className="text-white text-lg font-bold">{currentPrize?.label}</p>
            </div>
          )}
        </div>
      </div>

      {/* Prize list display */}
      <div className="flex flex-wrap justify-center gap-2 max-w-xs">
        {prizes.map((p, i) => (
          <span
            key={p.id}
            className="text-xs px-2 py-1 rounded-full transition-all duration-200"
            style={{
              backgroundColor: phase === "shuffling" && i === displayIndex
                ? primaryColor
                : phase === "revealing" && i === winningIndex
                ? (isNoPrize ? "#6b7280" : primaryColor)
                : "#f3f4f6",
              color: (phase === "shuffling" && i === displayIndex) ||
                     (phase === "revealing" && i === winningIndex)
                ? "#ffffff"
                : "#6b7280",
              fontWeight: phase === "revealing" && i === winningIndex ? "bold" : "normal",
              transform: phase === "revealing" && i === winningIndex ? "scale(1.2)" : "scale(1)",
            }}
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
