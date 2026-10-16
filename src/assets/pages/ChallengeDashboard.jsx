import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Check,
  Clock,
  Crown,
  Flame,
  Loader2,
  Medal,
  RotateCcw,
  SkipForward,
  Sparkles,
  Target,
  Trophy,
  X,
} from "lucide-react";
import ChallengeOverviewPage from "./challenges/ChallengeOverviewPage";
import ChallengeCategoriesPage from "./challenges/ChallengeCategoriesPage";
import ChallengeLeaderboardPage from "./challenges/ChallengeLeaderboardPage";
import ChallengeAchievementsPage from "./challenges/ChallengeAchievementsPage";
import ChallengeHistoryPage from "./challenges/ChallengeHistoryPage";
import { getTheme, RANK_COLORS, CATEGORY_TONES, getTimeLimit, colors } from "../data/theme";
import CountdownRing from "../components/CountdownRing";

const QUESTIONS_URL = "https://unihelp-backend-dg0o.onrender.com/api/challenge-questions";
const QUESTIONS_PER_QUIZ = 8;

const CHALLENGE_CATEGORIES = [
  { id: "daily", title: "Daily Challenge", subtitle: "New questions every day", icon: "calendar", questionCount: 1000 },
  { id: "weekly", title: "Weekly Quiz", subtitle: "Test your weekly knowledge", icon: "trophy", questionCount: 500 },
  { id: "department", title: "Department", subtitle: "Your course materials", icon: "library", questionCount: 1500 },
  { id: "level", title: "Level", subtitle: "Your academic level", icon: "layers", questionCount: 1200 },
  { id: "faculty", title: "Faculty", subtitle: "Cross-department knowledge", icon: "users", questionCount: 800 },
  { id: "speed-quiz", title: "Speed Quiz", subtitle: "12s a question. No mercy.", icon: "timer", questionCount: 600 },
  { id: "aptitude", title: "Aptitude", subtitle: "Logic & reasoning", icon: "lightbulb", questionCount: 700 },
  { id: "general-knowledge", title: "General Knowledge", subtitle: "Current affairs & GK", icon: "globe", questionCount: 900 },
];

const ACHIEVEMENTS_LIST = [
  { id: "first-challenge", title: "First Challenge", icon: "flag", target: 1, metric: "attempts" },
  { id: "seven-day-streak", title: "7 Day Streak", icon: "flame", target: 7, metric: "currentStreak" },
  { id: "thirty-day-streak", title: "30 Day Streak", icon: "flame", target: 30, metric: "currentStreak" },
  { id: "hundred-questions", title: "100 Questions", icon: "check", target: 100, metric: "questionsAnswered" },
  { id: "five-hundred-questions", title: "500 Questions", icon: "layers", target: 500, metric: "questionsAnswered" },
  { id: "thousand-questions", title: "1,000 Questions", icon: "trophy", target: 1000, metric: "questionsAnswered" },
  { id: "daily-dedicated", title: "Daily Dedicated", icon: "flame", target: 30, metric: "dailyCorrect" },
  { id: "department-expert", title: "Department Expert", icon: "library", target: 50, metric: "departmentCorrect" },
  { id: "aptitude-ace", title: "Aptitude Ace", icon: "lightbulb", target: 30, metric: "aptitudeCorrect" },
  { id: "speed-demon", title: "Speed Demon", icon: "timer", target: 20, metric: "speed-quizCorrect" },
  { id: "weekly-warrior", title: "Weekly Warrior", icon: "trophy", target: 10, metric: "weeklyCorrect" },
  { id: "top-performer", title: "Top Performer", icon: "crown", target: 5000, metric: "xp" },
  { id: "early-bird", title: "Early Bird", icon: "sun", target: 3, metric: "earlySessions" },
  { id: "night-owl", title: "Night Owl", icon: "moon", target: 3, metric: "nightSessions" },
  { id: "perfect-score", title: "Perfect Score", icon: "star", target: 1, metric: "perfectScores" },
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const getTodayKey = (date = new Date()) => date.toISOString().slice(0, 10);

const RANK_STEPS = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 1200 },
  { name: "Gold", min: 3500 },
  { name: "Platinum", min: 7000 },
  { name: "Diamond", min: 12000 },
  { name: "Legend", min: 20000 },
];

const getRankForXp = (xp = 0) => {
  let rank = RANK_STEPS[0].name;
  for (const step of RANK_STEPS) if (xp >= step.min) rank = step.name;
  return rank;
};

// How far through the current tier the player is, and what's next
const getRankProgress = (xp = 0) => {
  let idx = 0;
  RANK_STEPS.forEach((s, i) => {
    if (xp >= s.min) idx = i;
  });
  const next = RANK_STEPS[idx + 1];
  if (!next) return { next: null, pct: 100, needed: 0 };
  const span = next.min - RANK_STEPS[idx].min;
  return {
    next: next.name,
    pct: Math.min(100, Math.round(((xp - RANK_STEPS[idx].min) / span) * 100)),
    needed: next.min - xp,
  };
};

