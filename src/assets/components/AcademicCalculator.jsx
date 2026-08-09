import React, { useEffect, useMemo, useState } from "react";
import {
  evaluate,
  fraction,
  matrix,
  multiply,
  det,
  inv,
} from "mathjs";
import Plot from "react-plotly.js";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import {
  FaCalculator,
  FaChartLine,
  FaTable,
  FaVectorSquare,
  FaChartBar,
  FaHistory,
  FaEquals,
  FaTrash,
  FaInfoCircle,
  FaBars,
  FaTimes,
  FaLightbulb,
  FaEllipsisV,
  FaCopy,
  FaShareAlt,
} from "react-icons/fa";

// ======================================================
// CONSTANTS
// ======================================================

const HISTORY_KEY = "unihelp_scientific_calc_history";
const MAX_HISTORY = 50;

// Degree-aware trig helpers used when the calculator is in DEG mode.
// The expression parser swaps sin/cos/tan(...) for these before evaluating.
const DEG_SCOPE = {
  sinDeg: (x) => Math.sin((x * Math.PI) / 180),
  cosDeg: (x) => Math.cos((x * Math.PI) / 180),
  tanDeg: (x) => Math.tan((x * Math.PI) / 180),
  asinDeg: (x) => (Math.asin(x) * 180) / Math.PI,
  acosDeg: (x) => (Math.acos(x) * 180) / Math.PI,
  atanDeg: (x) => (Math.atan(x) * 180) / Math.PI,
};

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function AcademicCalculator({ dark }) {
  const [activeTab, setActiveTab] = useState("scientific");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // History now lives here so both the sidebar preview and the Scientific
  // Calculator's own history drawer read from a single persisted source.
  const [history, setHistory] = useState(loadHistory);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Storage can fail (private browsing, quota) — history just won't persist.
    }
  }, [history]);

  const addHistoryItem = (expression, result) => {
    setHistory((prev) =>
      [
        { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, expression, result, timestamp: Date.now() },
        ...prev,
      ].slice(0, MAX_HISTORY)
    );
  };

  const deleteHistoryItem = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  // ======================================================
  // THEME — Indigo 500 is the primary brand color throughout.
  // ======================================================

  const theme = useMemo(() => {
    return dark
      ? {
        bg: "bg-[#020617]",
        card: "bg-[#0f172a]",
        soft: "bg-[#1e293b]",
        softHover: "hover:bg-[#334155]",
        input: "bg-[#020617]",
        border: "border-slate-800",
        text: "text-white",
        muted: "text-slate-400",
        primary: "bg-indigo-500 hover:bg-indigo-600 active:scale-95",
        danger: "bg-red-500 hover:bg-red-600 active:scale-95",
        success: "bg-emerald-500 hover:bg-emerald-600 active:scale-95",
      }
      : {
        bg: "bg-slate-100",
        card: "bg-white",
        soft: "bg-slate-200",
        softHover: "hover:bg-slate-300",
        input: "bg-white",
        border: "border-slate-300",
        text: "text-black",
        muted: "text-slate-500",
        primary: "bg-indigo-500 hover:bg-indigo-600 active:scale-95",
        danger: "bg-red-500 hover:bg-red-600 active:scale-95",
        success: "bg-emerald-500 hover:bg-emerald-600 active:scale-95",
      };
  }, [dark]);

  // ======================================================
  // TABS
  // ======================================================

  const tabs = [
    { id: "scientific", title: "Scientific", desc: "Advanced math operations", icon: <FaCalculator /> },
    { id: "matrix", title: "Matrix", desc: "Matrix calculations", icon: <FaTable /> },
    { id: "vector", title: "Vector", desc: "Vector operations", icon: <FaVectorSquare /> },
    { id: "statistics", title: "Statistics", desc: "Analyze datasets", icon: <FaChartBar /> },
    { id: "graph", title: "Graph", desc: "Plot equations visually", icon: <FaChartLine /> },
  ];

  const recentHistory = history.slice(0, 6);

  return (
    <div className={`min-h-screen md:pt-20 ${theme.bg} ${theme.text} transition-all duration-300`}>
      <div className="flex min-h-screen">
        {/* ======================================================
            MOBILE OVERLAY
        ====================================================== */}

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ======================================================
            SIDEBAR
        ====================================================== */}

        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-50
            h-screen w-[280px]
            transition-transform duration-300
            border-r
            ${theme.card}
            ${theme.border}
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <div className="flex flex-col h-full p-5">
            {/* HEADER */}

            <div className="flex items-center justify-between">
              <button onClick={() => setSidebarOpen(false)} className={`lg:hidden p-2 rounded-xl ${theme.soft}`}>
                <FaTimes />
              </button>
            </div>

            {/* NAVIGATION */}

            <div className="mt-8 flex-1 overflow-auto">
              <p className={`text-xs uppercase tracking-wider mb-4 ${theme.muted}`}>Calculator Tools</p>

              <div className="space-y-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full p-4 rounded-2xl text-left transition-all
                      ${activeTab === tab.id ? `${theme.primary} text-white` : `${theme.soft} ${theme.softHover}`}
                    `}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-xl mt-1">{tab.icon}</div>
                      <div>
                        <h3 className="font-bold">{tab.title}</h3>
                        <p className="text-sm opacity-80">{tab.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* RECENT HISTORY PREVIEW */}

              <div className="mt-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FaHistory />
                    <h2 className="font-bold">Recent</h2>
                  </div>
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className={`text-xs font-semibold ${theme.muted} hover:text-red-500 transition-colors`}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[300px] overflow-auto">
                  {recentHistory.length === 0 && (
                    <div className={`p-4 rounded-2xl ${theme.soft}`}>
                      <p className={`text-sm ${theme.muted}`}>Your recent calculations will appear here.</p>
                    </div>
                  )}

                  {recentHistory.map((item) => (
                    <div key={item.id} className={`p-4 rounded-2xl ${theme.soft} flex items-start justify-between gap-2`}>
                      <p className="text-sm break-all">
                        {item.expression} <span className={theme.muted}>=</span> {item.result}
                      </p>
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        aria-label="Delete this calculation"
                        className={`shrink-0 mt-0.5 ${theme.muted} hover:text-red-500 transition-colors`}
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ======================================================
            MAIN CONTENT
        ====================================================== */}

        <main className="flex-1 w-full">
          {/* TOPBAR */}

          <div className={`sticky top-0 z-30 backdrop-blur-xl border-b ${theme.border} ${theme.card}/80`}>
            <div className="flex items-center justify-between px-4 md:px-8 py-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={`lg:hidden p-3 rounded-2xl ${theme.soft}`}
                >
                  <FaBars />
                </button>

                <div>
                  <h2 className="text-xl md:text-2xl font-black">{tabs.find((tab) => tab.id === activeTab)?.title}</h2>
                  <p className={`text-sm ${theme.muted}`}>{tabs.find((tab) => tab.id === activeTab)?.desc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT */}

          <div className="p-4 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                {activeTab === "scientific" && (
                  <ScientificCalculator
                    theme={theme}
                    history={history}
                    addHistoryItem={addHistoryItem}
                    deleteHistoryItem={deleteHistoryItem}
                    clearHistory={clearHistory}
                  />
                )}

                {activeTab === "matrix" && <MatrixCalculator theme={theme} />}

                {activeTab === "vector" && <VectorCalculator theme={theme} />}

                {activeTab === "statistics" && <StatisticsCalculator theme={theme} />}

                {activeTab === "graph" && <GraphCalculator theme={theme} dark={dark} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

// ======================================================
// SECTION TITLE
// ======================================================

function SectionHeader({ title, subtitle, theme }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl md:text-3xl font-black">{title}</h2>
      <p className={`mt-2 ${theme.muted}`}>{subtitle}</p>
    </div>
  );
}

// ======================================================
// SCIENTIFIC CALCULATOR
// ======================================================

function ScientificCalculator({ theme, history, addHistoryItem, deleteHistoryItem, clearHistory }) {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [isError, setIsError] = useState(false);

  const [angleMode, setAngleMode] = useState("deg"); // 'deg' | 'rad'
  const [sciOpen, setSciOpen] = useState(false); // Basic vs Scientific keypad
  const [secondActive, setSecondActive] = useState(false); // trig <-> inverse trig

  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Close the ⋮ menu on outside interaction is handled by a backdrop below.

  const appendValue = (value) => {
    setIsError(false);
    setExpression((prev) => prev + value);
  };

  const clearExpression = () => {
    setExpression("");
    setResult("0");
    setIsError(false);
  };

  const removeLast = () => {
    setIsError(false);
    setExpression((prev) => prev.slice(0, -1));
  };

  const applyPercent = () => {
    setIsError(false);
    setExpression((prev) => {
      const match = prev.match(/(\d+\.?\d*)$/);
      if (!match) return prev;
      const num = match[1];
      return prev.slice(0, prev.length - num.length) + `(${num}/100)`;
    });
  };

  const calculate = () => {
    if (!expression.trim()) return;

    try {
      let normalized = expression
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-")
        .replace(/π/g, "pi");

      let scope = {};

      if (angleMode === "deg") {
        // Swap sin/cos/tan/asin/acos/atan for their degree-aware counterparts,
        // which are supplied via scope below.
        normalized = normalized.replace(/\b(a?)(sin|cos|tan)\(/g, (_match, prefix, fn) => `${prefix}${fn}Deg(`);
        scope = DEG_SCOPE;
      }

      const res = evaluate(normalized, scope);

      if (res === undefined || (typeof res === "number" && !Number.isFinite(res))) {
        throw new Error("Not a finite number");
      }

      const nextResult =
        typeof res === "number" ? parseFloat(res.toPrecision(12)).toString() : res.toString();

      setResult(nextResult);
      setIsError(false);
      addHistoryItem(expression, nextResult);
    } catch {
      setResult("Check your expression and try again");
      setIsError(true);
    }
  };

  const convertToFraction = () => {
    try {
      const numeric = parseFloat(result);
      if (Number.isNaN(numeric)) throw new Error("Not a number");
      const f = fraction(numeric);
      setResult(f.toFraction(true));
      setIsError(false);
    } catch {
      toast.error("This result can't be shown as a fraction.");
    }
    setMenuOpen(false);
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(`${expression || "0"} = ${result}`);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy — try again.");
    }
    setMenuOpen(false);
  };

  const shareResult = async () => {
    const text = `${expression || "0"} = ${result}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "UniHelp Calculation", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
      }
    } catch {
      // User cancelled the native share sheet — nothing to do.
    }
    setMenuOpen(false);
  };

  const handleClearHistory = () => {
    if (history.length === 0) return;
    if (window.confirm("Clear all calculation history? This can't be undone.")) {
      clearHistory();
    }
    setMenuOpen(false);
  };

  const loadHistoryItem = (item) => {
    setExpression(item.expression);
    setResult(item.result);
    setIsError(false);
    setHistoryOpen(false);
  };

  const basicRows = [
    [
      { label: "(", value: "(" },
      { label: ")", value: ")" },
      { label: "C", action: clearExpression, variant: "danger" },
      { label: "⌫", action: removeLast, variant: "soft" },
    ],
    [
      { label: "7", value: "7" },
      { label: "8", value: "8" },
      { label: "9", value: "9" },
      { label: "÷", value: "/", variant: "operator" },
    ],
    [
      { label: "4", value: "4" },
      { label: "5", value: "5" },
      { label: "6", value: "6" },
      { label: "×", value: "*", variant: "operator" },
    ],
    [
      { label: "1", value: "1" },
      { label: "2", value: "2" },
      { label: "3", value: "3" },
      { label: "−", value: "-", variant: "operator" },
    ],
    [
      { label: "%", action: applyPercent },
      { label: "0", value: "0" },
      { label: ".", value: "." },
      { label: "+", value: "+", variant: "operator" },
    ],
  ];

  const trigRow = secondActive
    ? [
        { label: "sin⁻¹", value: "asin(" },
        { label: "cos⁻¹", value: "acos(" },
        { label: "tan⁻¹", value: "atan(" },
      ]
    : [
        { label: "sin", value: "sin(" },
        { label: "cos", value: "cos(" },
        { label: "tan", value: "tan(" },
      ];

  const sciRows = [
    [{ label: "2nd", action: () => setSecondActive((v) => !v), variant: secondActive ? "primary" : "soft" }, ...trigRow],
    [
      { label: "ln", value: "log(" },
      { label: "log", value: "log10(" },
      { label: "√", value: "sqrt(" },
      { label: "x²", value: "^2" },
    ],
    [
      { label: "xʸ", value: "^" },
      { label: "π", value: "pi" },
      { label: "e", value: "e" },
      { label: "n!", value: "!" },
    ],
  ];

  const renderKey = (btn, key) => {
    const isPrimary = btn.variant === "primary";
    const isDanger = btn.variant === "danger";
    const isOperator = btn.variant === "operator";
    const base = isPrimary
      ? `${theme.primary} text-white`
      : isDanger
      ? `${theme.danger} text-white`
      : isOperator
      ? "bg-amber-500 hover:bg-amber-600 text-white"
      : `${theme.soft} ${theme.softHover}`;

    return (
      <motion.button
        key={key}
        whileTap={{ scale: 0.92 }}
        onClick={() => (btn.action ? btn.action() : appendValue(btn.value))}
        className={`h-14 md:h-16 rounded-2xl font-bold text-base md:text-lg transition-colors ${base}`}
      >
        {btn.label}
      </motion.button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header row: title + history + overflow menu */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black">Scientific Calculator</h2>
          <p className={`mt-2 ${theme.muted}`}>Everyday and advanced math, in one clean keypad.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setHistoryOpen(true)}
            aria-label="View calculation history"
            className={`h-11 w-11 flex items-center justify-center rounded-2xl transition-colors ${theme.soft} ${theme.softHover}`}
          >
            <FaHistory />
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="More options"
              className={`h-11 w-11 flex items-center justify-center rounded-2xl transition-colors ${theme.soft} ${theme.softHover}`}
            >
              <FaEllipsisV />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 mt-2 w-56 z-50 rounded-2xl border p-2 shadow-2xl ${theme.card} ${theme.border}`}
                  >
                    <button
                      onClick={copyResult}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-left transition-colors ${theme.softHover}`}
                    >
                      <FaCopy /> Copy result
                    </button>
                    <button
                      onClick={shareResult}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-left transition-colors ${theme.softHover}`}
                    >
                      <FaShareAlt /> Share result
                    </button>
                    <button
                      onClick={convertToFraction}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-left transition-colors ${theme.softHover}`}
                    >
                      <FaEquals /> Convert to fraction
                    </button>
                    <div className={`my-1 border-t ${theme.border}`} />
                    <button
                      onClick={handleClearHistory}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-left text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <FaTrash /> Clear all history
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-8">
        <div className={`rounded-3xl p-5 md:p-6 ${theme.card} border ${theme.border}`}>
          {/* Basic / Scientific separation + angle mode */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className={`inline-flex rounded-2xl p-1 ${theme.soft}`}>
              <button
                onClick={() => setSciOpen(false)}
                className={`h-9 px-4 rounded-xl text-xs font-bold transition-colors ${
                  !sciOpen ? `${theme.primary} text-white` : theme.muted
                }`}
              >
                Basic
              </button>
              <button
                onClick={() => setSciOpen(true)}
                className={`h-9 px-4 rounded-xl text-xs font-bold transition-colors ${
                  sciOpen ? `${theme.primary} text-white` : theme.muted
                }`}
              >
                Scientific
              </button>
            </div>

            <button
              onClick={() => setAngleMode((m) => (m === "deg" ? "rad" : "deg"))}
              aria-label="Toggle degrees or radians"
              className={`h-9 px-4 rounded-xl text-xs font-black tracking-wide transition-colors ${theme.soft} ${theme.softHover}`}
            >
              {angleMode === "deg" ? "DEG" : "RAD"}
            </button>
          </div>

          {/* Display */}
          <div className={`rounded-3xl p-5 md:p-6 ${theme.input} border ${theme.border}`}>
            <div className={`text-right text-base md:text-lg overflow-x-auto whitespace-nowrap ${theme.muted}`}>
              {expression || "0"}
            </div>

            <div
              className={`text-right font-black mt-4 break-all ${
                isError ? "text-red-500 text-lg md:text-xl" : "text-3xl md:text-5xl"
              }`}
            >
              {result}
            </div>

            <div className="flex justify-end gap-4 mt-3">
              <button
                onClick={copyResult}
                aria-label="Copy result"
                className={`${theme.muted} hover:text-indigo-500 transition-colors`}
              >
                <FaCopy size={14} />
              </button>
              <button
                onClick={shareResult}
                aria-label="Share result"
                className={`${theme.muted} hover:text-indigo-500 transition-colors`}
              >
                <FaShareAlt size={14} />
              </button>
            </div>
          </div>

          {/* Scientific keypad (collapsible) */}
          <AnimatePresence initial={false}>
            {sciOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-2">
                  {sciRows.map((row, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-4 gap-2">
                      {row.map((btn, i) => renderKey(btn, `sci-${rowIndex}-${i}`))}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Basic keypad */}
          <div className="mt-4 space-y-2">
            {basicRows.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-4 gap-2 md:gap-3">
                {row.map((btn, i) => renderKey(btn, `basic-${rowIndex}-${i}`))}
              </div>
            ))}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={calculate}
              className={`w-full h-14 md:h-16 rounded-2xl text-white font-black text-lg md:text-xl flex items-center justify-center gap-3 transition-colors ${theme.primary}`}
            >
              <FaEquals />
              Calculate
            </motion.button>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`rounded-3xl p-6 ${theme.card} border ${theme.border}`}>
            <div className="flex items-start gap-3 mb-5">
              <FaInfoCircle className="mt-1" />
              <div className="text-sm">
                <p className="font-bold mb-1">How to use</p>
                <p className={theme.muted}>
                  Build your expression on the Basic keypad, or switch to Scientific for trig, logs, and
                  powers. Tap 2nd for inverse trig functions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <FaLightbulb />
              <h2 className="text-xl font-black">Popular Formulas</h2>
            </div>

            <div className="grid gap-4">
              {["F = ma", "E = mc²", "PV = nRT", "a² + b² = c²", "V = IR", "sin²x + cos²x = 1"].map((formula) => (
                <div key={formula} className={`p-4 rounded-2xl ${theme.soft}`}>
                  <p className="font-semibold">{formula}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-3xl p-6 ${theme.card} border ${theme.border}`}>
            <h2 className="text-xl font-black mb-5">Examples</h2>
            <p className={`text-sm ${theme.muted} mb-4`}>Tap an example to load it into the calculator.</p>

            <div className="space-y-4">
              {["sqrt(25)", "sin(30)", "5^2 + 10", "log10(100)", "5!"].map((example) => (
                <button
                  key={example}
                  onClick={() => {
                    setExpression(example);
                    setIsError(false);
                  }}
                  className={`w-full text-left p-4 rounded-2xl transition-colors ${theme.soft} ${theme.softHover}`}
                >
                  <p className="font-semibold">{example}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* History drawer — bottom sheet on mobile, centered modal on larger screens */}
      <AnimatePresence>
        {historyOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setHistoryOpen(false)}
            />

            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`relative z-10 w-full sm:max-w-md max-h-[75vh] overflow-hidden flex flex-col rounded-t-3xl sm:rounded-3xl border ${theme.card} ${theme.border}`}
            >
              <div className="flex items-center justify-between p-5 border-b border-inherit">
                <div className="flex items-center gap-3">
                  <FaHistory />
                  <h3 className="font-black text-lg">History</h3>
                </div>
                <div className="flex items-center gap-3">
                  {history.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="text-xs font-semibold text-red-500 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setHistoryOpen(false)}
                    aria-label="Close history"
                    className={`h-9 w-9 flex items-center justify-center rounded-xl ${theme.soft} ${theme.softHover}`}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto space-y-3">
                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <FaHistory className={`mx-auto mb-3 text-3xl ${theme.muted}`} />
                    <p className="font-semibold">No calculations yet</p>
                    <p className={`text-sm mt-1 ${theme.muted}`}>Your calculation history will show up here.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between gap-3 p-4 rounded-2xl ${theme.soft}`}
                    >
                      <button onClick={() => loadHistoryItem(item)} className="flex-1 text-left">
                        <p className={`text-xs ${theme.muted} truncate`}>{item.expression}</p>
                        <p className="font-bold break-all">{item.result}</p>
                      </button>
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        aria-label="Delete this calculation"
                        className={`shrink-0 ${theme.muted} hover:text-red-500 transition-colors`}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ======================================================
// MATRIX CALCULATOR
// ======================================================

function MatrixCalculator({ theme }) {
  const [A, setA] = useState("1,2\n3,4");
  const [B, setB] = useState("5,6\n7,8");
  const [result, setResult] = useState("");

  const parseMatrix = (text) => text.split("\n").map((row) => row.split(",").map(Number));

  const operate = (type) => {
    try {
      const mA = matrix(parseMatrix(A));
      const mB = matrix(parseMatrix(B));

      let res;
      if (type === "multiply") res = multiply(mA, mB);
      if (type === "det") res = det(mA);
      if (type === "inverse") res = inv(mA);

      setResult(JSON.stringify(res, null, 2));
    } catch {
      setResult("Invalid Matrix");
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Matrix Calculator"
        subtitle="Perform matrix multiplication, determinant and inverse calculations."
        theme={theme}
      />

      <div className="grid xl:grid-cols-2 gap-8">
        {/* INPUT */}

        <div className="space-y-5">
          <div className={`p-4 rounded-2xl ${theme.soft}`}>
            <p className="font-semibold mb-2">Matrix A</p>
            <p className={`text-sm ${theme.muted}`}>Separate numbers with commas and rows with new lines.</p>
          </div>

          <textarea
            rows={6}
            value={A}
            onChange={(e) => setA(e.target.value)}
            className={`w-full rounded-3xl p-5 resize-none ${theme.card} border ${theme.border}`}
          />

          <div className={`p-4 rounded-2xl ${theme.soft}`}>
            <p className="font-semibold mb-2">Matrix B</p>
          </div>

          <textarea
            rows={6}
            value={B}
            onChange={(e) => setB(e.target.value)}
            className={`w-full rounded-3xl p-5 resize-none ${theme.card} border ${theme.border}`}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => operate("multiply")}
              className={`p-5 rounded-2xl text-white font-bold transition-all ${theme.primary}`}
            >
              Multiply
            </button>

            <button
              onClick={() => operate("det")}
              className={`p-5 rounded-2xl text-white font-bold transition-all ${theme.success}`}
            >
              Determinant
            </button>

            <button
              onClick={() => operate("inverse")}
              className={`p-5 rounded-2xl text-white font-bold transition-all ${theme.primary}`}
            >
              Inverse
            </button>
          </div>
        </div>

        {/* RESULT */}

        <div className={`rounded-3xl p-6 ${theme.card} border ${theme.border}`}>
          <h2 className="text-2xl font-black mb-5">Result</h2>
          <pre className="whitespace-pre-wrap overflow-auto text-sm">{result || "Your result will appear here"}</pre>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// VECTOR CALCULATOR
// ======================================================

function VectorCalculator({ theme }) {
  const [v1, setV1] = useState("1,2,3");
  const [v2, setV2] = useState("4,5,6");
  const [result, setResult] = useState("");

  const parse = (v) => v.split(",").map(Number);

  const dot = () => {
    const a = parse(v1);
    const b = parse(v2);
    const res = a.reduce((sum, val, i) => sum + val * b[i], 0);
    setResult(`Dot Product = ${res}`);
  };

  const magnitude = () => {
    const a = parse(v1);
    const res = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    setResult(`Magnitude = ${res}`);
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Vector Calculator" subtitle="Calculate vector dot products and magnitudes." theme={theme} />

      <div className="grid xl:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div className={`p-4 rounded-2xl ${theme.soft}`}>
            <p className="font-semibold">Example format:</p>
            <p className={`text-sm ${theme.muted}`}>1,2,3</p>
          </div>

          <input
            value={v1}
            onChange={(e) => setV1(e.target.value)}
            className={`w-full p-5 rounded-3xl ${theme.card} border ${theme.border}`}
          />

          <input
            value={v2}
            onChange={(e) => setV2(e.target.value)}
            className={`w-full p-5 rounded-3xl ${theme.card} border ${theme.border}`}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <button onClick={dot} className={`p-5 rounded-2xl text-white font-bold transition-all ${theme.primary}`}>
              Dot Product
            </button>

            <button onClick={magnitude} className={`p-5 rounded-2xl text-white font-bold transition-all ${theme.success}`}>
              Magnitude
            </button>
          </div>
        </div>

        <div className={`rounded-3xl p-6 ${theme.card} border ${theme.border}`}>
          <h2 className="text-2xl font-black mb-5">Result</h2>
          <div className="text-2xl md:text-4xl font-black break-all">{result || "No result yet"}</div>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// STATISTICS CALCULATOR
// ======================================================

function StatisticsCalculator({ theme }) {
  const [data, setData] = useState("1,2,3,4,5");
  const [stats, setStats] = useState(null);

  const calculate = () => {
    const arr = data.split(",").map(Number);
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
    const std = Math.sqrt(variance);

    setStats({ mean, variance, std });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Statistics Calculator"
        subtitle="Analyze your data with mean, variance and standard deviation."
        theme={theme}
      />

      <div className="grid xl:grid-cols-2 gap-8">
        {/* INPUT */}

        <div>
          <div className={`p-4 rounded-2xl mb-5 ${theme.soft}`}>
            <p className="font-semibold mb-2">Enter numbers separated by commas</p>
            <p className={`text-sm ${theme.muted}`}>Example: 1,2,3,4,5</p>
          </div>

          <textarea
            rows={8}
            value={data}
            onChange={(e) => setData(e.target.value)}
            className={`w-full rounded-3xl p-5 resize-none ${theme.card} border ${theme.border}`}
          />

          <button
            onClick={calculate}
            className={`mt-5 w-full p-5 rounded-2xl text-white font-black transition-all ${theme.primary}`}
          >
            Calculate Statistics
          </button>
        </div>

        {/* RESULT */}

        <div className={`rounded-3xl p-6 ${theme.card} border ${theme.border}`}>
          {!stats ? (
            <div className={`h-full flex items-center justify-center ${theme.muted}`}>
              Your statistics will appear here
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h3 className={`text-sm ${theme.muted}`}>Mean</h3>
                <p className="text-4xl font-black">{stats.mean}</p>
              </div>

              <div>
                <h3 className={`text-sm ${theme.muted}`}>Variance</h3>
                <p className="text-4xl font-black">{stats.variance}</p>
              </div>

              <div>
                <h3 className={`text-sm ${theme.muted}`}>Standard Deviation</h3>
                <p className="text-4xl font-black">{stats.std}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ======================================================
// GRAPH CALCULATOR
// ======================================================

function GraphCalculator({ theme, dark }) {
  const [equation, setEquation] = useState("x^2");

  const x = Array.from({ length: 200 }, (_, i) => i - 100);

  const y = x.map((val) => {
    try {
      return evaluate(equation, { x: val });
    } catch {
      return 0;
    }
  });

  return (
    <div className="space-y-8">
      <SectionHeader title="Graph Calculator" subtitle="Visualize mathematical equations instantly." theme={theme} />

      <div className={`p-4 rounded-2xl ${theme.soft}`}>
        <p className="font-semibold mb-2">Example equations</p>
        <p className={`text-sm ${theme.muted}`}>x^2, sin(x), cos(x), x^3</p>
      </div>

      <input
        value={equation}
        onChange={(e) => setEquation(e.target.value)}
        className={`w-full p-5 rounded-3xl ${theme.card} border ${theme.border}`}
        placeholder="Enter equation..."
      />

      <div className={`rounded-3xl overflow-hidden border ${theme.border}`}>
        <Plot
          data={[
            {
              x,
              y,
              type: "scatter",
              mode: "lines",
              line: { color: "#6366f1" },
            },
          ]}
          layout={{
            autosize: true,
            paper_bgcolor: dark ? "#0f172a" : "#ffffff",
            plot_bgcolor: dark ? "#0f172a" : "#ffffff",
            font: { color: dark ? "#ffffff" : "#000000" },
            margin: { t: 20, l: 40, r: 20, b: 40 },
          }}
          style={{ width: "100%", height: "600px" }}
          useResizeHandler
          config={{ responsive: true }}
        />
      </div>
    </div>
  );
}