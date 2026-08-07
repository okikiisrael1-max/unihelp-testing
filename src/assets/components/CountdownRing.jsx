import React from "react";
import { colors } from "../data/theme";

export default function CountdownRing({ secondsLeft, totalSeconds, size = 64 }) {
  const pct = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const urgent = pct <= 0.25;
  const warn = pct <= 0.5 && !urgent;
  const tone = urgent ? colors.coral : warn ? colors.gold : colors.violet;
  const deg = pct * 360;

  return (
    <div
      className="relative shrink-0 rounded-full transition-transform duration-300"
      style={{
        width: size,
        height: size,
        transform: urgent ? "scale(1.06)" : "scale(1)",
      }}
      role="timer"
      aria-label={`${secondsLeft} seconds left`}
    >
      <div
        className="absolute inset-0 rounded-full transition-[background] duration-500"
        style={{
          background: `conic-gradient(${tone} ${deg}deg, rgba(255,255,255,0.10) ${deg}deg)`,
        }}
      />
      <div
        className="absolute inset-[3px] rounded-full flex items-center justify-center bg-[#0A0E1A]"
      >
        <span
          className="tabular-nums transition-colors duration-300"
          style={{
            fontSize: size * 0.30,
            fontWeight: 600,
            color: tone,
          }}
        >
          {secondsLeft}
        </span>
      </div>
    </div>
  );
}