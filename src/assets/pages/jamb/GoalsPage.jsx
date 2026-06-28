import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Target,
  Plus,
  Flame,
  Trophy,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Trash2,
  Sparkles,
  ArrowRight,
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
} from "firebase/firestore";

import { db } from "./../../../firebase/config";
import { AuthContext } from "./../../context/AuthContext";

export default function GoalsPage({
  dark = false,
}) {
  const { user } = useContext(AuthContext);

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [targetScore, setTargetScore] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (!user?.uid) return;

    const goalsRef = collection(
      db,
      "users",
      user.uid,
      "goals"
    );

    const q = query(
      goalsRef,
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setGoals(goalsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const completedGoals = useMemo(() => {
    return goals.filter((goal) => goal.completed).length;
  }, [goals]);

  const progress = useMemo(() => {
    if (goals.length === 0) return 0;

    return Math.round(
      (completedGoals / goals.length) * 100
    );
  }, [completedGoals, goals]);

  const handleAddGoal = async () => {
    if (!title || !targetScore || !deadline) {
      toast.error("Fill all fields.");
      return;
    }

    try {
      const goalsRef = collection(
        db,
        "users",
        user.uid,
        "goals"
      );

      await addDoc(goalsRef, {
        title,
        targetScore,
        deadline,
        completed: false,
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setTargetScore("");
      setDeadline("");
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await deleteDoc(
        doc(db, "users", user.uid, "goals", goalId)
      );
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      className={`min-h-screen px-4 py-8 md:px-8
      ${
        dark
          ? "bg-[#070B14] text-white"
          : "bg-gray-100 text-black"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-5">
              <Sparkles
                size={16}
                className="text-purple-400"
              />

              <span className="text-sm text-slate-400">
                Goal Tracking System
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black leading-tight">
              Crush Your
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent ml-3">
                JAMB Goals
              </span>
            </h1>

            <p className="text-gray-400 mt-4 max-w-2xl text-lg leading-relaxed">
              Set study targets, monitor your preparation journey,
              and stay disciplined until exam day.
            </p>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 min-w-[170px] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">
                    Total Goals
                  </p>

                  <h2 className="text-3xl font-black mt-2">
                    {goals.length}
                  </h2>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Target size={22} />
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 min-w-[170px] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">
                    Completion
                  </p>

                  <h2 className="text-3xl font-black mt-2">
                    {progress}%
                  </h2>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400">
                  <Trophy size={22} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-[380px_1fr] gap-8">
          {/* CREATE GOAL */}
          <div className="bg-white/5 border border-white/10 rounded-[30px] p-6 backdrop-blur-xl h-fit sticky top-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
                <Plus size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Create Goal
                </h2>

                <p className="text-sm text-gray-400">
                  Add a new target
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Goal Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Score 300+ in JAMB"
                  className={`w-full h-14 px-4 rounded-2xl ${dark ? 'bg-[#111827]' : 'bg-slate-300'}  border border-white/10 outline-none focus:border-purple-500 transition-all`}
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Target Score
                </label>

                <input
                  type="number"
                  value={targetScore}
                  onChange={(e) =>
                    setTargetScore(e.target.value)
                  }
                  placeholder="320"
                  className={`w-full h-14 px-4 rounded-2xl ${dark ? 'bg-[#111827]' : 'bg-slate-300'}  border border-white/10 outline-none focus:border-purple-500 transition-all`}
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Deadline
                </label>

                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={`w-full h-14 px-4 rounded-2xl ${dark ? 'bg-[#111827]' : 'bg-slate-300'}  border border-white/10 outline-none focus:border-purple-500 transition-all`}
                />
              </div>

              <button
                onClick={handleAddGoal}
                className="w-full h-14 text-white rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
              >
                Create Goal
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* GOALS */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Your Goals
                </h2>

                <p className="text-gray-400 mt-1">
                  Stay consistent and monitor your targets.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center text-gray-400">
                Loading goals...
              </div>
            ) : goals.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-[30px] p-12 text-center backdrop-blur-xl">
                <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-5 text-purple-400">
                  <Target size={36} />
                </div>

                <h3 className="text-2xl font-bold">
                  No Goals Yet
                </h3>

                <p className="text-gray-400 mt-3 max-w-md mx-auto">
                  Create your first study target and start tracking
                  your preparation journey.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="bg-white/5 border border-white/10 rounded-[28px] p-6 backdrop-blur-xl hover:border-purple-500/30 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white shrink-0">
                        <Flame size={24} />
                      </div>

                      <button
                        onClick={() =>
                          handleDeleteGoal(goal.id)
                        }
                        className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-xl font-bold leading-snug">
                        {goal.title}
                      </h3>

                      <div className="mt-5 space-y-3">
                        <div className="flex items-center gap-3 text-slate-400 text-sm">
                          <Trophy
                            size={16}
                            className="text-yellow-400"
                          />

                          Target Score: {goal.targetScore}
                        </div>

                        <div className="flex items-center gap-3 text-slate-400 text-sm">
                          <CalendarDays
                            size={16}
                            className="text-blue-400"
                          />

                          Deadline: {goal.deadline}
                        </div>

                        <div className="flex items-center gap-3 text-slate-400 text-sm">
                          <Clock3
                            size={16}
                            className="text-green-400"
                          />

                          Stay consistent daily
                        </div>
                      </div>
                    </div>

                    <div className="mt-7 pt-5 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                        <CheckCircle2 size={16} />
                        Active Goal
                      </div>

                      <div className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        In Progress
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