// Scoring also rewards questions answered well inside the time budget,
// not just quickly overall: a fast wrong guess earns nothing extra.
const calculateScore = ({ answers = [], durationSeconds = 0, totalQuestions = 1 }) => {
  const correct = answers.filter((a) => a.isCorrect).length;
  const wrong = answers.filter((a) => a.selectedIndex !== null && !a.isCorrect).length;
  const skipped = answers.filter((a) => a.selectedIndex === null).length;
  const timedOut = answers.filter((a) => a.timedOut).length;
  const accuracy = totalQuestions ? Math.round((correct / totalQuestions) * 100) : 0;
  const difficultyBonus = answers.reduce((sum, item) => {
    if (!item.isCorrect) return sum;
    if (item.difficulty === "Hard") return sum + 8;
    if (item.difficulty === "Medium") return sum + 5;
    return sum + 3;
  }, 0);
  const timeBonus = answers.reduce((sum, item) => {
    if (!item.isCorrect || item.timeLimit == null) return sum;
    const leftoverFrac = Math.max(0, item.secondsLeft ?? 0) / item.timeLimit;
    return sum + Math.round(leftoverFrac * 4);
  }, 0);
  const xpEarned = correct * 12 + difficultyBonus + timeBonus;
  const pointsEarned = correct * 100 + difficultyBonus * 5 + timeBonus * 10;
  const isPerfect = correct === totalQuestions;
  return { correct, wrong, skipped, timedOut, accuracy, xpEarned, pointsEarned, isPerfect, durationSeconds };
};

const USERS_COLLECTION = "challengeUsers";
const ATTEMPTS_COLLECTION = "attempts";
const COLLECTION = "challenges";

const defaultStats = (profile = {}) => ({
  uid: auth.currentUser?.uid || profile.uid || "",
  name: profile.username || auth.currentUser?.displayName || "Student",
  university: profile.school || "",
  department: profile.department || "",
  avatar: profile.photo || auth.currentUser?.photoURL || "",
  xp: 0,
  totalPoints: 0,
  rank: "Bronze",
  currentStreak: 0,
  longestStreak: 0,
  weeklyStreak: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  attempts: 0,
  averageScore: 0,
  accuracy: 0,
  completionRate: 0,
  streakDates: [],
  activity: [],
  categoryStats: {},
  earlySessions: 0,
  nightSessions: 0,
  updatedAt: null,
});

