import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileQuestion,
  Maximize2,
  Minimize2,
  Search,
  Sparkles,
  Trophy,
  XCircle,
  ZoomIn,
  ZoomOut,
  X,
  Target,
} from "lucide-react";

import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

import { motion, AnimatePresence } from "framer-motion";

import { questionBank } from "../../data/questionBank";

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */

const QUESTIONS_PER_PAGE = 5;
const OPTION_LABELS = ["A", "B", "C", "D", "E"];

/* ─────────────────────────────────────────────────────────
   BUG FIX #1 — SMART MATH RENDERER
   
   Original bug: containsMath() checked for "=", "^", "_"
   which appear in regular English text, causing plain sentences
   to be passed to BlockMath and throwing KaTeX parse errors.
   
   Fix: Only detect content wrapped in proper LaTeX delimiters:
   $...$   $$...$$   \(...\)   \[...\]
   Plain text is rendered as-is; delimited segments go to KaTeX.
───────────────────────────────────────────────────────── */

/**
 * Split content into alternating text / math segments.
 * Handles: $$...$$, $...$, \[...\], \(...\)
 */
const parseMathSegments = (raw = "") => {
  const str = String(raw).trim();
  const segments = [];
  // Order matters: $$ before $ to avoid partial matches
  const MATH_RE = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;
  let cursor = 0;
  let match;

  while ((match = MATH_RE.exec(str)) !== null) {
    if (match.index > cursor) {
      segments.push({ type: "text", content: str.slice(cursor, match.index) });
    }
    const token = match[0];
    const isBlock = token.startsWith("$$") || token.startsWith("\\[");
    // Strip delimiters
    const inner = token
      .replace(/^\$\$/, "").replace(/\$\$$/, "")
      .replace(/^\$/, "").replace(/\$$/, "")
      .replace(/^\\\[/, "").replace(/\\\]$/, "")
      .replace(/^\\\(/, "").replace(/\\\)$/, "")
      .trim();
    segments.push({ type: isBlock ? "block" : "inline", content: inner });
    cursor = match.index + token.length;
  }

  if (cursor < str.length) {
    segments.push({ type: "text", content: str.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ type: "text", content: str }];
};

const MathContent = ({ content, dark }) => {
  if (!content) return null;

  const textColor = dark ? "text-white" : "text-slate-900";
  const segments = parseMathSegments(String(content));

  // Pure text — skip KaTeX entirely
  if (segments.length === 1 && segments[0].type === "text") {
    return <span className={textColor}>{segments[0].content}</span>;
  }

  return (
    <span>
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return (
            <span key={i} className={textColor}>
              {seg.content}
            </span>
          );
        }
        try {
          return seg.type === "block" ? (
            <BlockMath key={i} math={seg.content} />
          ) : (
            <InlineMath key={i} math={seg.content} />
          );
        } catch {
          // KaTeX failed — fallback to plain text
          return (
            <span key={i} className={textColor}>
              {seg.content}
            </span>
          );
        }
      })}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────
   BUG FIX #2 — ANSWER CORRECTNESS CHECKER
   
   Original bug: the OR-chain
     Number(answer) === optionIndex ||
     answer.toUpperCase() === label  ||
     answer.toLowerCase() === option.toLowerCase()
   
   …could simultaneously mark MULTIPLE options as correct
   if the answer value was numeric AND matched option text,
   or if the data mixed letter/number/text formats.
   
   Fix: A single deterministic check with explicit priority:
   letter → index → full-text, in that order.
───────────────────────────────────────────────────────── */

const isAnswerCorrect = (answerValue, label, option, optionIndex) => {
  const ans = String(answerValue ?? "").trim();
  if (!ans) return false;

  // 1. Letter: "A" / "a" / "B" etc.
  if (/^[A-Ea-e]$/.test(ans)) {
    return ans.toUpperCase() === label;
  }

  // 2. Zero-based index: "0", "1", "2", "3", "4"
  if (/^\d$/.test(ans)) {
    return Number(ans) === optionIndex;
  }

  // 3. Full option text (trimmed, case-insensitive)
  return ans.toLowerCase() === String(option ?? "").trim().toLowerCase();
};

/* ─────────────────────────────────────────────────────────
   PAGINATION HELPER
───────────────────────────────────────────────────────── */

