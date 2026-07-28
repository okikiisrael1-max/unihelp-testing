/**
 * UniHelp Design System — Theme Utility
 * 
 * Centralises all dark/light mode class combinations so every page
 * uses the same tokens.  Drop imports where inline ternaries were.
 *
 * Usage:
 *   import { theme } from "../utils/theme";
 *   <div className={theme(dark).surface}>
 */

export const theme = (dark) => ({
  /* ── Surfaces ─────────────────────────────────── */
  surface:       dark ? "bg-[#0f172a] border border-white/[0.06]" : "bg-white border border-slate-200",
  surfaceHover:  dark ? "bg-[#1e293b] border border-white/[0.08]" : "bg-slate-50 border border-slate-200",
  surfaceGlass:  dark ? "bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08]" : "bg-white/60 backdrop-blur-2xl border border-slate-200",
  surfaceSoft:   dark ? "bg-white/[0.03]"  : "bg-slate-50",
  elevated:      dark ? "bg-[#1a2332] shadow-2xl shadow-black/40 border border-white/[0.06]" : "bg-white shadow-xl shadow-slate-200/80 border border-slate-200",

  /* ── Inputs ───────────────────────────────────── */
  input:         dark ? "bg-white/[0.06] border-white/[0.10] text-white placeholder:text-white/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25" 
                     : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25",
  inputError:    "border-red-500 focus:border-red-500 focus:ring-red-500/25",
  select:        dark ? "bg-white/[0.06] border-white/[0.10] text-white" : "bg-white border-slate-200 text-slate-900",
  selectActive:  dark ? "bg-[#0f172a] border-white/[0.15]" : "bg-white border-indigo-300",

  /* ── Buttons ──────────────────────────────────── */
  btnPrimary:    "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30",
  btnSecondary:  dark ? "bg-white/[0.06] hover:bg-white/[0.10] text-white border border-white/[0.10]" 
                     : "bg-white hover:bg-slate-50 text-slate-900 border border-slate-200",
  btnGhost:      dark ? "hover:bg-white/[0.06] text-white/70 hover:text-white" 
                     : "hover:bg-slate-100 text-slate-500 hover:text-slate-900",
  btnDanger:     "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20",

  /* ── Text ─────────────────────────────────────── */
  text:          dark ? "text-white" : "text-slate-900",
  textSoft:      dark ? "text-slate-400" : "text-slate-500",
  textMuted:     dark ? "text-slate-500" : "text-slate-400",

  /* ── Dividers / Borders ───────────────────────── */
  border:        dark ? "border-white/[0.08]" : "border-slate-200",
  divider:       dark ? "bg-white/[0.08]" : "bg-slate-200",

  /* ── Misc ─────────────────────────────────────── */
  badge:         dark ? "bg-white/[0.08] text-slate-300" : "bg-slate-100 text-slate-600",
  iconWrap:      dark ? "bg-white/[0.06] text-indigo-400" : "bg-indigo-50 text-indigo-600",
  cardHover:     dark ? "hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-300" 
                     : "hover:bg-slate-50 hover:border-slate-300 transition-all duration-300",
  overlay:       "bg-black/50 backdrop-blur-sm",
});

/* ── Shared animation variants (framer‑motion) ─── */
export const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
};

export const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

/* ── Shared CSS class strings ──────────────────── */
export const inputBase = "w-full h-12 px-4 rounded-2xl border outline-none transition-all duration-200";
export const labelBase = "text-sm font-medium mb-1.5 block";
export const btnBase  = "inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed";
