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
  BarChart3,
  Clock,
  Crown,
  Flame,
  Loader2,
  Medal,
  Sparkles,
  Target,
  Trophy,
  X,
  Check,
  SkipForward,
} from "lucide-react";
import ChallengeOverviewPage from "./challenges/ChallengeOverviewPage";
import ChallengeCategoriesPage from "./challenges/ChallengeCategoriesPage";
import ChallengeLeaderboardPage from "./challenges/ChallengeLeaderboardPage";
import ChallengeAchievementsPage from "./challenges/ChallengeAchievementsPage";
import ChallengeHistoryPage from "./challenges/ChallengeHistoryPage";
import { CHALLENGE_QUESTIONS } from "../data/challengeQuestions";
import { getTheme, RANK_COLORS, CATEGORY_TONES, getTimeLimit, colors } from "../data/theme";
import CountdownRing from "../components/CountdownRing";

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

const getTodayKey = (date = new Date()) => date.toISOString().slice(0, 10);

const getRankForXp = (xp = 0) => {
  if (xp >= 20000) return "Legend";
  if (xp >= 12000) return "Diamond";
  if (xp >= 7000) return "Platinum";
  if (xp >= 3500) return "Gold";
  if (xp >= 1200) return "Silver";
  return "Bronze";
};

// Scoring now also rewards questions answered well inside the time budget,
// not just quickly overall — a fast wrong guess earns nothing extra.
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
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
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timeLimit, setTimeLimit] = useState(25);
  const tickRef = useRef(null);
  const statsRef = useRef(stats);

  const theme = getTheme(dark);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

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
    if (!user) return;
    Promise.all([fetchStats(), fetchHistory()])
      .then(([s]) => {
        if (s) fetchLeaderboard("global", s);
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

  // Local-only question pool. Firestore is never consulted for questions —
  // CHALLENGE_QUESTIONS is the single source of truth so quizzes work offline
  // and load instantly.
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
    const pool = filterFallbackByProfile(CHALLENGE_QUESTIONS, categoryId, profile);
    return [...pool].sort(() => Math.random() - 0.5).slice(0, 8);
  };

  const handleStartQuiz = async (category) => {
    setSelectedCategory(category);
    setLoading(true);
    const qs = await fetchQuestions(category.id);
    setQuestions(qs);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSelectedIndex(null);
    setRevealAnswer(false);
    const limitSecs = getTimeLimit(category.id);
    setTimeLimit(limitSecs);
    setSecondsLeft(limitSecs);
    setQuizStarted(true);
    setQuizFinished(false);
    setQuizResult(null);
    setStartTime(Date.now());
    setLoading(false);
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
    if (currentQuestionIndex + 1 < questions.length) {
      const next = currentQuestionIndex + 1;
      setCurrentQuestionIndex(next);
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
    setTimeout(() => advance(newAnswers), timedOut ? 500 : 700);
  };

  const handleAnswer = (index) => {
    if (revealAnswer) return;
    commitAnswer(index, false);
  };

  const handleSkip = () => {
    if (revealAnswer) return;
    commitAnswer(null, false);
  };

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
    }
    setSavingResult(false);
  };

  const handleBackToDashboard = () => {
    clearTimeout(tickRef.current);
    setQuizStarted(false);
    setQuizFinished(false);
    setSelectedCategory(null);
    setQuestions([]);
    setAnswers([]);
    setQuizResult(null);
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
    { id: "achievements", label: "Honors", icon: Medal },
    { id: "history", label: "History", icon: Clock },
  ];

  if (loading && !stats) {
    return (
      <div className={`min-h-screen md:pt-20 ${theme.page} flex items-center justify-center`}>
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-white/10" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[#6C5CE7] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <h2 className="text-sm tracking-[0.2em] uppercase font-semibold">
            Opening the ledger…
          </h2>
        </div>
      </div>
    );
  }

  // ---------- QUIZ SCREEN ----------
  if (quizStarted) {
    const current = questions[currentQuestionIndex];
    if (!current) return null;
    const tone = CATEGORY_TONES[selectedCategory?.id]?.accent || "#6C5CE7";
    return (
      <div className={`min-h-screen md:pt-20 ${theme.page}`}>
        <div className="px-4 md:px-6 lg:px-8 py-5 md:py-8 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6 gap-4">
            <button
              onClick={handleBackToDashboard}
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${theme.card} text-xs font-semibold uppercase tracking-wider hover:opacity-80 transition`}
            >
              <X size={14} /> Quit
            </button>

            <div className="flex-1 flex items-center gap-3">
              <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: tone }}>
                Q{String(currentQuestionIndex + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}
              </span>
              <div className="flex-1 h-[3px] rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${((currentQuestionIndex + (revealAnswer ? 1 : 0)) / questions.length) * 100}%`, background: tone }}
                />
              </div>
            </div>

            <CountdownRing secondsLeft={secondsLeft} totalSeconds={timeLimit} size={52} />
          </div>

          <div className={`${theme.card} rounded-[28px] p-6 md:p-8 mb-6 relative overflow-hidden`}>
            <div
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-[0.10] blur-2xl"
              style={{ background: tone }}
            />
            <div className="flex items-center gap-2 mb-5 relative">
              <span
                className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
                style={{
                  background:
                    current.difficulty === "Hard" ? "rgba(226,87,76,0.12)" : current.difficulty === "Medium" ? "rgba(212,167,44,0.14)" : "rgba(33,158,139,0.12)",
                  color: current.difficulty === "Hard" ? "#E2574C" : current.difficulty === "Medium" ? "#B8860B" : "#219E8B",
                }}
              >
                {current.difficulty || "Standard"}
              </span>
              {current.subject && <span className={`text-xs ${theme.textSoft}`}>{current.subject}</span>}
            </div>

            <h3
              className="text-xl md:text-[26px] leading-snug font-semibold mb-7 relative"
            >
              {current.prompt}
            </h3>

            <div className="space-y-3 relative">
              {current.answers.map((answer, index) => {
                const isChosen = selectedIndex === index;
                const isRight = index === current.correctIndex;
                let stateClasses = `${theme.ledgerLine} ${dark ? "bg-white/[0.02]" : "bg-white"} hover:border-current`;
                if (revealAnswer) {
                  if (isRight) stateClasses = "border-[#219E8B] bg-[#219E8B]/10";
                  else if (isChosen && !isRight) stateClasses = "border-[#E2574C] bg-[#E2574C]/10";
                  else stateClasses = `${theme.ledgerLine} opacity-50`;
                }
                return (
                  <button
                    key={index}
                    disabled={revealAnswer}
                    onClick={() => handleAnswer(index)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${stateClasses} ${
                      !revealAnswer ? "active:scale-[0.99]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
                      >
                        {revealAnswer && isRight ? <Check size={15} className="text-[#219E8B]" /> : revealAnswer && isChosen ? <X size={15} className="text-[#E2574C]" /> : String.fromCharCode(65 + index)}
                      </span>
                      <span className="font-medium text-[15px]">{answer}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {revealAnswer && current.explanation && (
              <p className={`mt-5 text-sm ${theme.textSoft} relative`}>{current.explanation}</p>
            )}

            {!revealAnswer && (
              <button
                onClick={handleSkip}
                className={`mt-5 flex items-center gap-1.5 px-4 py-2 rounded-full ${theme.soft} text-xs font-semibold uppercase tracking-wide ${theme.textSoft} hover:opacity-70 transition relative`}
              >
                <SkipForward size={13} /> Skip
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- RESULTS SCREEN ----------
  if (quizFinished && quizResult) {
    return (
      <div className={`min-h-screen md:pt-20 ${theme.page}`}>
        <div className="px-4 md:px-6 lg:px-8 py-5 md:py-8 max-w-3xl mx-auto">
          <div className={`${theme.banner} rounded-[28px] p-8 md:p-10 text-center mb-6 relative overflow-hidden`}>
            <div className="absolute -top-20 -left-10 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: "#6C5CE7" }} />
            <div className="absolute -bottom-20 -right-10 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: "#D4A72C" }} />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-5">
                {quizResult.isPerfect ? <Crown size={30} className="text-[#D4A72C]" /> : <Trophy size={30} className="text-[#8B7FEF]" />}
              </div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/50 mb-2">
                {selectedCategory?.title} · Results
              </p>
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-8">
                {quizResult.isPerfect ? "Perfect run." : quizResult.accuracy >= 70 ? "Well earned." : quizResult.accuracy >= 40 ? "Solid effort." : "Back to the books."}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Accuracy", value: `${quizResult.accuracy}%`, tone: "#8B7FEF" },
                  { label: "Correct", value: `${quizResult.correct}/${questions.length}`, tone: "#219E8B" },
                  { label: "XP", value: `+${quizResult.xpEarned}`, tone: "#D4A72C" },
                  { label: "Time", value: `${quizResult.durationSeconds}s`, tone: "#E2574C" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/[0.06] border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-white/45 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold tabular-nums" style={{ color: stat.tone }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {savingResult ? (
                <div className="flex items-center justify-center gap-2 mt-7 text-white/60 text-sm">
                  <Loader2 size={16} className="animate-spin" /> Saving to your ledger…
                </div>
              ) : (
                <button
                  onClick={handleBackToDashboard}
                  className="mt-8 px-8 py-3 rounded-full bg-white text-[#12182B] font-bold text-sm hover:bg-white/90 transition"
                >
                  Back to dashboard
                </button>
              )}
            </div>
          </div>

          <div className={`${theme.card} rounded-[28px] p-6`}>
            <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-[#6C5CE7]" /> Question review
            </h3>
            <div className="space-y-2.5">
              {questions.map((q, i) => {
                const ans = answers[i];
                return (
                  <div key={q.id} className={`${theme.soft} rounded-2xl p-4 flex items-start justify-between gap-3`}>
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">
                        <span className={theme.textFaint}>
                          Q{i + 1}
                        </span>{" "}
                        {q.prompt}
                      </p>
                      <p className={`text-xs font-semibold ${ans?.isCorrect ? "text-emerald-500" : ans?.timedOut ? "text-amber-500" : "text-rose-500"}`}>
                        {ans?.isCorrect ? "Correct" : ans?.timedOut ? "Timed out" : ans?.selectedIndex === null ? "Skipped" : "Incorrect"}
                      </p>
                    </div>
                    <span
                      className="text-xs font-bold tabular-nums shrink-0"
                    >
                      {ans?.isCorrect ? "+1" : "+0"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- DASHBOARD SHELL ----------
  return (
    <div className={`min-h-screen md:pt-20 ${theme.page}`}>
      <div className="px-4 md:px-6 lg:px-8 py-5 md:py-8">
        {/* Scoreboard banner */}
        <div className={`${theme.banner} rounded-[28px] p-6 md:p-8 mb-6 relative overflow-hidden`}>
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-[0.18] blur-3xl" style={{ background: "#6C5CE7" }} />
          <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full opacity-[0.14] blur-3xl" style={{ background: "#D4A72C" }} />
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/45 mb-2">
                Challenge Ledger
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold text-white mb-1">
                {stats?.name || "Student"}
              </h1>
              <div className="flex items-center gap-2">
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
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-5">
              {[
                { label: "XP", value: stats?.xp || 0, tone: "#8B7FEF" },
                { label: "Accuracy", value: `${stats?.accuracy || 0}%`, tone: "#3FC1A8" },
                { label: "Attempts", value: stats?.attempts || 0, tone: "#D4A72C" },
              ].map((s) => (
                <div key={s.label} className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">{s.label}</p>
                  <p className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color: s.tone }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger tabs */}
        <div className={`flex gap-1 mb-6 overflow-x-auto border-b ${theme.ledgerLine}`}>
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
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