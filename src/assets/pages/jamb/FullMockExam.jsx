import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { evaluate } from "mathjs";
import {
  ArrowLeft,
  Brain,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  Flag,
  Grid2X2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { db } from "../../../firebase/config";
import { AuthContext } from "../../context/AuthContext";
import { questionBank } from "../../data/questionBank";

const STORAGE_KEY = "unihelp-jamb-full-mock-v7";

const SUBJECT_LIMITS = {
  english: 60, mathematics: 40, physics: 40, chemistry: 40,
  biology: 40, economics: 40, government: 40, literature: 40,
  commerce: 40, geography: 40, crs: 40, irs: 40,
  agricultural: 40, history: 40, computerstudies: 40,
  music: 40, french: 40, finearts: 40,
};

const OPTION_LABELS = ["A", "B", "C", "D", "E"];

const CALC_BUTTONS = [
  "7", "8", "9", "/",
  "4", "5", "6", "*",
  "1", "2", "3", "-",
  "0", ".", "=", "+",
];

/* ── Utils ─────────────────────────────────────────────────── */
const shuffleArray = (array = []) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const formatSubjectKey = (s = "") => s.toLowerCase().replace(/\s/g, "");

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const MathContent = ({ text }) => {
  if (!text) return null;
  const str = String(text);
  const hasLatex = /\\[a-zA-Z]+|[\^_](?!\s)|\{[^}]+\}/.test(str);
  if (!hasLatex) return <span>{str}</span>;
  try {
    return <BlockMath math={str} />;
  } catch {
    return <span>{str}</span>;
  }
};


