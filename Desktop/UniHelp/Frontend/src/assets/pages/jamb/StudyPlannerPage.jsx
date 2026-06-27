import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Clock3,
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
  BrainCircuit,
  CheckCircle2,
  TimerReset,
  Target,
  ArrowRight,
  Loader2,
  Check,
} from "lucide-react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../firebase/config";

import { AuthContext } from "../../context/AuthContext";

export default function StudyPlannerPage({
  dark = true,
}) {
  const { user } = useContext(AuthContext);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [studyTime, setStudyTime] = useState("");
  const [studyDate, setStudyDate] = useState("");

  /* =========================================================
      THEME
  ========================================================= */

  const theme = {
    bg: dark
      ? "bg-[#070B14] text-white"
      : "bg-gray-100 text-gray-900",

    card: dark
      ? "bg-white/5 border border-white/10"
      : "bg-white border border-gray-200 shadow-sm",

    muted: dark ? "text-gray-400" : "text-gray-500",

    input: dark
      ? "bg-[#111827] border-white/10 text-white placeholder:text-gray-500"
      : "bg-gray-50 border-gray-300 text-black placeholder:text-gray-400",

    glass: dark
      ? "backdrop-blur-xl"
      : "",

    hover: dark
      ? "hover:border-purple-500/30"
      : "hover:border-purple-300",
  };

  /* =========================================================
      FETCH PLANS
  ========================================================= */

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const plannerRef = collection(
      db,
      "users",
      user.uid,
      "studyPlanner"
    );

    const q = query(
      plannerRef,
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const plannerData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPlans(plannerData);
        setLoading(false);
      },
      (error) => {
        console.log(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  /* =========================================================
      STATS
  ========================================================= */

  const completedPlans = useMemo(() => {
    return plans.filter((plan) => plan.completed)
      .length;
  }, [plans]);

  const progress = useMemo(() => {
    if (plans.length === 0) return 0;

    return Math.round(
      (completedPlans / plans.length) * 100
    );
  }, [completedPlans, plans]);

  const totalStudyHours = useMemo(() => {
    return plans.length * 2;
  }, [plans]);

  /* =========================================================
      CREATE PLAN
  ========================================================= */

  const resetForm = () => {
    setSubject("");
    setTopic("");
    setStudyTime("");
    setStudyDate("");
  };

  const handleAddPlan = async () => {
    if (!user?.uid) {
      toast.error("Please login first.");
      return;
    }

    if (
      !subject.trim() ||
      !topic.trim() ||
      !studyTime ||
      !studyDate
    ) {
      toast.error("Please fill all fields.");
      return;
    }

    try {
      setCreating(true);

      const plannerRef = collection(
        db,
        "users",
        user.uid,
        "studyPlanner"
      );

      await addDoc(plannerRef, {
        subject: subject.trim(),
        topic: topic.trim(),
        studyTime,
        studyDate,
        completed: false,
        createdAt: serverTimestamp(),
      });

      resetForm();
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  /* =========================================================
      DELETE
  ========================================================= */

  const handleDelete = async (id) => {
    try {
      await deleteDoc(
        doc(
          db,
          "users",
          user.uid,
          "studyPlanner",
          id
        )
      );
    } catch (error) {
      console.log(error);
    }
  };

  /* =========================================================
      TOGGLE COMPLETE
  ========================================================= */

  const toggleCompleted = async (
    id,
    completed
  ) => {
    try {
      await updateDoc(
        doc(
          db,
          "users",
          user.uid,
          "studyPlanner",
          id
        ),
        {
          completed: !completed,
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      className={`min-h-screen px-4 py-8 md:px-8 transition-all duration-300 ${theme.bg}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* =========================================================
            HEADER
        ========================================================= */}

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-10">
          <div>
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 ${theme.card}`}
            >
              <Sparkles
                size={16}
                className="text-purple-400"
              />

              <span
                className={`text-sm ${theme.muted}`}
              >
                Smart Study Planning
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black leading-tight">
              Study
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent ml-3">
                Planner
              </span>
            </h1>

            <p
              className={`${theme.muted} mt-4 max-w-2xl text-lg leading-relaxed`}
            >
              Organize your subjects, topics,
              and study sessions efficiently for
              better academic performance.
            </p>
          </div>

          <div
            className={`flex items-center gap-4 rounded-[28px] p-5 ${theme.card} ${theme.glass}`}
          >
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
              <BrainCircuit size={30} />
            </div>

            <div>
              <p
                className={`${theme.muted} text-sm`}
              >
                Productivity Score
              </p>

              <h2 className="text-3xl font-black mt-1">
                {progress}%
              </h2>
            </div>
          </div>
        </div>

        {/* =========================================================
            STATS
        ========================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          {[
            {
              label: "Study Plans",
              value: plans.length,
              icon: BookOpen,
              color:
                "bg-purple-500/20 text-purple-400",
            },
            {
              label: "Completed",
              value: completedPlans,
              icon: CheckCircle2,
              color:
                "bg-green-500/20 text-green-400",
            },
            {
              label: "Progress",
              value: `${progress}%`,
              icon: Target,
              color:
                "bg-pink-500/20 text-pink-400",
            },
            {
              label: "Focus Hours",
              value: `${totalStudyHours}h`,
              icon: TimerReset,
              color:
                "bg-yellow-500/20 text-yellow-400",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className={`rounded-[28px] p-6 transition-all ${theme.card}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`${theme.muted} text-sm`}
                  >
                    {stat.label}
                  </p>

                  <h2 className="text-4xl font-black mt-2">
                    {stat.value}
                  </h2>
                </div>

                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.color}`}
                >
                  <stat.icon size={26} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* =========================================================
            MAIN CONTENT
        ========================================================= */}

        <div className="grid xl:grid-cols-[380px_1fr] gap-8">
          {/* =========================================================
              CREATE PLANNER
          ========================================================= */}

          <div
            className={`rounded-[32px] p-6 h-fit sticky top-5 ${theme.card} ${theme.glass}`}
          >
            <div className="flex items-center gap-4 mb-7">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
                <Plus size={26} />
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  New Plan
                </h2>

                <p
                  className={`${theme.muted} text-sm mt-1`}
                >
                  Organize your next study
                  session
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* SUBJECT */}

              <div>
                <label
                  className={`text-sm block mb-2 ${theme.muted}`}
                >
                  Subject
                </label>

                <input
                  type="text"
                  value={subject}
                  onChange={(e) =>
                    setSubject(e.target.value)
                  }
                  placeholder="Mathematics"
                  className={`w-full h-14 rounded-2xl border px-4 outline-none transition-all focus:border-purple-500 ${theme.input}`}
                />
              </div>

              {/* TOPIC */}

              <div>
                <label
                  className={`text-sm block mb-2 ${theme.muted}`}
                >
                  Topic
                </label>

                <input
                  type="text"
                  value={topic}
                  onChange={(e) =>
                    setTopic(e.target.value)
                  }
                  placeholder="Quadratic Equations"
                  className={`w-full h-14 rounded-2xl border px-4 outline-none transition-all focus:border-purple-500 ${theme.input}`}
                />
              </div>

              {/* TIME */}

              <div>
                <label
                  className={`text-sm block mb-2 ${theme.muted}`}
                >
                  Study Time
                </label>

                <input
                  type="time"
                  value={studyTime}
                  onChange={(e) =>
                    setStudyTime(e.target.value)
                  }
                  className={`w-full h-14 rounded-2xl border px-4 outline-none transition-all focus:border-purple-500 ${theme.input}`}
                />
              </div>

              {/* DATE */}

              <div>
                <label
                  className={`text-sm block mb-2 ${theme.muted}`}
                >
                  Study Date
                </label>

                <input
                  type="date"
                  value={studyDate}
                  onChange={(e) =>
                    setStudyDate(e.target.value)
                  }
                  className={`w-full h-14 rounded-2xl border px-4 outline-none transition-all focus:border-purple-500 ${theme.input}`}
                />
              </div>

              {/* BUTTON */}

              <button
                onClick={handleAddPlan}
                disabled={creating}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-60"
              >
                {creating ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Study Plan
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* =========================================================
              PLANS
          ========================================================= */}

          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Scheduled Sessions
                </h2>

                <p
                  className={`${theme.muted} mt-1`}
                >
                  Stay consistent with your
                  preparation routine.
                </p>
              </div>
            </div>

            {/* LOADING */}

            {loading ? (
              <div
                className={`rounded-[30px] p-12 text-center ${theme.card}`}
              >
                <Loader2
                  size={35}
                  className="animate-spin mx-auto mb-4 text-purple-400"
                />

                <p className={theme.muted}>
                  Loading planner...
                </p>
              </div>
            ) : plans.length === 0 ? (
              /* EMPTY */
              <div
                className={`rounded-[30px] p-12 text-center ${theme.card} ${theme.glass}`}
              >
                <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-5 text-purple-400">
                  <CalendarDays size={36} />
                </div>

                <h3 className="text-2xl font-bold">
                  No Study Plans Yet
                </h3>

                <p
                  className={`${theme.muted} mt-3 max-w-md mx-auto`}
                >
                  Create your first study
                  session and begin planning
                  smarter.
                </p>
              </div>
            ) : (
              /* PLANS GRID */
              <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-5">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`rounded-[30px] p-6 transition-all ${theme.card} ${theme.hover} ${
                      plan.completed
                        ? "border-green-500/40"
                        : ""
                    }`}
                  >
                    {/* TOP */}

                    <div className="flex items-start justify-between gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white shrink-0">
                        <BookOpen size={24} />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            toggleCompleted(
                              plan.id,
                              plan.completed
                            )
                          }
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            plan.completed
                              ? "bg-green-500 text-white"
                              : dark
                                ? "bg-white/10 hover:bg-white/20"
                                : "bg-gray-100 hover:bg-gray-200"
                          }`}
                        >
                          <Check size={18} />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(plan.id)
                          }
                          className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* CONTENT */}

                    <div className="mt-6">
                      <h3 className="text-2xl font-bold leading-snug">
                        {plan.subject}
                      </h3>

                      <p
                        className={`${theme.muted} mt-2 leading-relaxed`}
                      >
                        {plan.topic}
                      </p>
                    </div>

                    {/* DETAILS */}

                    <div className="mt-6 space-y-4">
                      <div
                        className={`flex items-center gap-3 text-sm ${dark ? "text-gray-300" : "text-gray-600"}`}
                      >
                        <Clock3
                          size={16}
                          className="text-yellow-400"
                        />
                        {plan.studyTime}
                      </div>

                      <div
                        className={`flex items-center gap-3 text-sm ${dark ? "text-gray-300" : "text-gray-600"}`}
                      >
                        <CalendarDays
                          size={16}
                          className="text-blue-400"
                        />
                        {plan.studyDate}
                      </div>
                    </div>

                    {/* FOOTER */}

                    <div className="mt-7 pt-5 border-t border-white/10 flex items-center justify-between">
                      <div
                        className={`flex items-center gap-2 text-sm font-medium ${
                          plan.completed
                            ? "text-green-400"
                            : "text-yellow-400"
                        }`}
                      >
                        <CheckCircle2 size={16} />

                        {plan.completed
                          ? "Completed"
                          : "Scheduled"}
                      </div>

                      <div
                        className={`px-3 py-1 rounded-full text-xs border ${
                          plan.completed
                            ? "bg-green-500/10 text-green-300 border-green-500/20"
                            : "bg-purple-500/10 text-purple-300 border-purple-500/20"
                        }`}
                      >
                        {plan.completed
                          ? "Done"
                          : "Active Plan"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}