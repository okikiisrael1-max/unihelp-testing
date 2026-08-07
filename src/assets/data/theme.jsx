// theme.js
// Design language: "The Ledger" — an honors-board / exam-hall aesthetic for a
// student challenge arena. Ink-navy scoreboard header, parchment surfaces,
// a gold "rank ribbon", and monospace digits everywhere a number is earned
// (XP, streak, timer, accuracy) so progress reads like a scoreboard, not a form.
//
// Accent palette — used consistently for meaning, not decoration:
// violet = primary action / focus, gold = rank & achievement, teal = correctness/growth,
// coral = danger / time-critical, categories get their own tone from CATEGORY_TONES below.
export const colors = {
  violet: "#6C5CE7",
  violetDeep: "#5142C4",
  gold: "#D4A72C",
  goldSoft: "#F0C94A",
  teal: "#219E8B",
  coral: "#E2574C",
  ink: "#0A0E1A",
  inkRaised: "#121A2E",
  inkLine: "rgba(255,255,255,0.08)",
};

export const getTheme = (dark) => ({
  dark,
  page: dark ? "bg-[#070a12] text-[#EDEEF3]" : "bg-[#F5F3EC] text-[#171A21]",
  banner: dark
    ? "bg-gradient-to-br from-[#0E1424] via-[#121A2E] to-[#171130] border border-white/10"
    : "bg-gradient-to-br from-[#12182B] via-[#1A2038] to-[#241A3D] border border-black/5",
  card: dark
    ? "bg-[#0F1424] border border-white/[0.08]"
    : "bg-white border border-[#E7E2D6]",
  cardHover: dark ? "hover:border-white/20" : "hover:border-[#C9BFA2]",
  soft: dark ? "bg-white/[0.04]" : "bg-[#EFEAD9]",
  ledgerLine: dark ? "border-white/[0.06]" : "border-[#E4DECE]",
  textSoft: dark ? "text-white/50" : "text-[#6B6656]",
  textFaint: dark ? "text-white/35" : "text-[#8B8676]",
  input: dark
    ? "bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30"
    : "bg-white border border-[#E4DEC7] text-[#171A21] placeholder:text-[#A29C86]",
  ring: dark ? "focus-visible:ring-[#8B7FEF]" : "focus-visible:ring-[#6C5CE7]",
});

// Named tones per category — each challenge type gets a fixed identity color
// so it stays recognizable across the categories grid, banners and history.
export const CATEGORY_TONES = {
  daily: { accent: "#6C5CE7", tint: "rgba(108,92,231,0.12)" },
  weekly: { accent: "#D4A72C", tint: "rgba(212,167,44,0.14)" },
  department: { accent: "#219E8B", tint: "rgba(33,158,139,0.12)" },
  level: { accent: "#9B6BD6", tint: "rgba(155,107,214,0.12)" },
  faculty: { accent: "#D6598F", tint: "rgba(214,89,143,0.12)" },
  "speed-quiz": { accent: "#E2574C", tint: "rgba(226,87,76,0.12)" },
  aptitude: { accent: "#2AA4A0", tint: "rgba(42,164,160,0.12)" },
  "general-knowledge": { accent: "#D98A2B", tint: "rgba(217,138,43,0.12)" },
};

export const RANK_COLORS = {
  Bronze: "#B4794A",
  Silver: "#9AA3AF",
  Gold: "#D4A72C",
  Platinum: "#8FD0C9",
  Diamond: "#7EC4E8",
  Legend: "#E2574C",
};

// Per-category time budget per question, in seconds. This is the "signature"
// mechanic — Speed Quiz is meaningfully tighter than everything else.
export const TIME_LIMITS = {
  "speed-quiz": 12,
  daily: 22,
  weekly: 25,
  aptitude: 30,
  default: 25,
};

export const getTimeLimit = (categoryId) => TIME_LIMITS[categoryId] || TIME_LIMITS.default;

export const formatClock = (totalSeconds) => {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, "0")}`;
};