const buildPageRange = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
};

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */

export default function PastQuestionViewer({ dark = true }) {
  const navigate = useNavigate();
  const { subject: urlSubject } = useParams();
  const viewerRef = useRef(null);

  /* ── DATA ─────────────────────────────────────────────── */

  const allQuestions = useMemo(() => {
    if (!questionBank) return [];

    return Object.entries(questionBank).flatMap(([subjectName, subjectQuestions]) => {
      const groupedByYear = {};

      (subjectQuestions || []).forEach((q, i) => {
        const year = Number(q?.year || 2025);
        if (!groupedByYear[year]) groupedByYear[year] = [];
        groupedByYear[year].push({
          ...q,
          uid: q?.id ?? `${subjectName}-${year}-${i}`,
        });
      });

      return Object.entries(groupedByYear)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([year, questions]) => ({
          id: `${subjectName}-${year}`,
          year: Number(year),
          subject: subjectName,
          title: `JAMB ${subjectName} ${year}`,
          duration: "2 Hours",
          questions: questions.length,
          data: questions,
        }));
    });
  }, []);

  const subjects = useMemo(
    () => ["All Subjects", ...Object.keys(questionBank || {})],
    []
  );

  const years = useMemo(
    () => ["All Years", ...new Set(allQuestions.map((q) => q.year).sort((a, b) => b - a))],
    [allQuestions]
  );

  /* ── STATE ────────────────────────────────────────────── */

  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(urlSubject || "All Subjects");
  const [selectedYear, setSelectedYear] = useState("All Years");
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [page, setPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  /* ── FILTER ───────────────────────────────────────────── */

  const filteredQuestions = useMemo(() => {
    const q = search.toLowerCase();
    return allQuestions.filter((item) => {
      const matchSearch = item.title.toLowerCase().includes(q);
      const matchSubject = selectedSubject === "All Subjects" || item.subject === selectedSubject;
      const matchYear = selectedYear === "All Years" || item.year === Number(selectedYear);
      return matchSearch && matchSubject && matchYear;
    });
  }, [allQuestions, search, selectedSubject, selectedYear]);

  /* ── BUG FIX #3 — AUTO-SELECT EFFECT
     Original bug: having `selectedQuestion` in the dependency
     array caused an infinite update loop when the selection
     was set to filteredQuestions[0] which then changed the
     dep, re-triggering the effect.
     
     Fix: Use the functional form of setState to read current
     value inside the updater without adding it as a dep.
  ─────────────────────────────────────────────────────── */

  useEffect(() => {
    if (filteredQuestions.length === 0) {
      setSelectedQuestion(null);
      return;
    }
    setSelectedQuestion((prev) => {
      const stillExists = filteredQuestions.some((q) => q.id === prev?.id);
      return stillExists ? prev : filteredQuestions[0];
    });
  }, [filteredQuestions]);

  // Reset page whenever the selected paper changes
  useEffect(() => {
    setPage(1);
  }, [selectedQuestion?.id]);

  /* ── FULLSCREEN LISTENER ──────────────────────────────── */

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((selectedQuestion?.data?.length ?? 0) / QUESTIONS_PER_PAGE)),
    [selectedQuestion]
  );

  /* ── KEYBOARD NAVIGATION ──────────────────────────────── */

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setPage((p) => Math.min(p + 1, totalPages));
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setPage((p) => Math.max(p - 1, 1));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [totalPages]); 
  

  const currentQuestions = useMemo(
    () =>
      selectedQuestion?.data?.slice(
        (page - 1) * QUESTIONS_PER_PAGE,
        page * QUESTIONS_PER_PAGE
      ) ?? [],
    [page, selectedQuestion]
  );

  const answeredCount = useMemo(() => {
    if (!selectedQuestion) return 0;
    const paperUids = new Set(selectedQuestion.data.map((q) => q.uid));
    return Object.keys(selectedAnswers).filter((uid) => paperUids.has(uid)).length;
  }, [selectedAnswers, selectedQuestion]);

  const progressPct = selectedQuestion
    ? Math.round((answeredCount / selectedQuestion.questions) * 100)
    : 0;

  const pageRange = useMemo(() => buildPageRange(page, totalPages), [page, totalPages]);
  const t = {
    bg: dark ? "bg-[#030712]" : "bg-slate-100",
    card: dark
      ? "bg-white/[0.04] border-white/[0.08]"
      : "bg-white border-slate-200",
    text: dark ? "text-white" : "text-slate-900",
    sub: dark ? "text-slate-400" : "text-slate-500",
    ctrl: dark
      ? "bg-white/[0.05] border-white/[0.08] text-white hover:bg-white/[0.1] transition-colors"
      : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50 transition-colors",
    input: dark
      ? "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400",
    divider: dark ? "border-white/[0.08]" : "border-slate-200",
  };

  /* ── HANDLERS ─────────────────────────────────────────── */

  const zoomIn = useCallback(() => setZoomLevel((p) => Math.min(p + 10, 200)), []);
  const zoomOut = useCallback(() => setZoomLevel((p) => Math.max(p - 10, 70)), []);
  const resetZoom = useCallback(() => setZoomLevel(100), []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await viewerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  const selectAnswer = useCallback((questionId, answer) => {
    setSelectedAnswers((prev) =>
      prev[questionId] ? prev : { ...prev, [questionId]: answer }
    );
  }, []);

  const selectPaper = useCallback((item) => {
    setSelectedQuestion(item);
    setPage(1);
  }, []);

  /* ── RENDER ───────────────────────────────────────────── */

  return (
    <div className={`min-h-screen ${t.bg} transition-colors duration-500`}>
      <div className="mx-auto flex max-w-[1900px] flex-col gap-5 px-3 py-4 sm:px-5 lg:flex-row lg:px-6 xl:px-8">

        <aside
          className={`
            w-full lg:w-[340px] xl:w-[360px]
            lg:sticky lg:top-5 lg:h-[calc(100vh-40px)]
            flex flex-col
            rounded-[28px] border ${t.card}
            backdrop-blur-2xl overflow-hidden
          `}
        >
          {/* Fixed top section */}
          <div className={`p-5 pb-4 border-b ${t.divider} shrink-0`}>
            {/* Back + Icon */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate(-1)}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold ${t.ctrl}`}
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
                <BookOpen size={20} />
              </div>
            </div>

            {/* Heading */}
            <h1 className={`text-xl font-black tracking-tight ${t.text}`}>Past Questions</h1>
            <p className={`mt-1 text-xs leading-relaxed ${t.sub}`}>
              Browse JAMB papers by subject and year.
            </p>

            {/* Search */}
            <div className={`mt-4 flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 ${t.input}`}>
              <Search size={15} className={t.sub} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search papers…"
                className="w-full bg-transparent text-sm outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className={`rounded-full p-0.5 ${t.sub} hover:text-white transition-colors`}
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className={`rounded-xl border px-3 py-2.5 text-xs outline-none ${t.input}`}
              >
                {subjects.map((s) => (
                  <option key={s} value={s} className="text-black">{s}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className={`rounded-xl border px-3 py-2.5 text-xs outline-none ${t.input}`}
              >
                {years.map((y) => (
                  <option key={y} value={y} className="text-black">{y}</option>
                ))}
              </select>
            </div>

            {/* Stats */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className={`rounded-2xl border p-3.5 ${t.card}`}>
                <div className="flex items-center justify-between mb-2">
                  <Sparkles size={15} className="text-indigo-400" />
                  <span className={`text-[10px] ${t.sub}`}>Papers</span>
                </div>
                <p className={`text-2xl font-black ${t.text}`}>{filteredQuestions.length}</p>
              </div>

              <div className={`rounded-2xl border p-3.5 ${t.card}`}>
                <div className="flex items-center justify-between mb-2">
                  <Trophy size={15} className="text-amber-400" />
                  <span className={`text-[10px] ${t.sub}`}>Questions</span>
                </div>
                <p className={`text-2xl font-black ${t.text}`}>
                  {selectedQuestion?.questions ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable paper list — flex-1 + min-h-0 = fills remaining height */}
          <div className="flex-1 overflow-y-auto max-md:max-h-40 min-h-0 md:p-4 p-2 space-y-2">
            {filteredQuestions.length === 0 ? (
              <div className={`py-12 text-center text-sm ${t.sub}`}>
                <FileQuestion size={28} className="mx-auto mb-3 opacity-30" />
                <p>No papers match your filters.</p>
              </div>
            ) : (
              filteredQuestions.map((item) => {
                const isActive = selectedQuestion?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => selectPaper(item)}
                    className={`
                      w-full rounded-2xl border p-4 text-left
                      transition-all duration-200 hover:scale-[1.01]
                      ${isActive
                        ? "border-indigo-500 bg-indigo-500/10"
                        : `${t.card} hover:border-indigo-500/30`
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${t.text}`}>{item.title}</p>
                        <p className={`mt-1 text-xs ${t.sub}`}>{item.questions} questions</p>
                      </div>
                      <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                        isActive
                          ? "bg-indigo-500 text-white"
                          : "bg-indigo-500/10 text-indigo-400"
                      }`}>
                        {item.year}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ════════════════════════════════════════
            MAIN VIEWER
        ════════════════════════════════════════ */}
        <main
          ref={viewerRef}
          className={`
            flex-1 flex flex-col
            rounded-[28px] border ${t.card}
            overflow-hidden
          `}
          style={{ zoom: `${zoomLevel}%` }}
        >
          {/* ── TOPBAR ── */}
          <div className={`flex flex-col gap-4 border-b px-5 py-4 shrink-0 ${t.divider} lg:flex-row lg:items-center lg:justify-between`}>
            <div className="min-w-0 flex-1">
              <h2 className={`text-xl font-black truncate ${t.text}`}>
                {selectedQuestion?.title ?? "Select a paper to begin"}
              </h2>

              {selectedQuestion && (
                <div className={`mt-1.5 flex flex-wrap items-center gap-4 text-xs ${t.sub}`}>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {selectedQuestion.year}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock3 size={12} />
                    {selectedQuestion.duration}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileQuestion size={12} />
                    {selectedQuestion.questions} questions
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                    <Target size={12} />
                    {answeredCount}/{selectedQuestion.questions} answered ({progressPct}%)
                  </span>
                </div>
              )}

              {/* Progress bar */}
              {selectedQuestion && (
                <div className={`mt-3 h-1 rounded-full overflow-hidden ${dark ? "bg-white/10" : "bg-slate-200"}`}>
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              )}
            </div>

            {/* Zoom + Fullscreen controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={zoomOut}
                className={`rounded-xl border p-2.5 ${t.ctrl}`}
                aria-label="Zoom out"
              >
                <ZoomOut size={15} />
              </button>

              <button
                onClick={resetZoom}
                className={`rounded-xl border px-3 py-2.5 text-xs font-bold min-w-[50px] ${t.ctrl}`}
                aria-label="Reset zoom"
              >
                {zoomLevel}%
              </button>

              <button
                onClick={zoomIn}
                className={`rounded-xl border p-2.5 ${t.ctrl}`}
                aria-label="Zoom in"
              >
                <ZoomIn size={15} />
              </button>

              <div className={`w-px h-6 mx-1 ${dark ? "bg-white/10" : "bg-slate-200"}`} />

              <button
                onClick={toggleFullscreen}
                className={`rounded-xl border p-2.5 ${t.ctrl}`}
                aria-label="Toggle fullscreen"
              >
                {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            </div>
          </div>

          {/* ── QUESTIONS AREA ── */}
          <div className="flex-1 overflow-y-auto">
            {!selectedQuestion ? (
              // BUG FIX #5 — Added proper empty state (original had none)
              <div className={`flex h-full min-h-[400px] flex-col items-center justify-center py-20 text-center ${t.sub}`}>
                <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border ${t.card}`}>
                  <BookOpen size={28} className="opacity-40" />
                </div>
                <p className={`font-semibold ${t.text}`}>No paper selected</p>
                <p className="mt-1.5 text-xs opacity-60">Choose a subject and year from the sidebar</p>
              </div>
            ) : currentQuestions.length === 0 ? (
              <div className={`py-20 text-center text-sm ${t.sub}`}>No questions on this page.</div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedQuestion.id}-page-${page}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5 p-5 sm:p-7"
                >
                  {currentQuestions.map((question, index) => {
                    const qid = question.uid;
                    const options = Array.isArray(question.options)
                      ? question.options
                      : Object.values(question.options ?? {});
                    const selectedAnswer = selectedAnswers[qid];
                    const hasAnswered = Boolean(selectedAnswer);
                    const qNum = (page - 1) * QUESTIONS_PER_PAGE + index + 1;

                    return (
                      <div
                        key={qid}
                        className={`rounded-[22px] border p-5 sm:p-6 ${t.card}`}
                      >
                        {/* Question header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                          <span className="rounded-xl bg-indigo-500/10 px-3.5 py-1.5 text-xs font-bold text-indigo-400">
                            Question {qNum}
                          </span>
                          <span className={`text-xs ${t.sub}`}>
                            {selectedQuestion.subject} · {selectedQuestion.year}
                          </span>
                        </div>

                        {/* Question text */}
                        <div className={`text-base leading-relaxed overflow-x-auto ${t.text}`}>
                          <MathContent content={question.question} dark={dark} />
                        </div>

                        {/* Optional diagram */}
                        {question.image && (
                          <img
                            src={question.image}
                            alt={`Diagram for question ${qNum}`}
                            className={`mt-5 max-h-[320px] w-full rounded-2xl border object-contain ${t.divider}`}
                          />
                        )}

                        {/* Options */}
                        <div className="mt-5 grid gap-2.5">
                          {options.map((option, optIdx) => {
                            const label = OPTION_LABELS[optIdx];
                            const isSelected = selectedAnswer === label;

                            // BUG FIX #2 — single deterministic check
                            const correct = isAnswerCorrect(question.answer, label, option, optIdx);
                            const showCorrect = hasAnswered && correct;
                            const showWrong = hasAnswered && isSelected && !correct;

                            return (
                              <button
                                key={label}
                                disabled={hasAnswered}
                                onClick={() => selectAnswer(qid, label)}
                                className={`
                                  group flex items-start gap-3.5 rounded-2xl border p-4
                                  text-left transition-all duration-200
                                  ${!hasAnswered ? "hover:scale-[1.005] cursor-pointer" : "cursor-default"}
                                  ${showCorrect
                                    ? "border-emerald-500 bg-emerald-500/10"
                                    : showWrong
                                    ? "border-red-500 bg-red-500/10"
                                    : isSelected
                                    ? "border-indigo-500 bg-indigo-500/10"
                                    : `${t.input} border ${!hasAnswered ? "hover:border-indigo-400/40" : ""}`
                                  }
                                `}
                              >
                                {/* Letter bubble */}
                                <div
                                  className={`
                                    flex h-9 w-9 shrink-0 items-center justify-center
                                    rounded-xl text-xs font-black
                                    ${showCorrect
                                      ? "bg-emerald-500 text-white"
                                      : showWrong
                                      ? "bg-red-500 text-white"
                                      : isSelected
                                      ? "bg-indigo-500 text-white"
                                      : dark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"
                                    }
                                  `}
                                >
                                  {label}
                                </div>

                                {/* Option text */}
                                <div className={`flex-1 overflow-x-auto pt-1.5 text-sm leading-relaxed ${t.text}`}>
                                  <MathContent content={option} dark={dark} />
                                </div>

                                {/* Result icon */}
                                {showCorrect && (
                                  <CheckCircle2 size={17} className="shrink-0 mt-1.5 text-emerald-400" />
                                )}
                                {showWrong && (
                                  <XCircle size={17} className="shrink-0 mt-1.5 text-red-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation — animated reveal */}
                        <AnimatePresence>
                          {hasAnswered && question.explanation && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                              className="overflow-hidden"
                            >
                              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Eye size={14} className="text-indigo-400" />
                                  <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">
                                    Explanation
                                  </span>
                                </div>
                                <div className={`text-sm leading-relaxed overflow-x-auto ${t.text}`}>
                                  <MathContent content={question.explanation} dark={dark} />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* ── PAGINATION ── */}
          {currentQuestions.length > 0 && (
            <div className={`border-t px-5 py-4 shrink-0 flex items-center justify-between gap-3 ${t.divider}`}>
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-bold disabled:opacity-35 disabled:cursor-not-allowed ${t.ctrl}`}
              >
                <ChevronLeft size={15} />
                Prev
              </button>

              {/* Page number pills */}
              <div className="flex items-center gap-1">
                {pageRange.map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className={`px-1 text-xs ${t.sub}`}>…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(Number(p))}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                        page === Number(p)
                          ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                          : `border ${t.ctrl}`
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-bold disabled:opacity-35 disabled:cursor-not-allowed ${t.ctrl}`}
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}