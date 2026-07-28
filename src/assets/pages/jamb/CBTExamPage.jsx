import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Bookmark,
  Brain,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  Grid2X2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  X,
  BookOpen,
} from "lucide-react";

import { evaluate } from "mathjs";

import {
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../../../firebase/config";
import { questionBank } from "../../data/questionBank";

const STORAGE_PREFIX = "unihelp-cbt-v4";
const QUESTION_MAP_LIMIT = 40;

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";

  return "Good Evening";
};

const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
  theme,
}) => {
  return (
    <div
      className={`rounded-2xl border p-4 flex items-center justify-between ${
        theme.card
      } ${theme.border}`}
    >
      <div>
        <p
          className={`text-[11px] uppercase tracking-wide ${theme.muted}`}
        >
          {label}
        </p>

        <h2 className={`text-md font-bold mt-2 ${color}`}>
          {value}
        </h2>
      </div>

      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.soft} ${color}`}
      >
        <Icon size={22} />
      </div>
    </div>
  );
};

const CBTExamPage = ({ dark }) => {
  const navigate = useNavigate();

  const { subjectId, topicId } = useParams();

  const normalizedSubject = subjectId?.toLowerCase();
  const normalizedTopic = topicId?.toLowerCase();

  /* =========================================================
     THEME
  ========================================================= */

  const theme = useMemo(() => {
    return dark
      ? {
          bg: "bg-[#020617]",
          card: "bg-white/[0.04] backdrop-blur-xl",
          soft: "bg-white/10",
          border: "border-white/10",
          text: "text-white",
          muted: "text-slate-400",
          hover: "hover:bg-white/20",
          option: "bg-white/[0.03] hover:bg-white/[0.06]",
          input: "bg-black/30",
        }
      : {
          bg: "bg-slate-100",
          card: "bg-white",
          soft: "bg-slate-200",
          border: "border-slate-200",
          text: "text-slate-900",
          muted: "text-slate-500",
          hover: "hover:bg-slate-300",
          option: "bg-slate-50 hover:bg-slate-100",
          input: "bg-slate-100",
        };
  }, [dark]);

  const allQuestions = questionBank?.[normalizedSubject] || [];

  const questions = useMemo(() => {
    if (!normalizedTopic) return allQuestions;

    return allQuestions.filter(
      (q) =>
        q.topic?.toLowerCase()?.trim() ===
        normalizedTopic?.toLowerCase()?.trim(),
    );
  }, [allQuestions, normalizedTopic]);

  const storageKey = `${STORAGE_PREFIX}-${normalizedSubject}-${normalizedTopic}`;

  const timerRef = useRef(null);
  const submitRef = useRef(null);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState({});
  const [bookmarked, setBookmarked] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [showSubmitModal, setShowSubmitModal] =
    useState(false);

  const [calculatorOpen, setCalculatorOpen] =
    useState(false);

  const [calculatorValue, setCalculatorValue] =
    useState("");

  const [timeLeft, setTimeLeft] = useState(
    Math.max(questions.length * 60, 300),
  );

  const currentQuestion = questions[current];
  const mapQuestions = useMemo(
    () => questions.slice(0, QUESTION_MAP_LIMIT),
    [questions],
  );
  const mapLimitReached = questions.length > QUESTION_MAP_LIMIT;
  const isLastQuestion = current >= questions.length - 1;

  const answeredCount = Object.keys(selected).length;

  const unansweredCount =
    questions.length - answeredCount;

  const progress = questions.length
    ? Math.round(
        (answeredCount / questions.length) * 100,
      )
    : 0;

  /* =========================================================
     SCORE
  ========================================================= */

  const score = useMemo(() => {
    let total = 0;

    questions.forEach((question, index) => {
      if (selected[index] === question.answer) {
        total++;
      }
    });

    return total;
  }, [questions, selected]);

  const percentage = questions.length
    ? Math.round((score / questions.length) * 100)
    : 0;

  /* =========================================================
     LOAD PROGRESS
  ========================================================= */

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const local = localStorage.getItem(storageKey);

        if (local) {
          const parsed = JSON.parse(local);

          setCurrent(parsed.current || 0);
          setSelected(parsed.selected || {});
          setBookmarked(parsed.bookmarked || []);
          setTimeLeft(
            parsed.timeLeft ||
              Math.max(questions.length * 60, 300),
          );

          setLoading(false);

          return;
        }

        if (auth.currentUser) {
          const ref = doc(
            db,
            "cbtProgress",
            auth.currentUser.uid,
          );

          const snap = await getDoc(ref);

          if (snap.exists()) {
            const data = snap.data();

            if (
              data.subject === normalizedSubject &&
              data.topic === normalizedTopic
            ) {
              setCurrent(data.current || 0);
              setSelected(data.selected || {});
              setBookmarked(data.bookmarked || []);
              setTimeLeft(
                data.timeLeft ||
                  Math.max(
                    questions.length * 60,
                    300,
                  ),
              );
            }
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [
    normalizedSubject,
    normalizedTopic,
    questions.length,
    storageKey,
  ]);

  /* =========================================================
     SAVE PROGRESS
  ========================================================= */

  useEffect(() => {
    if (loading) return;

    const saveProgress = async () => {
      try {
        const payload = {
          subject: normalizedSubject,
          topic: normalizedTopic,
          current,
          selected,
          bookmarked,
          timeLeft,
          updatedAt: serverTimestamp(),
        };

        localStorage.setItem(
          storageKey,
          JSON.stringify(payload),
        );

        if (auth.currentUser) {
          await setDoc(
            doc(
              db,
              "cbtProgress",
              auth.currentUser.uid,
            ),
            payload,
            { merge: true },
          );
        }
      } catch (error) {
        console.log(error);
      }
    };

    saveProgress();
  }, [
    current,
    selected,
    bookmarked,
    timeLeft,
    normalizedSubject,
    normalizedTopic,
    storageKey,
    loading,
  ]);

  /* =========================================================
     TIMER
  ========================================================= */

  useEffect(() => {
    if (submitted || paused || loading) return;

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
  }, [submitted, paused, loading]);

  /* =========================================================
     ACTIONS
  ========================================================= */

  const handleSelect = (optionIndex) => {
    if (submitted) return;

    setSelected((prev) => ({
      ...prev,
      [current]: optionIndex,
    }));
  };

  const toggleBookmark = () => {
    if (bookmarked.includes(current)) {
      setBookmarked((prev) =>
        prev.filter((item) => item !== current),
      );
    } else {
      setBookmarked((prev) => [...prev, current]);
    }
  };

  const restartExam = () => {
    localStorage.removeItem(storageKey);

    setCurrent(0);
    setSelected({});
    setBookmarked([]);
    setSubmitted(false);
    setShowResult(false);
    setShowSubmitModal(false);
    setCalculatorOpen(false);
    setCalculatorValue("");
    setPaused(false);
    setTimeLeft(
      Math.max(questions.length * 60, 300),
    );
  };

  const handleSubmit = useCallback(async () => {
    if (submitted) return;

    try {
      setSubmitted(true);
      setShowSubmitModal(false);
      setShowResult(true);

      clearInterval(timerRef.current);

      const result = {
        uid: auth.currentUser?.uid || null,
        subject: normalizedSubject,
        topic: normalizedTopic,
        score,
        total: questions.length,
        percentage,
        answers: selected,
        completedAt: serverTimestamp(),
      };

      if (auth.currentUser) {
        const uid = auth.currentUser.uid;

        await setDoc(
          doc(
            db,
            "cbtResults",
            `${uid}-${normalizedSubject}-${normalizedTopic}`,
          ),
          result,
          { merge: true },
        );

        const userRef = doc(db, "users", uid);

        await setDoc(
          userRef,
          {
            examsTaken: increment(1),
            totalScore: increment(score),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        if (percentage >= 80) {
          await updateDoc(userRef, {
            topPerformer: true,
          });
        }
      }

      localStorage.removeItem(storageKey);
    } catch (error) {
      console.log(error);
    }
  }, [
    submitted,
    normalizedSubject,
    normalizedTopic,
    score,
    questions.length,
    percentage,
    selected,
    storageKey,
  ]);

  useEffect(() => {
    submitRef.current = handleSubmit;
  }, [handleSubmit]);

  /* =========================================================
     CALCULATOR
  ========================================================= */

  const handleCalculator = (value) => {
    if (value === "=") {
      try {
        const result = evaluate(calculatorValue || "0");

        setCalculatorValue(String(result));
      } catch {
        setCalculatorValue("Error");
      }

      return;
    }

    if (value === "C") {
      setCalculatorValue("");
      return;
    }

    if (value === "DEL") {
      setCalculatorValue((prev) =>
        prev.slice(0, -1),
      );

      return;
    }

    setCalculatorValue(
      (prev) => prev + value,
    );
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme.bg} ${theme.text}`}
      >
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Brain size={35} />
          </div>

          <h1 className="text-2xl font-bold">
            Loading CBT...
          </h1>
        </div>
      </div>
    );
  }

  /* =========================================================
     NO QUESTIONS
  ========================================================= */

  if (!questions.length) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center px-4 ${theme.bg}`}
      >
        <div
          className={`max-w-lg w-full rounded-3xl border p-8 text-center ${theme.card} ${theme.border} ${theme.text}`}
        >
          <BookOpen
            size={50}
            className="mx-auto mb-5 text-indigo-400"
          />

          <h1 className="text-2xl font-bold mb-3">
            No Questions Found
          </h1>

          <p className={theme.muted}>
            No questions are available for this topic yet.
          </p>

          <button
            onClick={() => navigate(-1)}
            className="mt-6 h-12 px-6 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white transition-all font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div
      className={`min-h-screen overflow-x-hidden ${theme.bg} ${theme.text}`}
    >
      <div className="max-w-[1500px] mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-5">
        {/* HEADER */}

        <div
          className={`rounded-3xl border p-5 mb-5 ${theme.card} ${theme.border}`}
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${theme.soft} ${theme.hover}`}
              >
                <ArrowLeft size={20} />
              </button>

              <div>
                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                  <Sparkles size={15} />

                  <span className="text-sm">
                    {getGreeting()}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold capitalize">
                  {normalizedSubject}
                </h1>

                <p
                  className={`mt-1 text-sm capitalize ${theme.muted}`}
                >
                  Topic: {normalizedTopic}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full xl:max-w-[820px]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  icon={Target}
                  label="Progress"
                  value={`${progress}%`}
                  color="text-indigo-400"
                  theme={theme}
                />

                <StatCard
                  icon={CheckCircle2}
                  label="Answered"
                  value={`${answeredCount}/${questions.length}`}
                  color="text-green-400"
                  theme={theme}
                />

                <StatCard
                  icon={Clock3}
                  label="Time"
                  value={formatTime(timeLeft)}
                  color="text-red-400"
                  theme={theme}
                />

                <button
                  onClick={() =>
                    setCalculatorOpen(true)
                  }
                  className={`rounded-2xl border p-4 flex items-center justify-between text-left transition-all ${theme.card} ${theme.border} ${theme.hover}`}
                >
                  <div>
                    <p
                      className={`text-[11px] uppercase tracking-wide ${theme.muted}`}
                    >
                      Tools
                    </p>

                    <h2
                      className={`text-[13px] font-medium mt-2 ${theme.text}`}
                    >
                      Calculator
                    </h2>
                  </div>

                  <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center bg-indigo-500 text-white">
                    <Calculator size={22} />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN */}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_390px] gap-5 items-start">
          {/* QUESTION */}

          <div className="min-w-0 space-y-5">
            <div
              className={`min-w-0 rounded-3xl border overflow-hidden ${theme.card} ${theme.border}`}
            >
              <div className="h-1.5 bg-black/10">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <div className="p-5 sm:p-7">
                {/* TOP */}

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-3 mb-4">
                      <div className="px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold">
                        Question {current + 1}
                      </div>

                      <div
                        className={`px-4 py-2 rounded-full border text-sm font-semibold capitalize ${theme.soft} ${theme.border}`}
                      >
                        {normalizedTopic}
                      </div>
                    </div>

                    <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold leading-relaxed">
                      {currentQuestion.question}
                    </h2>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={toggleBookmark}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                        bookmarked.includes(current)
                          ? "bg-yellow-500 text-white"
                          : `${theme.soft} ${theme.hover}`
                      }`}
                    >
                      <Bookmark size={18} />
                    </button>

                    <button
                      onClick={() =>
                        setPaused(!paused)
                      }
                      className="w-11 h-11 rounded-xl bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white"
                    >
                      {paused ? (
                        <Play size={18} />
                      ) : (
                        <Pause size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* OPTIONS */}

                <div className="space-y-3">
                  {currentQuestion.options.map(
                    (option, index) => {
                      const isSelected =
                        selected[current] === index;

                      const isCorrect =
                        submitted &&
                        currentQuestion.answer ===
                          index;

                      const isWrong =
                        submitted &&
                        isSelected &&
                        !isCorrect;

                      return (
                        <button
                          key={index}
                          onClick={() =>
                            handleSelect(index)
                          }
                          disabled={submitted}
                          className={`w-full rounded-2xl border p-4 transition-all text-left ${
                            isCorrect
                              ? "border-green-500 bg-green-500/10"
                              : isWrong
                                ? "border-red-500 bg-red-500/10"
                                : isSelected
                                  ? "border-indigo-500 bg-indigo-500/10"
                                  : `${theme.option} ${theme.border}`
                          }`}
                        >
                          <div className="flex gap-4 items-start">
                            <div
                              className={`min-w-[42px] h-[42px] rounded-xl flex items-center justify-center font-bold text-white ${
                                isCorrect
                                  ? "bg-green-500"
                                  : isWrong
                                    ? "bg-red-500"
                                    : isSelected
                                      ? "bg-indigo-500"
                                      : "bg-slate-500"
                              }`}
                            >
                              {String.fromCharCode(
                                65 + index,
                              )}
                            </div>

                            <p className="text-[15px] sm:text-base leading-relaxed">
                              {option}
                            </p>
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>

                {/* NAVIGATION */}

                <div className="flex flex-col sm:flex-row gap-3 justify-between mt-8">
                  <button
                    disabled={current === 0}
                    onClick={() =>
                      setCurrent(
                        (prev) => prev - 1,
                      )
                    }
                    className={`h-12 px-5 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 font-semibold transition-all ${theme.soft} ${theme.hover}`}
                    >
                    <ChevronLeft size={18} />
                    Previous
                  </button>

                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      onClick={restartExam}
                      className="h-12 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={18} />
                      Restart
                    </button>

                    <button
                      disabled={isLastQuestion}
                      onClick={() =>
                        !isLastQuestion &&
                        setCurrent(
                          (prev) => prev + 1,
                        )
                      }
                      className="h-12 px-5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2"
                    >
                      Next
                      <ChevronRight size={18} />
                    </button>

                    <button
                      onClick={() =>
                        setShowSubmitModal(true)
                      }
                      disabled={submitted}
                      className="h-12 px-5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2"
                    >
                      <Flag size={18} />
                      {submitted ? "Submitted" : "Submit Exam"}
                    </button>
                  </div>
                </div>

                {/* RESULT */}

                {showResult && (
                  <div className="mt-8 rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-6">
                    <div className="flex flex-col lg:flex-row gap-6 justify-between">
                      <div>
                        <div className="w-20 h-20 rounded-3xl bg-indigo-500 flex items-center justify-center mb-5">
                          <Trophy size={35} />
                        </div>

                        <h1 className="text-3xl font-bold">
                          Exam Completed
                        </h1>

                        <p
                          className={`mt-3 ${theme.muted}`}
                        >
                          Your performance summary.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div
                          className={`rounded-2xl p-5 ${theme.soft}`}
                        >
                          <p
                            className={`text-sm ${theme.muted}`}
                          >
                            Score
                          </p>

                          <h2 className="text-4xl font-bold text-indigo-400 mt-2">
                            {score}
                          </h2>
                        </div>

                        <div
                          className={`rounded-2xl p-5 ${theme.soft}`}
                        >
                          <p
                            className={`text-sm ${theme.muted}`}
                          >
                            Accuracy
                          </p>

                          <h2 className="text-4xl font-bold text-green-400 mt-2">
                            {percentage}%
                          </h2>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-7">
                      <button
                        onClick={restartExam}
                        className="h-12 px-5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
                      >
                        Retake
                      </button>

                      <button
                        onClick={() =>
                          navigate("/subjects")
                        }
                        className={`h-12 px-5 rounded-xl font-semibold transition-all ${theme.soft} ${theme.hover}`}
                      >
                        Back Home
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QUESTION MAP */}

          <div className="min-w-0 xl:sticky xl:top-5 self-start">
            <div
              className={`rounded-3xl border p-5 ${theme.card} ${theme.border} xl:max-h-[calc(100vh-2.5rem)] xl:overflow-y-auto`}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">
                    Question Map
                  </h2>

                  <p
                    className={`text-sm mt-1 ${theme.muted}`}
                  >
                    Quick navigation
                  </p>
                </div>

                <Grid2X2 className="text-indigo-400" />
              </div>

              <div className="grid grid-cols-7 gap-2 sm:gap-3">
                {mapQuestions.map((_, index) => {
                  const answered =
                    selected[index] !== undefined;

                  const marked =
                    bookmarked.includes(index);

                  return (
                    <button
                      key={index}
                      onClick={() =>
                        setCurrent(index)
                      }
                      className={`h-11 sm:h-12 shrink-0 rounded-xl font-bold transition-all text-sm ${
                        current === index
                          ? "bg-indigo-500 text-white"
                          : marked
                            ? "bg-yellow-500/20 border border-yellow-500/30 text-yellow-400"
                            : answered
                              ? "bg-green-500/20 border border-green-500/30 text-green-400"
                              : `${theme.soft} ${theme.border}`
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3 mt-5 text-[11px] sm:text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
                  Current
                </span>

                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                  Answered
                </span>

                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
                  Bookmarked
                </span>
              </div>

              {mapLimitReached && (
                <p className={`mt-4 text-xs leading-relaxed ${theme.muted}`}>
                  Showing the first 40 questions in the map for faster navigation.
                </p>
              )}

              <button
                onClick={() =>
                  setShowSubmitModal(true)
                }
                disabled={submitted}
                className="w-full h-12 mt-5 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                <Flag size={16} />
                {submitted ? "Submitted" : "Submit Exam"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUBMIT MODAL */}

      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 ${theme.card} ${theme.border}`}
          >
            <div className="w-20 h-20 rounded-3xl bg-green-500 mx-auto flex items-center justify-center mb-5 text-white">
              <Flag size={35} />
            </div>

            <h1 className="text-2xl font-bold text-center">
              Submit Exam?
            </h1>

            <p
              className={`text-center mt-3 ${theme.muted}`}
            >
              You still have{" "}
              <span className="text-yellow-400 font-bold">
                {unansweredCount}
              </span>{" "}
              unanswered questions.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-7">
              <button
                onClick={() =>
                  setShowSubmitModal(false)
                }
                className={`h-12 rounded-xl font-semibold transition-all ${theme.soft} ${theme.hover}`}
              >
                Continue
              </button>

              <button
                onClick={handleSubmit}
                className="h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR */}

      {calculatorOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className={`w-full max-w-sm rounded-3xl overflow-hidden border ${theme.card} ${theme.border}`}
          >
            <div
              className={`p-5 border-b flex items-center justify-between ${theme.border}`}
            >
              <div>
                <h2 className="text-xl font-bold">
                  Calculator
                </h2>

                <p
                  className={`text-sm mt-1 ${theme.muted}`}
                >
                  Quick calculation
                </p>
              </div>

              <button
                onClick={() =>
                  setCalculatorOpen(false)
                }
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${theme.soft} ${theme.hover}`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <div
                className={`h-20 rounded-2xl border mb-5 flex items-end justify-end px-4 py-3 text-3xl font-bold overflow-hidden ${theme.input} ${theme.border}`}
              >
                {calculatorValue || "0"}
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[
                  "7",
                  "8",
                  "9",
                  "/",
                  "4",
                  "5",
                  "6",
                  "*",
                  "1",
                  "2",
                  "3",
                  "-",
                  "0",
                  ".",
                  "+",
                  "=",
                ].map((btn) => (
                  <button
                    key={btn}
                    onClick={() =>
                      handleCalculator(btn)
                    }
                    className={`h-14 rounded-2xl font-bold text-lg transition-all ${
                      btn === "="
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : ["+", "-", "*", "/"].includes(
                              btn,
                            )
                          ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                          : `${theme.soft} ${theme.hover}`
                    }`}
                  >
                    {btn}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <button
                  onClick={() =>
                    handleCalculator("DEL")
                  }
                  className="h-12 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                >
                  Delete
                </button>

                <button
                  onClick={() =>
                    handleCalculator("C")
                  }
                  className="h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CBTExamPage;