const FullMockExam = ({dark}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const timerRef = useRef(null);
  const submitRef = useRef(null);
  const theme = {
  bg: dark
    ? "bg-[#030712] text-white"
    : "bg-[#f5f7fb] text-slate-900",

  card: dark
    ? "bg-[#0b1120]/90 border border-white/10"
    : "bg-white border border-slate-200",

  soft: dark
    ? "bg-white/[0.05]"
    : "bg-slate-100",

  text: dark
    ? "text-slate-400"
    : "text-slate-500",

  option: dark
    ? "bg-[#111827] border-white/10 hover:border-indigo-500/30 hover:bg-white/[0.04]"
    : "bg-white border-slate-200 hover:bg-slate-50",

  selected: dark
    ? "border-indigo-500 bg-indigo-500/10"
    : "border-indigo-500 bg-indigo-50",
};
  const selectedSubjects = useMemo(
    () => location.state?.subjects || ["English", "Mathematics", "Physics", "Chemistry"],
    [location.state]
  );

  /* ── Access State ── */
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [blocked, setBlocked] = useState(false);

  /* ── Exam State ── */
  const [questionGroups, setQuestionGroups] = useState({});
  const [activeSubject, setActiveSubject] = useState(selectedSubjects[0]);
  const [subjectIndexes, setSubjectIndexes] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(7200);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorValue, setCalculatorValue] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [savingResult, setSavingResult] = useState(false);

  const persistExamState = useCallback(() => {
    if (submitted || !Object.keys(questionGroups).length) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        questionGroups,
        activeSubject,
        subjectIndexes,
        selectedAnswers,
        timeLeft,
      })
    );
  }, [
    submitted,
    questionGroups,
    activeSubject,
    subjectIndexes,
    selectedAnswers,
    timeLeft,
  ]);

  /* ── Check Access ── */
  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (!user?.uid) {
          setBlocked(true);
          return;
        }
        const [subSnap, userSnap] = await Promise.all([
          getDoc(doc(db, "subscriptions", user.uid)),
          getDoc(doc(db, "users", user.uid)),
        ]);

        const subData = subSnap.exists() ? subSnap.data() : {};
        const userData = userSnap.exists() ? userSnap.data() : {};

        const notExpired = subData?.expiresAt?.toDate?.() > new Date();
        const userPremium = userData?.premium === true;
        const userVerified = userData?.verified === true;
        const userSubscriptionActive =
          userData?.subscriptionStatus === "active" &&
          (userData?.subscriptionExpiresAt?.toDate?.() ?? new Date(0)) > new Date();
        const subscribed =
          subData?.subscription?.active === true &&
          subData?.subscription?.status === "approved" &&
          notExpired;
        const freeUsed = userData?.freeMockUsed === true;
        const canAccess =
          subscribed || userPremium || userVerified || userSubscriptionActive;

        setSubscriptionActive(canAccess);
        if (!canAccess && freeUsed) setBlocked(true);
      } catch {
        setBlocked(true);
      } finally {
        setCheckingAccess(false);
      }
    };
    checkAccess();
  }, [user]);

  const generatedQuestions = useMemo(() => {
    const result = {};
    selectedSubjects.forEach((subject) => {
      const key = formatSubjectKey(subject);
      const bank = questionBank?.[key] || [];
      const limit = SUBJECT_LIMITS[key] || 40;
      result[subject] = shuffleArray(bank)
        .slice(0, limit)
        .map((q, i) => ({
          ...q,
          id: q.id || `${key}-${i}`,
          uniqueId: `${key}-${q.id ?? i}`,
          number: i + 1,
          subject,
        }));
    });
    return result;
  }, [selectedSubjects]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setQuestionGroups(parsed.questionGroups ?? generatedQuestions);
        setActiveSubject(parsed.activeSubject ?? selectedSubjects[0]);
        setSubjectIndexes(parsed.subjectIndexes ?? {});
        setSelectedAnswers(parsed.selectedAnswers ?? {});
        setTimeLeft(parsed.timeLeft ?? 7200);
      } else {
        setQuestionGroups(generatedQuestions);
      }
    } catch {
      setQuestionGroups(generatedQuestions);
    } finally {
      setLoading(false);
    }
  }, [generatedQuestions, selectedSubjects]);

  /* ── Persist to Storage ── */
  useEffect(() => {
    persistExamState();
  }, [persistExamState]);

  useEffect(() => {
    const handleUnload = () => {
      persistExamState();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistExamState();
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [persistExamState]);

  const currentIndex = subjectIndexes[activeSubject] ?? 0;
  const activeQuestions = questionGroups?.[activeSubject] ?? [];
  const currentQuestion = activeQuestions[currentIndex] ?? null;

  const allQuestions = useMemo(() => Object.values(questionGroups).flat(), [questionGroups]);
  const totalQuestions = allQuestions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const score = useMemo(
    () => allQuestions.reduce((acc, q) => (selectedAnswers[q.uniqueId] === q.answer ? acc + 1 : acc), 0),
    [allQuestions, selectedAnswers]
  );
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  /* ── Submit ── */
  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);
    setSavingResult(true);
    clearInterval(timerRef.current);
    try {
      const payload = {
        uid: user?.uid ?? "",
        subjects: selectedSubjects,
        score, percentage, totalQuestions, selectedAnswers,
        createdAt: serverTimestamp(),
      };
      if (user?.uid) {
        await addDoc(collection(db, "jambUsers", user.uid, "mockResults"), payload);
        if (!subscriptionActive) {
          await setDoc(doc(db, "users", user.uid), { freeMockUsed: true }, { merge: true });
        }
      }
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingResult(false);
      setShowSubmitModal(false);
    }
  }, [submitted, user, selectedSubjects, score, percentage, totalQuestions, selectedAnswers, subscriptionActive]);

  useEffect(() => { submitRef.current = handleSubmit; }, [handleSubmit]);

  useEffect(() => {
    if (submitted || loading || blocked) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [submitted, loading, blocked]);

  /* ── Handlers ── */
  const handleSelect = (index) => {
    if (submitted || !currentQuestion) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.uniqueId]: index }));
  };

  const updateSubjectIndex = (subject, value) =>
    setSubjectIndexes((prev) => ({ ...prev, [subject]: value }));

  const nextQuestion = () => {
    if (currentIndex < activeQuestions.length - 1) {
      updateSubjectIndex(activeSubject, currentIndex + 1);
      return;
    }
    const si = selectedSubjects.indexOf(activeSubject);
    if (si < selectedSubjects.length - 1) setActiveSubject(selectedSubjects[si + 1]);
  };

  const previousQuestion = () => {
    if (currentIndex > 0) {
      updateSubjectIndex(activeSubject, currentIndex - 1);
      return;
    }
    const si = selectedSubjects.indexOf(activeSubject);
    if (si > 0) {
      const prev = selectedSubjects[si - 1];
      setActiveSubject(prev);
      updateSubjectIndex(prev, (questionGroups[prev] ?? []).length - 1);
    }
  };

  const restartExam = () => {
    localStorage.removeItem(STORAGE_KEY);
    clearInterval(timerRef.current);
    setQuestionGroups(generatedQuestions);
    setActiveSubject(selectedSubjects[0]);
    setSubjectIndexes({});
    setSelectedAnswers({});
    setSubmitted(false);
    setTimeLeft(7200);
  };

  const handleCalculator = (val) => {
    if (val === "=") {
      try { setCalculatorValue(String(evaluate(calculatorValue || "0"))); }
      catch { setCalculatorValue("Error"); }
    } else if (val === "C") {
      setCalculatorValue("");
    } else if (val === "⌫") {
      setCalculatorValue((p) => p.slice(0, -1));
    } else {
      setCalculatorValue((p) => (p === "Error" ? val : p + val));
    }
  };

  const isLastQuestion =
    activeSubject === selectedSubjects[selectedSubjects.length - 1] &&
    currentIndex === activeQuestions.length - 1;

  const timeWarning = timeLeft <= 300;
  const timeCritical = timeLeft <= 60;

  /* ── Loading ── */
  if (checkingAccess || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.bg}`}>
        <div className="text-center">
          <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Brain size={44} className="text-white" />
          </div>
          <h1 className={`text-3xl sm:text-4xl font-black ${theme.text}`}>Loading CBT…</h1>
          <p className="text-slate-500 mt-2 text-sm">Preparing your exam session</p>
        </div>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-5 ${theme.bg} relative overflow-hidden`}>
        <div className="absolute top-0 left-0 w-[450px] h-[450px] bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className={`relative w-full max-w-md border ${theme.card} border-white/10 backdrop-blur-xl rounded-[40px] p-8 text-center`}>
          <div className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-6">
            <Crown size={52} className="text-white" />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-semibold mb-4">
            <Sparkles size={13} /> Premium Required
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-3">Upgrade Now</h1>
          <p className="text-slate-400 leading-relaxed mb-8">
            Your free mock exam attempt has been used.
            Upgrade to UniHelp Premium for unlimited CBT access.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/subscription")}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
            >
              <Crown size={18} /> Upgrade to Premium
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full h-14 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.bg}`}>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-400">No questions available.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-5 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className={`min-h-screen ${theme.bg} relative`}>
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-[1800px] mx-auto p-3 sm:p-4 lg:p-5">

        {/* ── TOP BAR ── */}
        <div className={`bg-white/5 border border-white/10 backdrop-blur-xl rounded-[26px] sm:rounded-[30px] p-4 sm:p-5 mb-4`}>
          <div className="flex md:items-center flex-col md:flex-row md:justify-between gap-3 mb-4 sm:mb-5">

            {/* Left: Back + Title */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors"
              >
                <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-2xl sm:text-3xl font-black leading-none">UniHelp CBT</h1>
                  {subscriptionActive && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-semibold">
                      <Crown size={11} /> Premium
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Real JAMB Mock Experience</p>
              </div>
            </div>

            {/* Right: Timer + Tools */}
            <div className="flex max-md:justify-between items-center gap-2 sm:gap-3 shrink-0">
              <div className={`h-11 sm:h-14 px-4 sm:px-6 rounded-2xl flex items-center gap-2 font-black text-sm sm:text-base transition-colors ${timeCritical ? "bg-red-500 animate-pulse" : timeWarning ? "bg-orange-500" : "bg-red-600" 
                } text-white`}>
                <Clock3 size={16} className="sm:w-5 sm:h-5" />
                <span className="tabular-nums font-mono">{formatTime(timeLeft)}</span>
              </div>
              <button
                onClick={() => setShowCalculator(true)}
                className="w-20 h-11 sm:w-14 sm:h-14 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black flex items-center justify-center transition-colors"
                title="Open Calculator"
              >
                <Calculator size={20} className="sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setShowMap((p) => !p)}
                className={`xl:hidden w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-colors ${showMap ? "bg-indigo-600" : "bg-white/5 hover:bg-white/10"
                  }`}
                title="Question Map"
              >
                <Grid2X2 size={17} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          <div
            className="flex gap-2 overflow-x-auto pb-0.5"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {selectedSubjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setActiveSubject(subject)}
                className={`flex-shrink-0 h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-bold text-sm transition-all ${activeSubject === subject
                    ? "bg-indigo-600 text-white"
                    : `bg-white/5 hover:bg-white/10 ${dark ? 'text-slate-300' : "text-slate-500"} `
                  }`}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        {/* ── BODY GRID ── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

          {/* ── QUESTION PANEL ── */}
          <div className="xl:col-span-9">
            <div className={`${theme.card} border border-white/10 backdrop-blur-xl rounded-[26px] sm:rounded-[30px] p-5 sm:p-7 lg:p-8 min-h-[75vh]`}>

              {/* Question Meta */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-4 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-indigo-600 text-white font-black text-sm sm:text-base">
                    Q {currentIndex + 1}
                  </span>
                  <span className="px-3 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-sm">
                    {activeSubject}
                  </span>
                  <span className={`px-3 py-2 rounded-xl ${theme.text} ${theme.soft} text-xs`}>
                    {currentIndex + 1} / {activeQuestions.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl ${theme.soft} text-xs sm:text-sm`}>
                    Done: <span className={`${theme.text} font-bold`}>{answeredCount}</span>
                  </span>
                  <span className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl ${theme.soft} text-xs sm:text-sm`}>
                    Left: <span className="text-yellow-400 font-bold">{unansweredCount}</span>
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-7 sm:mb-9 text-base sm:text-xl font-semibold leading-relaxed">
                <span className="text-indigo-400 font-black mr-2">{currentQuestion.number}.</span>
                <MathContent text={currentQuestion.question} />
              </div>

              {/* Question Image */}
              {currentQuestion.image && (
                <div className="mb-7">
                  <img
                    src={currentQuestion.image}
                    alt="Question diagram"
                    className="max-w-full rounded-2xl border border-white/10 object-contain"
                  />
                </div>
              )}

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options?.map((option, index) => {
                  const isSelected = selectedAnswers[currentQuestion.uniqueId] === index;
                  const isCorrect = submitted && currentQuestion.answer === index;
                  const isWrong = submitted && isSelected && currentQuestion.answer !== index;

                  return (
                    <button
                      key={index}
                      disabled={submitted}
                      onClick={() => handleSelect(index)}
                      className={`w-full border rounded-[20px] sm:rounded-[26px] p-4 sm:p-5 text-left transition-all duration-200 ${isCorrect
                          ? "border-green-500 bg-green-500/10"
                          : isWrong
                            ? "border-red-500 bg-red-500/10"
                            : isSelected
                              ? "border-indigo-500 bg-indigo-500/10"
                              : `${theme.option}`
                        } ${submitted ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <div className="flex items-center gap-3 sm:gap-5">
  <div className={`w-10 h-10 sm:w-13 sm:h-13 min-w-[40px] sm:min-w-[52px] rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-sm sm:text-base shrink-0 transition-colors ${isCorrect ? "bg-green-500 text-white" : isWrong ? "bg-red-500 text-white" : isSelected ? "bg-indigo-600 text-white" : `${theme.option}`}`}>
                          {OPTION_LABELS[index]}
                        </div>
                        <div className="flex-1 text-sm sm:text-base font-medium leading-relaxed">
                          <MathContent text={option} />
                        </div>
                        {isCorrect && <CheckCircle2 size={18} className="text-green-400 shrink-0" />}
                        {isWrong && <XCircle size={18} className="text-red-400 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation (post-submit) */}
              {submitted && currentQuestion.explanation && (
                <div className={`mt-6 sm:mt-8 rounded-[22px] sm:rounded-[28px] border border-indigo-500/20 ${theme.bg} p-5 sm:p-6`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles size={16} className="text-indigo-400" />
                    <h3 className="text-base sm:text-lg font-black text-indigo-400">Explanation</h3>
                  </div>
                  <div className={`text-sm sm:text-base leading-relaxed ${theme.text}`}>
                    <MathContent text={currentQuestion.explanation} />
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={previousQuestion}
                  className={`h-12 sm:h-14 px-5 sm:px-7 rounded-2xl  hover:bg-white/10 font-bold flex items-center gap-2 text-sm sm:text-base transition-colors ${theme.bg}`}
                >
                  <ChevronLeft size={18} /> Previous
                </button>

                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={restartExam}
                    className="h-12 sm:h-14 px-4 sm:px-7 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-bold flex items-center gap-2 text-sm sm:text-base transition-colors"
                  >
                    <RotateCcw size={16} />
                    <span className="hidden sm:inline">Restart</span>
                  </button>

                  {isLastQuestion ? (
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className="h-12 sm:h-14 px-6 sm:px-8 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-black flex items-center gap-2 sm:gap-3 text-sm sm:text-base transition-colors"
                    >
                      <Flag size={16} /> Submit Exam
                    </button>
                  ) : (
                    <button
                      onClick={nextQuestion}
                      className="h-12 sm:h-14 px-6 sm:px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black flex items-center gap-2 sm:gap-3 text-sm sm:text-base transition-colors"
                    >
                      Next <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Result Banner (post-submit) */}
              {submitted && (
                <div className="mt-8 sm:mt-10 rounded-[26px] sm:rounded-[32px] border border-green-500/20 bg-green-500/8 p-6 sm:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[22px] sm:rounded-[28px] bg-green-500 text-white flex items-center justify-center mb-4 sm:mb-5">
                        <Trophy size={38} className="sm:w-11 sm:h-11" />
                      </div>
                      <h1 className="text-3xl sm:text-4xl font-black mb-2">Exam Submitted!</h1>
                      <p className={`${theme.text}`}>Your CBT result has been saved.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-center">
                        <p className="text-xs sm:text-sm text-slate-400 mb-2">Score</p>
                        <h2 className="text-4xl sm:text-5xl font-black text-green-400">{score}</h2>
                        <p className="text-slate-500 text-sm mt-1">/ {totalQuestions}</p>
                      </div>
                      <div className="bg-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-center">
                        <p className="text-xs sm:text-sm text-slate-400 mb-2">Percentage</p>
                        <h2 className="text-4xl sm:text-5xl font-black text-cyan-400">{percentage}%</h2>
                        <p className="text-slate-500 text-sm mt-1">Overall</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className={`xl:col-span-3 ${showMap ? "block" : "hidden xl:block"}`}>
            <div className={`${theme.card} border border-white/10 backdrop-blur-xl rounded-[26px] sm:rounded-[30px] p-5 xl:sticky xl:top-5`}>

              {/* Sidebar Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-black">CBT Overview</h2>
                  <p className={`text-xs sm:text-sm ${theme.text}`}>Track your progress</p>
                </div>
              </div>

              {/* Progress */}
              <div className="bg-white/5 rounded-2xl sm:rounded-3xl p-5 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Progress</p>
                    <h2 className="text-4xl sm:text-5xl font-black">{progress}%</h2>
                  </div>
                  <ShieldCheck size={26} className="text-indigo-400" />
                </div>
                <div className="mt-4 h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2.5 text-xs text-slate-500">
                  <span>{answeredCount} answered</span>
                  <span>{unansweredCount} remaining</span>
                </div>
              </div>

              {/* Question Map */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black">Question Map</h3>
                  <p className="text-xs text-slate-500">Quick navigation</p>
                </div>
                <Grid2X2 size={17} className="text-indigo-400" />
              </div>

              <div className="grid grid-cols-5 gap-2">
                {activeQuestions.map((question, index) => {
                  const isAnswered = selectedAnswers[question.uniqueId] !== undefined;
                  const isCurrent = currentIndex === index;
                  return (
                    <button
                      key={question.uniqueId}
                      onClick={() => updateSubjectIndex(activeSubject, index)}
                      className={`h-10 sm:h-12 rounded-xl font-bold text-xs sm:text-sm transition-all ${isCurrent
                          ? "bg-indigo-600 text-white"
                          : isAnswered
                            ? "bg-green-500/15 border border-green-500/25 text-green-400"
                            : "bg-white/5 hover:bg-white/10 text-slate-500"
                        }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className={`flex items-center gap-4 mt-4 text-xs ${theme.text}`}>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" /> Current
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-green-500/60 inline-block" /> Answered
                </span>
              </div>

              {/* Quick Submit */}
              {!submitted && (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="w-full h-12 mt-5 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-black flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <Flag size={15} /> Submit Exam
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── SUBMIT MODAL ── */}
      {showSubmitModal && (
        <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4`}>
          <div className={`w-full max-w-md  border border-white/10 backdrop-blur-xl rounded-[32px] p-7 text-center ${theme.card}`}>
            <div className="w-24 h-24 rounded-[28px] bg-green-600 flex items-center justify-center mx-auto mb-6">
              <Flag size={44} className="text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mb-3">Submit Exam?</h1>
            <p className="text-slate-400 mb-2">
              You have{" "}
              <span className="text-yellow-400 font-bold">{unansweredCount}</span>
              {" "}unanswered question{unansweredCount !== 1 ? "s" : ""}.
            </p>
            <p className="text-xs text-slate-600 mb-8">This action cannot be undone.</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-colors"
              >
                Continue
              </button>
              <button
                disabled={savingResult}
                onClick={handleSubmit}
                className="h-14 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold transition-colors disabled:opacity-60"
              >
                {savingResult ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CALCULATOR MODAL ── */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0b1120] border border-white/10 backdrop-blur-xl rounded-[32px] overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black">Calculator</h2>
                <p className="text-sm text-slate-400">Scientific operations</p>
              </div>
              <button
                onClick={() => setShowCalculator(false)}
                className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-5">
              {/* Display */}
              <div className="h-20 sm:h-24 rounded-2xl bg-white/5 mb-4 flex flex-col items-end justify-end px-5 py-3 overflow-hidden">
                <span className="text-slate-500 text-xs mb-1">{calculatorValue ? "=" : ""}</span>
                <span className="text-3xl sm:text-4xl font-black font-mono truncate w-full text-right">
                  {calculatorValue || "0"}
                </span>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                {CALC_BUTTONS.map((btn) => (
                  <button
                    key={btn}
                    onClick={() => handleCalculator(btn)}
                    className={`h-14 rounded-2xl font-black text-base sm:text-lg transition-colors ${btn === "="
                        ? "bg-green-500 hover:bg-green-400 text-white"
                        : ["+", "-", "*", "/"].includes(btn)
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                          : "bg-white/5 hover:bg-white/10 text-white"
                      }`}
                  >
                    {btn === "*" ? "×" : btn === "/" ? "÷" : btn}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-2.5 sm:mt-3">
                <button
                  onClick={() => handleCalculator("⌫")}
                  className="h-12 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-white font-bold transition-colors"
                >
                  ⌫ Delete
                </button>
                <button
                  onClick={() => handleCalculator("C")}
                  className="h-12 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-bold transition-colors"
                >
                  C Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullMockExam;