export default function ChallengeDashboard({ dark = false, initialTab = "dashboard" }) {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [challengeQuestions, setChallengeQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [history, setHistory] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [savingResult, setSavingResult] = useState(false);
  const [leaderboardScope, setLeaderboardScope] = useState("global");
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timeLimit, setTimeLimit] = useState(25);
  const [rankBefore, setRankBefore] = useState(null);

  const tickRef = useRef(null);
  const advanceRef = useRef(null);
  const pendingAnswersRef = useRef([]);
  const statsRef = useRef(stats);

  const theme = getTheme(dark);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // Clear any timers if the page unmounts mid-quiz
  useEffect(
    () => () => {
      clearTimeout(tickRef.current);
      clearTimeout(advanceRef.current);
    },
    []
  );

  /* ---------------- data loading ---------------- */

  const fetchStats = useCallback(async () => {
    if (!auth.currentUser?.uid) return;
    try {
      const snap = await getDoc(doc(db, USERS_COLLECTION, auth.currentUser.uid));
      const data = snap.exists() ? { ...defaultStats(), ...snap.data(), uid: auth.currentUser.uid } : defaultStats();
      setStats(data);
      return data;
    } catch {
      return defaultStats();
    }
  }, []);

  const fetchLeaderboard = useCallback(async (scope = "global", currentStats = statsRef.current) => {
    try {
      const snap = await getDocs(query(collection(db, USERS_COLLECTION), orderBy("xp", "desc"), limit(50)));
      const rows = snap.docs
        .map((item, index) => ({ id: item.id, ...item.data(), position: index + 1 }))
        .filter((item) => {
          if (scope === "university") return item.university && item.university === currentStats?.university;
          if (scope === "department") return item.department && item.department === currentStats?.department;
          return true;
        });
      setLeaderboard(rows);
      return rows;
    } catch {
      setLeaderboard([]);
      throw new Error("Leaderboard fetch failed");
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!auth.currentUser?.uid) return;
    try {
      const snap = await getDocs(
        query(collection(db, USERS_COLLECTION, auth.currentUser.uid, ATTEMPTS_COLLECTION), orderBy("createdAt", "desc"), limit(20))
      );
      setHistory(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => setActiveTab(initialTab), [initialTab]);

  useEffect(() => {
    // Signed-out visitors used to sit on the loading screen forever
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([fetchStats(), fetchHistory()])
      .then(([s]) => {
        if (s) fetchLeaderboard("global", s).catch(() => {});
      })
      .finally(() => setLoading(false));
  }, [user, fetchStats, fetchHistory, fetchLeaderboard]);

  useEffect(() => {
    if (!stats) return;
    const computed = ACHIEVEMENTS_LIST.map((item) => {
      let value = 0;
      const catMatch = item.metric?.match(/^(.+?)Correct$/);
      if (catMatch) {
        value = stats.categoryStats?.[catMatch[1]]?.correct || 0;
      } else if (item.metric === "perfectScores") {
        value = stats.perfectScores || 0;
      } else {
        value = stats[item.metric] || 0;
      }
      const progress = Math.min(1, value / item.target);
      return { ...item, value, progress, unlocked: progress >= 1 };
    });
    setAchievements(computed);
  }, [stats]);

  const fetchUserProfile = async () => {
    if (!auth.currentUser?.uid) return {};
    try {
      const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
      return snap.exists() ? snap.data() : {};
    } catch {
      return {};
    }
  };

  const loadQuestionBank = useCallback(async () => {
    const res = await fetch(QUESTIONS_URL);
    if (!res.ok) throw new Error("Question bank request failed");
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    setChallengeQuestions(list);
    return list;
  }, []);

  useEffect(() => {
    loadQuestionBank().catch((err) => console.log(err));
  }, [loadQuestionBank]);

  const filterFallbackByProfile = (bank, category, profile = {}) => {
    const userLevel = profile?.level?.toLowerCase().replace("l", "") || "";
    const userDept = (profile?.department || profile?.departmentName || "").trim().toLowerCase();
    const userFaculty = (profile?.faculty || "").trim().toLowerCase();

    let pool = category && !["daily", "random"].includes(category) ? bank.filter((q) => q.category === category) : [...bank];
    if (!pool.length) pool = [...bank];

    if (category === "department" && userDept) {
      const narrowed = pool.filter((q) => {
        const qDept = (q.department || q.subject || "").toLowerCase();
        return !qDept || qDept.includes(userDept) || userDept.includes(qDept);
      });
      if (narrowed.length) pool = narrowed;
    }
    if (category === "level" && userLevel) {
      const narrowed = pool.filter((q) => {
        const qLevel = (q.level || "").toLowerCase().replace("l", "");
        return !qLevel || qLevel === userLevel;
      });
      if (narrowed.length) pool = narrowed;
    }
    if (category === "faculty" && userFaculty) {
      const narrowed = pool.filter((q) => {
        const qFac = (q.faculty || "").toLowerCase();
        return !qFac || qFac.includes(userFaculty) || userFaculty.includes(qFac);
      });
      if (narrowed.length) pool = narrowed;
    }
    if (category === "speed-quiz") {
      const narrowed = pool.filter((q) => q.difficulty !== "Hard");
      if (narrowed.length) pool = narrowed;
    }
    return pool.filter((q) => Array.isArray(q.answers) && q.answers.length >= 2);
  };

  const fetchQuestions = async (categoryId) => {
    const profile = await fetchUserProfile();
    // If the first load failed or is still pending, try again now
    const bank = challengeQuestions.length ? challengeQuestions : await loadQuestionBank();
    const pool = filterFallbackByProfile(bank, categoryId, profile);
    return [...pool].sort(() => Math.random() - 0.5).slice(0, QUESTIONS_PER_QUIZ);
  };

  /* ---------------- quiz flow ---------------- */

  const handleStartQuiz = async (category) => {
    setNotice(null);
    setStarting(true);
    try {
      const qs = await fetchQuestions(category.id);
      if (!qs.length) {
        setNotice("No questions are available for this challenge right now. Check your connection and try again.");
        return;
      }
      clearTimeout(advanceRef.current);
      const limitSecs = getTimeLimit(category.id);
      setRankBefore(statsRef.current?.rank || "Bronze");
      setSelectedCategory(category);
      setQuestions(qs);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setSelectedIndex(null);
      setRevealAnswer(false);
      setAwaitingNext(false);
      setConfirmQuit(false);
      setTimeLimit(limitSecs);
      setSecondsLeft(limitSecs);
      setQuizStarted(true);
      setQuizFinished(false);
      setQuizResult(null);
      setStartTime(Date.now());
    } catch (err) {
      console.log(err);
      setNotice("We couldn't load the questions. The server may be waking up, so please try again in a few seconds.");
    } finally {
      setStarting(false);
    }
  };

  // Per-question countdown. Ticks every second while a question is live and
  // no answer has been revealed yet; auto-registers a timeout once it hits 0.
  useEffect(() => {
    if (!quizStarted || quizFinished || revealAnswer) return;
    if (secondsLeft <= 0) {
      commitAnswer(null, true);
      return;
    }
    tickRef.current = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, quizStarted, quizFinished, revealAnswer]);

  const advance = (newAnswers) => {
    setAwaitingNext(false);
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedIndex(null);
      setRevealAnswer(false);
      setSecondsLeft(timeLimit);
    } else {
      finishQuiz(newAnswers);
    }
  };

  const commitAnswer = (index, timedOut = false) => {
    const current = questions[currentQuestionIndex];
    if (!current) return;
    const isCorrect = index !== null && index === current.correctIndex;
    setSelectedIndex(index);
    setRevealAnswer(true);
    const newAnswers = [
      ...answers,
      {
        questionId: current.id,
        selectedIndex: index,
        isCorrect,
        difficulty: current.difficulty,
        timeLimit,
        secondsLeft: timedOut ? 0 : secondsLeft,
        timedOut,
      },
    ];
    setAnswers(newAnswers);
    pendingAnswersRef.current = newAnswers;

    // Untimed categories with an explanation wait for the student to read it.
    // Speed Quiz and timeouts keep the quick auto-advance.
    const waitForUser = !!current.explanation && selectedCategory?.id !== "speed-quiz" && !timedOut;
    if (waitForUser) {
      setAwaitingNext(true);
    } else {
      advanceRef.current = setTimeout(() => advance(newAnswers), timedOut ? 700 : 900);
    }
  };

  const handleAnswer = (index) => {
    if (revealAnswer) return;
    commitAnswer(index, false);
  };

  const handleSkip = () => {
    if (revealAnswer) return;
    commitAnswer(null, false);
  };

  const goNext = () => {
    if (!awaitingNext) return;
    advance(pendingAnswersRef.current);
  };

  // Keyboard: 1-4 or A-D to answer, S to skip, Enter to continue
  useEffect(() => {
    if (!quizStarted) return;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const current = questions[currentQuestionIndex];
      if (!current) return;
      if (revealAnswer) {
        if (awaitingNext && (e.key === "Enter" || e.key === "ArrowRight")) {
          e.preventDefault();
          goNext();
        }
        return;
      }
      const key = e.key.toLowerCase();
      let idx = -1;
      if (/^[1-9]$/.test(key)) idx = Number(key) - 1;
      else if (/^[a-z]$/.test(key) && key !== "s") idx = key.charCodeAt(0) - 97;
      if (idx >= 0 && idx < current.answers.length) {
        e.preventDefault();
        handleAnswer(idx);
      } else if (key === "s") {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizStarted, revealAnswer, awaitingNext, currentQuestionIndex, questions, answers, secondsLeft]);

  const finishQuiz = async (finalAnswers) => {
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    const score = calculateScore({ answers: finalAnswers, durationSeconds, totalQuestions: questions.length });
    setQuizResult(score);
    setQuizFinished(true);
    setQuizStarted(false);

    if (!auth.currentUser?.uid) return;
    setSavingResult(true);
    try {
      const previous = await fetchStats();
      const nextXp = (previous?.xp || 0) + score.xpEarned;
      const nextRank = getRankForXp(nextXp);
      const todayKey = getTodayKey();
      const yesterdayKey = getTodayKey(new Date(Date.now() - 86400000));
      const uniqueDates = [...new Set(previous?.streakDates || [])];
      let nextCurrent = uniqueDates.includes(yesterdayKey) ? (previous?.currentStreak || 0) + 1 : 1;
      if (uniqueDates.includes(todayKey)) nextCurrent = previous?.currentStreak || 0;
      const nextDates = uniqueDates.includes(todayKey) ? uniqueDates : [...uniqueDates, todayKey].slice(-180);
      const categoryKey = selectedCategory?.id || "daily";
      const existingCat = previous?.categoryStats?.[categoryKey] || {};
      const totalAttempts = (previous?.attempts || 0) + 1;
      const totalQuestionsAnswered = (previous?.questionsAnswered || 0) + questions.length;
      const totalCorrect = (previous?.correctAnswers || 0) + score.correct;

      const statsUpdate = {
        uid: auth.currentUser.uid,
        name: user?.displayName || previous?.name || "Student",
        university: previous?.university || "",
        department: previous?.department || "",
        avatar: user?.photoURL || previous?.avatar || "",
        xp: nextXp,
        totalPoints: (previous?.totalPoints || 0) + score.pointsEarned,
        rank: nextRank,
        currentStreak: nextCurrent,
        longestStreak: Math.max(previous?.longestStreak || 0, nextCurrent),
        streakDates: nextDates,
        questionsAnswered: totalQuestionsAnswered,
        correctAnswers: totalCorrect,
        wrongAnswers: (previous?.wrongAnswers || 0) + score.wrong,
        attempts: totalAttempts,
        averageScore: Math.round((((previous?.averageScore || 0) * (previous?.attempts || 0)) + score.accuracy) / totalAttempts),
        accuracy: totalQuestionsAnswered ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0,
        categoryStats: {
          ...(previous?.categoryStats || {}),
          [categoryKey]: {
            attempted: (existingCat.attempted || 0) + questions.length,
            correct: (existingCat.correct || 0) + score.correct,
          },
        },
        activity: [
          { type: "challenge_completed", category: categoryKey, accuracy: score.accuracy, dateKey: todayKey },
          ...(previous?.activity || []),
        ].slice(0, 12),
        ...(score.isPerfect ? { perfectScores: (previous?.perfectScores || 0) + 1 } : {}),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, USERS_COLLECTION, auth.currentUser.uid), statsUpdate, { merge: true });
      const attemptRef = await addDoc(collection(db, USERS_COLLECTION, auth.currentUser.uid, ATTEMPTS_COLLECTION), {
        category: categoryKey,
        score: score.correct,
        totalQuestions: questions.length,
        accuracy: score.accuracy,
        durationSeconds,
        xpEarned: score.xpEarned,
        pointsEarned: score.pointsEarned,
        status: score.accuracy >= 70 ? "Passed" : score.accuracy >= 40 ? "Completed" : "Practice",
        answers: finalAnswers,
        createdAt: serverTimestamp(),
        dateKey: todayKey,
      });
      await setDoc(doc(db, COLLECTION, "latestAttempts", "items", attemptRef.id), {
        category: categoryKey,
        score: score.correct,
        totalQuestions: questions.length,
        accuracy: score.accuracy,
        uid: auth.currentUser.uid,
        name: statsUpdate.name,
        university: statsUpdate.university,
        department: statsUpdate.department,
      });
      await fetchStats();
      await fetchLeaderboard(leaderboardScope, statsRef.current);
      await fetchHistory();
    } catch (err) {
      console.error("Failed to save result:", err);
      setNotice("Your result couldn't be saved. Check your connection; this attempt may not count towards your XP.");
    }
    setSavingResult(false);
  };

  const handleBackToDashboard = () => {
    clearTimeout(tickRef.current);
    clearTimeout(advanceRef.current);
    setQuizStarted(false);
    setQuizFinished(false);
    setSelectedCategory(null);
    setQuestions([]);
    setAnswers([]);
    setQuizResult(null);
    setAwaitingNext(false);
    setConfirmQuit(false);
    setActiveTab("dashboard");
  };

  const getRankColor = (rank) => RANK_COLORS[rank] || colors.violet;

  const getStatusColor = (accuracy) => {
    if (accuracy >= 70) return "text-emerald-500";
    if (accuracy >= 40) return "text-amber-500";
    return "text-rose-500";
  };

  const tabItems = [
    { id: "dashboard", label: "Overview", icon: BarChart3 },
    { id: "categories", label: "Challenges", icon: Target },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "achievements", label: "Achievements", icon: Medal },
    { id: "history", label: "History", icon: Clock },
  ];

  /* ---------------- shared bits ---------------- */

  const noticeBar = notice ? (
    <div
      role="alert"
      className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm"
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
      <p className="flex-1">{notice}</p>
      <button
        type="button"
        onClick={() => setNotice(null)}
        aria-label="Dismiss message"
        className={`shrink-0 rounded-md p-1 opacity-60 hover:opacity-100 ${FOCUS_RING}`}
      >
        <X size={15} />
      </button>
    </div>
  ) : null;

  const startingOverlay = starting ? (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
    >
      <div className={`${theme.card} rounded-3xl px-7 py-6 text-center max-w-xs`}>
        <Loader2 size={26} className="mx-auto mb-3 animate-spin text-[#6C5CE7]" />
        <p className="font-bold text-sm">Preparing your questions…</p>
        <p className={`mt-1 text-xs ${theme.textSoft}`}>The first load can take a few seconds.</p>
      </div>
    </div>
  ) : null;

  /* ---------------- initial loading ---------------- */

  if (loading && !stats) {
    return (
      <div className={`min-h-screen md:pt-20 ${theme.page} flex items-center justify-center`}>
        <div className="text-center" role="status" aria-live="polite">
          <div className="relative w-14 h-14 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-[#6C5CE7]/20" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[#6C5CE7] border-r-transparent border-b-transparent border-l-transparent motion-safe:animate-spin" />
          </div>
          <h2 className="text-sm font-semibold">Loading your challenges…</h2>
        </div>
      </div>
    );
  }

  /* ---------------- QUIZ SCREEN ---------------- */

  if (quizStarted) {
    const current = questions[currentQuestionIndex];
    if (!current) return null;
    const tone = CATEGORY_TONES[selectedCategory?.id]?.accent || "#6C5CE7";
    const isLast = currentQuestionIndex + 1 === questions.length;
    const answeredCorrect = revealAnswer && selectedIndex === current.correctIndex;

    return (
      <div className={`min-h-screen md:pt-20 ${theme.page}`}>
        <div className="px-4 md:px-6 lg:px-8 py-5 md:py-8 max-w-3xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6 gap-3 sm:gap-4">
            {confirmQuit ? (
              <div className={`flex items-center gap-1.5 rounded-full p-1 ${theme.card}`}>
                <button
                  type="button"
                  onClick={handleBackToDashboard}
                  className={`rounded-full bg-rose-500 px-3 py-2 text-xs font-bold text-white hover:bg-rose-600 transition ${FOCUS_RING}`}
                >
                  Quit quiz
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmQuit(false)}
                  className={`rounded-full px-3 py-2 text-xs font-bold hover:opacity-70 transition ${FOCUS_RING}`}
                >
                  Keep playing
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmQuit(true)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full ${theme.card} text-xs font-bold hover:opacity-80 transition ${FOCUS_RING}`}
              >
                <X size={14} /> Quit
              </button>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold" style={{ color: tone }}>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className={`hidden sm:inline text-xs truncate ${theme.textSoft}`}>
                  {selectedCategory?.title}
                </span>
              </div>
              <div
                className={`h-1.5 rounded-full overflow-hidden ${dark ? "bg-white/10" : "bg-black/10"}`}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={questions.length}
                aria-valuenow={currentQuestionIndex + (revealAnswer ? 1 : 0)}
                aria-label="Quiz progress"
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${((currentQuestionIndex + (revealAnswer ? 1 : 0)) / questions.length) * 100}%`,
                    background: tone,
                  }}
                />
              </div>
            </div>

            <CountdownRing secondsLeft={secondsLeft} totalSeconds={timeLimit} size={52} />
          </div>

          {/* Question card */}
          <div className={`${theme.card} rounded-[28px] p-5 sm:p-6 md:p-8 mb-6 relative overflow-hidden`}>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-[0.10] blur-2xl"
              style={{ background: tone }}
            />
            <div className="flex items-center gap-2 mb-5 relative">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  background:
                    current.difficulty === "Hard"
                      ? "rgba(226,87,76,0.12)"
                      : current.difficulty === "Medium"
                      ? "rgba(212,167,44,0.14)"
                      : "rgba(33,158,139,0.12)",
                  color:
                    current.difficulty === "Hard"
                      ? "#E2574C"
                      : current.difficulty === "Medium"
                      ? "#B8860B"
                      : "#219E8B",
                }}
              >
                {current.difficulty || "Standard"}
              </span>
              {current.subject && <span className={`text-xs ${theme.textSoft}`}>{current.subject}</span>}
            </div>

            <h3 className="text-xl md:text-[26px] leading-snug font-semibold mb-7 relative">{current.prompt}</h3>

            <div className="space-y-3 relative" role="group" aria-label="Answer options">
              {current.answers.map((answer, index) => {
                const isChosen = selectedIndex === index;
                const isRight = index === current.correctIndex;
                let stateClasses = `${theme.ledgerLine} ${dark ? "bg-white/[0.02]" : "bg-white"} hover:border-[#6C5CE7]`;
                if (revealAnswer) {
                  if (isRight) stateClasses = "border-[#219E8B] bg-[#219E8B]/10";
                  else if (isChosen) stateClasses = "border-[#E2574C] bg-[#E2574C]/10";
                  else stateClasses = `${theme.ledgerLine} opacity-50`;
                }
                return (
                  <button
                    key={index}
                    type="button"
                    disabled={revealAnswer}
                    onClick={() => handleAnswer(index)}
                    className={`w-full text-left p-4 min-h-[56px] rounded-2xl border transition-all duration-200 ${stateClasses} ${
                      !revealAnswer ? "motion-safe:active:scale-[0.99]" : ""
                    } ${FOCUS_RING}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
                      >
                        {revealAnswer && isRight ? (
                          <Check size={15} className="text-[#219E8B]" />
                        ) : revealAnswer && isChosen ? (
                          <X size={15} className="text-[#E2574C]" />
                        ) : (
                          String.fromCharCode(65 + index)
                        )}
                      </span>
                      <span className="font-medium text-[15px]">{answer}</span>
                      {revealAnswer && isRight && <span className="sr-only">Correct answer</span>}
                      {revealAnswer && isChosen && !isRight && <span className="sr-only">Your answer, incorrect</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            <div aria-live="polite" className="relative">
              {revealAnswer && (
                <div className={`mt-5 rounded-2xl p-4 ${theme.soft}`}>
                  <p
                    className={`text-sm font-bold ${
                      answeredCorrect ? "text-emerald-500" : selectedIndex === null ? "text-amber-500" : "text-rose-500"
                    }`}
                  >
                    {answeredCorrect
                      ? "Correct"
                      : selectedIndex === null
                      ? answers[answers.length - 1]?.timedOut
                        ? "Time's up"
                        : "Skipped"
                      : "Not quite"}
                  </p>
                  {current.explanation && <p className={`mt-1 text-sm leading-6 ${theme.textSoft}`}>{current.explanation}</p>}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-between gap-3 relative">
              {!revealAnswer ? (
                <>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full ${theme.soft} text-xs font-bold ${theme.textSoft} hover:opacity-70 transition ${FOCUS_RING}`}
                  >
                    <SkipForward size={13} /> Skip
                  </button>
                  <span className={`hidden md:inline text-xs ${theme.textFaint}`}>Tip: press A–D to answer, S to skip</span>
                </>
              ) : awaitingNext ? (
                <>
                  <span className={`hidden md:inline text-xs ${theme.textFaint}`}>Press Enter to continue</span>
                  <button
                    type="button"
                    onClick={goNext}
                    autoFocus
                    className={`ml-auto inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 ${FOCUS_RING}`}
                    style={{ background: tone }}
                  >
                    {isLast ? "See results" : "Next question"}
                    <ArrowRight size={15} />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- RESULTS SCREEN ---------------- */

  if (quizFinished && quizResult) {
    const rankedUp = !savingResult && stats?.rank && rankBefore && stats.rank !== rankBefore;
    return (
      <div className={`min-h-screen md:pt-20 ${theme.page}`}>
        {startingOverlay}
        <div className="px-4 md:px-6 lg:px-8 py-5 md:py-8 max-w-3xl mx-auto">
          {noticeBar}

          <div className={`${theme.banner} rounded-[28px] p-6 sm:p-8 md:p-10 text-center mb-6 relative overflow-hidden`}>
            <div aria-hidden="true" className="absolute -top-20 -left-10 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: "#6C5CE7" }} />
            <div aria-hidden="true" className="absolute -bottom-20 -right-10 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: "#D4A72C" }} />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-5">
                {quizResult.isPerfect ? <Crown size={30} className="text-[#D4A72C]" /> : <Trophy size={30} className="text-[#8B7FEF]" />}
              </div>
              <p className="text-sm text-white/60 mb-2">{selectedCategory?.title} results</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-2">
                {quizResult.isPerfect
                  ? "Perfect run."
                  : quizResult.accuracy >= 70
                  ? "Well earned."
                  : quizResult.accuracy >= 40
                  ? "Solid effort."
                  : "Back to the books."}
              </h2>
              {rankedUp && (
                <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-amber-300">
                  <Medal size={13} /> You reached {stats.rank}
                </p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                {[
                  { label: "Accuracy", value: `${quizResult.accuracy}%`, tone: "#8B7FEF" },
                  { label: "Correct", value: `${quizResult.correct}/${questions.length}`, tone: "#3FC1A8" },
                  { label: "XP earned", value: `+${quizResult.xpEarned}`, tone: "#D4A72C" },
                  { label: "Time", value: `${quizResult.durationSeconds}s`, tone: "#F08A80" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/[0.06] border border-white/10 rounded-2xl p-4">
                    <p className="text-xs text-white/50 mb-1">{s.label}</p>
                    <p className="text-2xl font-bold tabular-nums" style={{ color: s.tone }}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {savingResult ? (
                <div role="status" className="flex items-center justify-center gap-2 mt-7 text-white/70 text-sm">
                  <Loader2 size={16} className="animate-spin" /> Saving your result…
                </div>
              ) : (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => selectedCategory && handleStartQuiz(selectedCategory)}
                    className={`inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white text-[#12182B] font-bold text-sm hover:bg-white/90 transition ${FOCUS_RING}`}
                  >
                    <RotateCcw size={15} /> Play again
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToDashboard}
                    className={`px-7 py-3 rounded-full border border-white/25 text-white font-bold text-sm hover:bg-white/10 transition ${FOCUS_RING}`}
                  >
                    Back to dashboard
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Review */}
          <div className={`${theme.card} rounded-[28px] p-5 sm:p-6`}>
            <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-[#6C5CE7]" /> Review your answers
            </h3>
            <ul className="space-y-2.5">
              {questions.map((q, i) => {
                const ans = answers[i];
                const status = ans?.isCorrect
                  ? { text: "Correct", cls: "text-emerald-500" }
                  : ans?.timedOut
                  ? { text: "Timed out", cls: "text-amber-500" }
                  : ans?.selectedIndex === null
                  ? { text: "Skipped", cls: "text-amber-500" }
                  : { text: "Incorrect", cls: "text-rose-500" };
                return (
                  <li key={q.id || i} className={`${theme.soft} rounded-2xl p-4`}>
                    <p className="font-medium text-sm mb-1.5">
                      <span className={theme.textFaint}>{i + 1}.</span> {q.prompt}
                    </p>
                    <p className={`text-xs font-bold ${status.cls}`}>{status.text}</p>
                    {!ans?.isCorrect && q.answers?.[q.correctIndex] && (
                      <p className={`mt-1 text-xs ${theme.textSoft}`}>
                        Correct answer: <span className="font-semibold">{q.answers[q.correctIndex]}</span>
                      </p>
                    )}
                    {!ans?.isCorrect && q.explanation && (
                      <p className={`mt-1 text-xs leading-5 ${theme.textSoft}`}>{q.explanation}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- DASHBOARD SHELL ---------------- */

  const rankProgress = getRankProgress(stats?.xp || 0);

  return (
    <div className={`min-h-screen md:pt-20 ${theme.page}`}>
      {startingOverlay}
      <div className="px-4 md:px-6 lg:px-8 py-5 md:py-8">
        {noticeBar}

        {/* Profile banner */}
        <div className={`${theme.banner} rounded-[28px] p-6 md:p-8 mb-6 relative overflow-hidden`}>
          <div aria-hidden="true" className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-[0.18] blur-3xl" style={{ background: "#6C5CE7" }} />
          <div aria-hidden="true" className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full opacity-[0.14] blur-3xl" style={{ background: "#D4A72C" }} />
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="min-w-0 md:max-w-md w-full">
              <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2 truncate">{stats?.name || "Student"}</h1>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#12182B]"
                  style={{ background: getRankColor(stats?.rank) }}
                >
                  <Medal size={12} /> {stats?.rank || "Bronze"}
                </span>
                {stats?.currentStreak > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
                    <Flame size={13} /> {stats.currentStreak} day streak
                  </span>
                )}
              </div>

              {/* Progress to next tier */}
              <div>
                <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={rankProgress.pct} aria-label="Progress to next rank">
                  <div className="h-full rounded-full bg-[#8B7FEF] transition-all duration-700" style={{ width: `${rankProgress.pct}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-white/60">
                  {rankProgress.next
                    ? `${rankProgress.needed.toLocaleString()} XP to ${rankProgress.next}`
                    : "You've reached the top tier"}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-3 md:gap-6">
              {[
                { label: "XP", value: (stats?.xp || 0).toLocaleString(), tone: "#A89CFF" },
                { label: "Accuracy", value: `${stats?.accuracy || 0}%`, tone: "#3FC1A8" },
                { label: "Attempts", value: stats?.attempts || 0, tone: "#E8BC47" },
              ].map((s) => (
                <div key={s.label} className="md:text-right">
                  <dt className="text-xs text-white/50 mb-0.5">{s.label}</dt>
                  <dd className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color: s.tone }}>
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Challenge sections"
          className={`flex gap-1 mb-6 overflow-x-auto no-scrollbar border-b ${theme.ledgerLine}`}
        >
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${FOCUS_RING} ${
                  isActive ? "" : `${theme.textSoft} hover:opacity-80`
                }`}
                style={isActive ? { color: "#6C5CE7" } : undefined}
              >
                <Icon size={15} />
                {tab.label}
                {isActive && <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-[#6C5CE7]" />}
              </button>
            );
          })}
        </div>

        {activeTab === "dashboard" && (
          <ChallengeOverviewPage
            theme={theme}
            stats={stats}
            history={history}
            handleStartQuiz={handleStartQuiz}
            getRankColor={getRankColor}
            getStatusColor={getStatusColor}
            dark={dark}
            challengeCategories={CHALLENGE_CATEGORIES}
          />
        )}

        {activeTab === "categories" && (
          <ChallengeCategoriesPage theme={theme} stats={stats} handleStartQuiz={handleStartQuiz} challengeCategories={CHALLENGE_CATEGORIES} />
        )}

        {activeTab === "leaderboard" && (
          <ChallengeLeaderboardPage
            theme={theme}
            leaderboard={leaderboard}
            leaderboardScope={leaderboardScope}
            setLeaderboardScope={setLeaderboardScope}
            fetchLeaderboard={fetchLeaderboard}
            getRankColor={getRankColor}
            currentUserId={auth.currentUser?.uid}
          />
        )}

        {activeTab === "achievements" && <ChallengeAchievementsPage theme={theme} achievements={achievements} />}

        {activeTab === "history" && <ChallengeHistoryPage theme={theme} history={history} getStatusColor={getStatusColor} />}
      </div>
    </div>
  );
}