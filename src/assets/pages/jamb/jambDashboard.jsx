import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  Bell,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Flame,
  PlayCircle,
  Target,
  TrendingUp,
  Trophy,
  User2,
  Activity,
} from "lucide-react";

import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";

import {
  Link,
  useOutletContext,
} from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";

import { db } from "../../../firebase/config";

const getResultPercentage = (exam) => {
  if (Number.isFinite(exam?.percentage)) return exam.percentage;
  if (Number.isFinite(exam?.accuracy)) return exam.accuracy;
  const total = exam?.totalQuestions ?? exam?.total ?? 0;
  if (!total) return 0;
  return Math.round(((exam?.score ?? 0) / total) * 100);
};

const getResultTotal = (exam) => exam?.totalQuestions ?? exam?.total ?? 0;

const getResultTitle = (exam) => {
  if (exam?.subject) return exam.subject;
  if (Array.isArray(exam?.subjects) && exam.subjects.length) {
    return exam.subjects.length === 1 ? exam.subjects[0] : exam.subjects.join(", ");
  }
  return "JAMB Practice";
};

const JambDashboard = () => {
  const { user } =
    useContext(AuthContext);

  const {
    dark,
    glass,
    textFade,
  } = useOutletContext();

  const [loading, setLoading] =
    useState(true);

  const [stats, setStats] =
    useState({
      averageScore: 0,
      questionsSolved: 0,
      studyHours: 0,
      streak: 0,
      bestScore: 0,
      totalMocks: 0,
    });

  const [subjects, setSubjects] =
    useState([]);

  const [recentExams, setRecentExams] =
    useState([]);

  const [studyPlan, setStudyPlan] =
    useState([]);

  /**
   * =========================
   * USERNAME
   * =========================
   */

  const username = useMemo(() => {
    if (!user?.displayName)
      return "Student";

    return user.displayName.split(
      " ",
    )[0];
  }, [user]);

  /**
   * =========================
   * FETCH DATA
   * =========================
   */

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);

    let unsubSubjects = () => {};
    let unsubMocks = () => {};
    let unsubPlan = () => {};

    const fetchData =
      async () => {
        try {
          /**
           * USER DOC
           */

          const userRef = doc(
            db,
            "jambUsers",
            user.uid,
          );

          const userSnap =
            await getDoc(userRef);

          if (
            !userSnap.exists()
          ) {
            await setDoc(
              userRef,
              {
                averageScore: 0,
                questionsSolved: 0,
                studyHours: 0,
                streak: 0,
                createdAt:
                  Date.now(),
              },
            );
          } else {
            const data =
              userSnap.data();

            setStats(
              (prev) => ({
                ...prev,
                averageScore:
                  data.averageScore ||
                  0,
                questionsSolved:
                  data.questionsSolved ||
                  0,
                studyHours:
                  data.studyHours ||
                  0,
                streak:
                  data.streak ||
                  0,
              }),
            );
          }

          /**
           * SUBJECTS
           */

          const subjectsRef =
            query(
              collection(
                db,
                "jambUsers",
                user.uid,
                "subjects",
              ),
              orderBy(
                "progress",
                "desc",
              ),
            );

          unsubSubjects =
            onSnapshot(
              subjectsRef,
              (snapshot) => {
                const data =
                  snapshot.docs.map(
                    (doc) => ({
                      id: doc.id,
                      ...doc.data(),
                    }),
                  );

                setSubjects(
                  data,
                );
              },
            );

          /**
           * MOCKS
           */

          const mocksRef =
            query(
              collection(
                db,
                "jambUsers",
                user.uid,
                "mockResults",
              ),
              orderBy(
                "createdAt",
                "desc",
              ),
            );

          unsubMocks =
            onSnapshot(
              mocksRef,
              (snapshot) => {
                const data =
                  snapshot.docs.map(
                    (doc) => ({
                      id: doc.id,
                      ...doc.data(),
                    }),
                  );

                setRecentExams(data.slice(0, 5));

                /**
                 * ANALYTICS
                 */

                if (
                  data.length >
                  0
                ) {
                  let total = 0;

                  let best = 0;

                  let questions = 0;

                  data.forEach(
                    (exam) => {
                      total += getResultPercentage(exam);

                      questions += getResultTotal(exam);

                      best = Math.max(best, getResultPercentage(exam));
                    },
                  );

                  setStats(
                    (
                      prev,
                    ) => ({
                      ...prev,
                      averageScore:
                        Math.round(
                          total /
                            data.length,
                        ),
                      bestScore:
                        best,
                      totalMocks:
                        data.length,
                      questionsSolved:
                        questions,
                    }),
                  );
                }

                setLoading(
                  false,
                );
              },
            );

          /**
           * STUDY PLAN
           */

          const studyRef =
            query(
              collection(
                db,
                "jambUsers",
                user.uid,
                "studyPlan",
              ),
              orderBy(
                "time",
                "asc",
              ),
            );

          unsubPlan =
            onSnapshot(
              studyRef,
              (snapshot) => {
                const data =
                  snapshot.docs.map(
                    (doc) => ({
                      id: doc.id,
                      ...doc.data(),
                    }),
                  );

                setStudyPlan(
                  data,
                );
              },
            );

          setLoading(false);
        } catch (err) {
          console.log(err);

          setLoading(false);
        }
      };

    fetchData();

    return () => {
      unsubSubjects();
      unsubMocks();
      unsubPlan();
    };
  }, [user]);

  /**
   * =========================
   * STATS CARDS
   * =========================
   */

  const statCards = [
    {
      title:
        "Average Score",
      value: `${stats.averageScore}%`,
      icon: (
        <TrendingUp />
      ),
      color:
        "from-indigo-500 to-purple-500",
    },

    {
      title:
        "Questions Solved",
      value:
        stats.questionsSolved,
      icon: (
        <FileQuestion />
      ),
      color:
        "from-cyan-500 to-blue-500",
    },

    {
      title:
        "Study Hours",
      value: `${stats.studyHours}h`,
      icon: <Clock3 />,
      color:
        "from-orange-500 to-red-500",
    },

    {
      title:
        "Mock Exams",
      value:
        stats.totalMocks,
      icon: <Target />,
      color:
        "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* BG */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[350px] h-[350px] bg-indigo-500/10 blur-3xl rounded-full" />

        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-purple-500/10 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 p-4 sm:p-5 lg:p-6">
        {/* ========================= */}
        {/* HEADER */}
        {/* ========================= */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-7">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-semibold mb-4">
              <Brain
                size={15}
              />
              Smart CBT
              Dashboard
            </div>

            <h1 className="text-3xl sm:text-5xl font-black leading-tight">
              Welcome,
              <br />

              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                {username}
              </span>
            </h1>

            <p
              className={`mt-3 text-sm sm:text-base ${textFade}`}
            >
              Track your CBT
              performance and
              study progress.
            </p>
          </div>

          {/* USER */}

          <div className="flex items-center gap-3">
            <button
              className={`relative w-12 h-12 rounded-xl flex items-center justify-center ${glass}`}
            >
              <Bell size={20} />

              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
            </button>

            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-2xl ${glass}`}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold">
                {username.charAt(
                  0,
                )}
              </div>

              <div>
                <h3 className="font-bold">
                  {username}
                </h3>

                <p
                  className={`text-xs ${textFade}`}
                >
                  JAMB Candidate
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================= */}
        {/* HERO */}
        {/* ========================= */}

        <div
          className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 mb-7 ${glass}`}
        >
          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 blur-3xl rounded-full" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-400 text-sm font-semibold mb-5">
              <Flame
                size={15}
              />
              {stats.streak} Day
              Streak
            </div>

            <h2 className="text-3xl sm:text-4xl font-black leading-tight max-w-3xl">
              Prepare Smarter
              For JAMB.
            </h2>

            <p
              className={`mt-4 max-w-2xl text-sm sm:text-base ${textFade}`}
            >
              Practice past
              questions, take
              mock exams and
              monitor your
              progress.
            </p>

            <div className="flex flex-wrap gap-3 mt-7">
              <Link
                to="/subjects"
                className="h-12 px-5 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-all text-white font-semibold flex items-center gap-2"
              >
                Start Practice
                <ArrowRight
                  size={17}
                />
              </Link>

              <Link
                to="/mock-exam"
                className={`h-12 px-5 rounded-xl font-semibold flex items-center gap-2 transition-all ${glass}`}
              >
                <PlayCircle
                  size={17}
                />
                Mock Exam
              </Link>
            </div>
          </div>
        </div>

        {/* ========================= */}
        {/* STATS */}
        {/* ========================= */}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
          {statCards.map(
            (
              item,
              index,
            ) => (
              <div
                key={index}
                className={`rounded-3xl p-5 ${glass}`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${item.color} text-white flex items-center justify-center mb-4`}
                >
                  {
                    item.icon
                  }
                </div>

                <h2 className="text-3xl font-black">
                  {
                    item.value
                  }
                </h2>

                <p
                  className={`text-sm mt-1 ${textFade}`}
                >
                  {
                    item.title
                  }
                </p>
              </div>
            ),
          )}
        </div>

        {/* ========================= */}
        {/* MAIN GRID */}
        {/* ========================= */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* LEFT */}

          <div className="xl:col-span-2 space-y-5">
            {/* SUBJECTS */}

            <div
              className={`rounded-3xl p-5 ${glass}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black">
                  Subject
                  Progress
                </h2>

                <BookOpen className="text-indigo-500" />
              </div>

              {loading ? (
                <div className="py-14 text-center">
                  Loading...
                </div>
              ) : subjects.length ===
                0 ? (
                <div className="py-14 text-center">
                  No Subjects Yet
                </div>
              ) : (
                <div className="space-y-5">
                  {subjects.map(
                    (
                      subject,
                    ) => (
                      <div
                        key={
                          subject.id
                        }
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-bold">
                              {
                                subject.name
                              }
                            </h3>

                            <p
                              className={`text-sm ${textFade}`}
                            >
                              {
                                subject.questionsSolved
                              }{" "}
                              Questions
                            </p>
                          </div>

                          <span className="font-bold text-indigo-500">
                            {
                              subject.progress
                            }
                            %
                          </span>
                        </div>

                        <div
                          className={`w-full h-2.5 rounded-full overflow-hidden ${
                            dark
                              ? "bg-white/10"
                              : "bg-slate-200"
                          }`}
                        >
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            style={{
                              width: `${subject.progress}%`,
                            }}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* RECENT MOCKS */}

            <div
              className={`rounded-3xl p-5 ${glass}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black">
                  Recent Mock
                  Results
                </h2>

                <Trophy className="text-indigo-500" />
              </div>

              <div className="space-y-4">
                {recentExams.length ===
                0 ? (
                  <div className="py-14 text-center">
                    No Mock
                    Results
                  </div>
                ) : (
                  recentExams.map(
                    (
                      exam,
                    ) => (
                      <div
                        key={
                          exam.id
                        }
                        className={`rounded-2xl p-4 flex items-center justify-between ${glass}`}
                      >
                        <div>
                          <h3 className="font-bold">
                            {exam.subject}{getResultTitle(exam)}
                          </h3>

                          <p
                            className={`text-sm mt-1 ${textFade}`}
                          >
                            {
                              getResultTotal(exam)
                            }{" "}
                            Questions
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <h2 className="text-2xl font-black text-indigo-500">
                              {getResultPercentage(exam)}%
                            </h2>

                            <p
                              className={`text-xs ${textFade}`}
                            >
                              Score
                            </p>
                          </div>

                          <div className="w-11 h-11 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                            <CheckCircle2 size={20} />
                          </div>
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}

          <div className="space-y-5">
            {/* STUDY PLAN */}

            <div
              className={`rounded-3xl p-5 ${glass}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black">
                  Study Plan
                </h2>

                <Calendar className="text-indigo-500" />
              </div>

              <div className="space-y-4">
                {studyPlan.length ===
                0 ? (
                  <div className="py-14 text-center">
                    No Study Plan
                  </div>
                ) : (
                  studyPlan.map(
                    (
                      item,
                    ) => (
                      <div
                        key={
                          item.id
                        }
                        className={`rounded-2xl p-4 ${glass}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold">
                              {
                                item.title
                              }
                            </h3>

                            <p
                              className={`text-sm mt-1 ${textFade}`}
                            >
                              {
                                item.time
                              }
                            </p>
                          </div>

                          <button className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                            <ArrowRight
                              size={
                                16
                              }
                            />
                          </button>
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>
            </div>

            {/* PROFILE */}

            <div
              className={`rounded-3xl p-5 ${glass}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-15 h-15 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center">
                  <User2 size={28} />
                </div>

                <div>
                  <h3 className="text-xl font-black">
                    {username}
                  </h3>

                  <p
                    className={`text-sm ${textFade}`}
                  >
                    Future Scholar
                    🚀
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div
                  className={`rounded-2xl p-4 ${
                    dark
                      ? "bg-white/5"
                      : "bg-slate-100"
                  }`}
                >
                  <p
                    className={`text-xs ${textFade}`}
                  >
                    Best Score
                  </p>

                  <h2 className="text-2xl font-black text-green-500 mt-1">
                    {
                      stats.bestScore
                    }
                    %
                  </h2>
                </div>

                <div
                  className={`rounded-2xl p-4 ${
                    dark
                      ? "bg-white/5"
                      : "bg-slate-100"
                  }`}
                >
                  <p
                    className={`text-xs ${textFade}`}
                  >
                    Subjects
                  </p>

                  <h2 className="text-2xl font-black text-orange-500 mt-1">
                    {
                      subjects.length
                    }
                  </h2>
                </div>
              </div>

              <Link to={'/analytics'} className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-all text-white font-semibold mt-5 flex items-center justify-center gap-2">
                <Activity
                  size={17}
                />
                View Full
                Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JambDashboard;
