import { useEffect, useMemo, useState } from "react";

import {
  Calculator,
  Plus,
  Trash2,
  AlertTriangle,
  Save,
  TrendingUp,
  Sparkles,
  Target,
  BookOpen,
  BarChart3,
  ClipboardList,
  History,
  LineChart as LineChartIcon,
  X,
  Award,
  ArrowUpRight,
  GraduationCap,
  Flame,
  Brain,
  ChevronRight,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../../firebase/config";

import { onAuthStateChanged } from "firebase/auth";

const CGPATracker = ({ dark }) => {
  /* =====================================================
     STATES
  ===================================================== */

  const [semesters, setSemesters] =
    useState([
      {
        name: "",
        units: "",
        gpa: "",
      },
    ]);

  const [records, setRecords] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [warning, setWarning] =
    useState("");

  const [msg, setMsg] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [showSaveModal, setShowSaveModal] =
    useState(false);

  const [predictedGPA, setPredictedGPA] =
    useState("");

  const [predictedUnits, setPredictedUnits] =
    useState("");

  const [predictedResult, setPredictedResult] =
    useState("");

  const [targetCGPA, setTargetCGPA] =
    useState("");

  const [targetCourses, setTargetCourses] =
    useState([
      {
        title: "",
        unit: "",
      },
    ]);

  const [gradeAdvice, setGradeAdvice] =
    useState([]);

  /* =====================================================
     THEME
  ===================================================== */

  const bg = dark
    ? "bg-[#050816] text-white"
    : "bg-[#f5f7ff] text-gray-900";

  const card = dark
    ? "bg-white/[0.04] border border-white/10 backdrop-blur-2xl"
    : "bg-white border border-gray-200 shadow-sm";

  const softCard = dark
    ? "bg-white/[0.03]"
    : "bg-gray-50";

  const inputClass = `
  w-full rounded-2xl px-4 py-3.5 outline-none transition-all duration-300 border text-sm
  ${
    dark
      ? "bg-[#0b1220] border-white/10 focus:border-indigo-500 focus:bg-[#101827]"
      : "bg-white border-gray-200 focus:border-indigo-500"
  }
`;

  /* =====================================================
     SEMESTERS
  ===================================================== */

  const addSemester = () => {
    setSemesters([
      ...semesters,
      {
        name: "",
        units: "",
        gpa: "",
      },
    ]);
  };

  const removeSemester = (i) => {
    const updated =
      semesters.filter(
        (_, index) =>
          index !== i
      );

    setSemesters(
      updated.length
        ? updated
        : [
            {
              name: "",
              units: "",
              gpa: "",
            },
          ]
    );
  };

  const updateSemester = (
    i,
    field,
    value
  ) => {
    const updated = [
      ...semesters,
    ];

    updated[i][field] =
      value;

    setSemesters(updated);
  };

  /* =====================================================
     CALCULATIONS
  ===================================================== */

  const getTotals = () => {
    let totalUnits = 0;

    let totalPoints = 0;

    semesters.forEach((s) => {
      const units =
        Number(s.units) ||
        0;

      const gpa =
        Number(s.gpa) || 0;

      totalUnits += units;

      totalPoints +=
        units * gpa;
    });

    return {
      totalUnits,
      totalPoints,
    };
  };

  const calculateCGPA =
    () => {
      const {
        totalUnits,
        totalPoints,
      } = getTotals();

      return totalUnits
        ? (
            totalPoints /
            totalUnits
          ).toFixed(2)
        : "0.00";
    };

  /* =====================================================
     CLASSIFICATION
  ===================================================== */

  const getClassification =
    (cgpa) => {
      const value =
        Number(cgpa);

      if (value >= 4.5)
        return {
          text: "First Class",
          color:
            "text-yellow-500",
          emoji: "🏆",
        };

      if (value >= 3.5)
        return {
          text: "Second Class Upper",
          color:
            "text-green-500",
          emoji: "🔥",
        };

      if (value >= 2.4)
        return {
          text: "Second Class Lower",
          color:
            "text-blue-500",
          emoji: "💪",
        };

      if (value >= 1.5)
        return {
          text: "Third Class",
          color:
            "text-orange-500",
          emoji: "🙂",
        };

      return {
        text: "Pass",
        color:
          "text-red-500",
        emoji: "⚠️",
      };
    };

  const classification =
    getClassification(
      calculateCGPA()
    );

  /* =====================================================
     WARNING
  ===================================================== */

  useEffect(() => {
    if (
      semesters.length < 2
    ) {
      setWarning("");

      return;
    }

    const last =
      semesters[
        semesters.length -
          1
      ];

    const prev =
      semesters[
        semesters.length -
          2
      ];

    if (
      Number(last.gpa) <
      Number(prev.gpa)
    ) {
      setWarning(
        "Your GPA dropped compared to the previous semester."
      );
    } else {
      setWarning("");
    }
  }, [semesters]);

  /* =====================================================
     PREDICTOR
  ===================================================== */

  const predictNextCGPA =
    () => {
      const {
        totalUnits,
        totalPoints,
      } = getTotals();

      if (
        !predictedGPA ||
        !predictedUnits
      )
        return;

      const gpa =
        Number(
          predictedGPA
        );

      const units =
        Number(
          predictedUnits
        );

      const result =
        (
          (totalPoints +
            units * gpa) /
          (totalUnits +
            units)
        ).toFixed(2);

      setPredictedResult(
        result
      );
    };

  /* =====================================================
     TARGET PLANNER
  ===================================================== */

  const addTargetCourse =
    () => {
      setTargetCourses([
        ...targetCourses,
        {
          title: "",
          unit: "",
        },
      ]);
    };

  const removeTargetCourse =
    (i) => {
      const updated =
        targetCourses.filter(
          (
            _,
            index
          ) =>
            index !== i
        );

      setTargetCourses(
        updated.length
          ? updated
          : [
              {
                title: "",
                unit: "",
              },
            ]
      );
    };

  const updateTargetCourse =
    (
      i,
      field,
      value
    ) => {
      const updated = [
        ...targetCourses,
      ];

      updated[i][field] =
        value;

      setTargetCourses(
        updated
      );
    };

  const calculateRequiredGrades =
    () => {
      const {
        totalUnits,
        totalPoints,
      } = getTotals();

      const totalNewUnits =
        targetCourses.reduce(
          (sum, c) =>
            sum +
            (Number(
              c.unit
            ) || 0),
          0
        );

      if (
        !targetCGPA ||
        !totalNewUnits
      )
        return;

      const neededPoints =
        Number(
          targetCGPA
        ) *
        (totalUnits +
          totalNewUnits);

      const remaining =
        neededPoints -
        totalPoints;

      const avg =
        remaining /
        totalNewUnits;

      const getGrade =
        (gpa) => {
          if (gpa >= 4.5)
            return "A";

          if (gpa >= 3.5)
            return "B";

          if (gpa >= 2.5)
            return "C";

          if (gpa >= 1.5)
            return "D";

          return "E";
        };

      const advice =
        targetCourses.map(
          (c) => ({
            ...c,
            required:
              getGrade(avg),
          })
        );

      setGradeAdvice(
        advice
      );
    };

  /* =====================================================
     SAVE
  ===================================================== */

  const handleSave =
    async () => {
      if (
        !auth.currentUser
      ) {
        setMsg(
          "Login required"
        );

        return;
      }

      setSaving(true);

      try {
        await addDoc(
          collection(
            db,
            "cgpaTracker"
          ),
          {
            userId:
              auth
                .currentUser
                .uid,

            semesters,

            cgpa:
              calculateCGPA(),

            createdAt:
              serverTimestamp(),
          }
        );

        setMsg(
          "Saved successfully 🚀"
        );

        fetchRecords(
          auth.currentUser
        );
      } catch (err) {
        setMsg(
          "Error saving"
        );
      }

      setSaving(false);
    };

  /* =====================================================
     FETCH
  ===================================================== */

  const fetchRecords =
    async (user) => {
      const q = query(
        collection(
          db,
          "cgpaTracker"
        ),

        where(
          "userId",
          "==",
          user.uid
        )
      );

      const snap =
        await getDocs(q);

      const data =
        snap.docs.map(
          (d) => ({
            id: d.id,
            ...d.data(),
          })
        );

      setRecords(data);

      setLoading(false);
    };

  /* =====================================================
     DELETE
  ===================================================== */

  const handleDelete =
    async (id) => {
      await deleteDoc(
        doc(
          db,
          "cgpaTracker",
          id
        )
      );

      setRecords(
        (
          prev
        ) =>
          prev.filter(
            (r) =>
              r.id !== id
          )
      );
    };

  /* =====================================================
     AUTH
  ===================================================== */

  useEffect(() => {
    const unsub =
      onAuthStateChanged(
        auth,
        (user) => {
          if (user)
            fetchRecords(
              user
            );
          else
            setLoading(
              false
            );
        }
      );

    return () =>
      unsub();
  }, []);

  /* =====================================================
     CHART DATA
  ===================================================== */

  const chartData =
    records.map(
      (
        item,
        index
      ) => ({
        name: `#${index + 1}`,
        cgpa: Number(
          item.cgpa
        ),
      })
    );

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div
      className={`min-h-screen md:pt-20 w-full ${bg}`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">

        {/* HERO */}

        <div
          className={`${card} overflow-hidden rounded-4xl p-6 md:p-10 relative`}
        >
          <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 via-transparent to-purple-500/10" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">

            <div className="max-w-2xl">

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-semibold mb-5">
                <GraduationCap size={16} />
                Smart Academic Tracker
              </div>

              <h1 className="text-4xl md:text-6xl font-black leading-tight">
                Track Your
                <span className="text-indigo-500">
                  {" "}
                  CGPA
                </span>{" "}
                Like a Pro
              </h1>

              <p className="opacity-70 mt-5 text-base md:text-lg leading-relaxed">
                Predict future
                results, monitor
                academic growth,
                plan target grades,
                and save your
                progress beautifully.
              </p>

              <div className="flex flex-wrap gap-3 mt-7">

                <button
                  onClick={() =>
                    setShowSaveModal(
                      true
                    )
                  }
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-2 transition"
                >
                  <Save size={18} />
                  Save Record
                </button>

                <button className="px-6 py-4 rounded-2xl border border-white/10 bg-white/5 font-semibold flex items-center gap-2">
                  <Sparkles
                    size={18}
                  />
                  AI Insights
                </button>
              </div>
            </div>

            {/* CGPA CIRCLE */}

            <div className="relative flex justify-center">

              <div className="w-72 h-72 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 p-3 shadow-[0_0_80px_rgba(99,102,241,0.4)]">

                <div
                  className={`w-full h-full rounded-full flex flex-col items-center justify-center ${
                    dark
                      ? "bg-[#050816]"
                      : "bg-white"
                  }`}
                >
                  <p className="text-sm opacity-60">
                    Current CGPA
                  </p>

                  <h1 className="text-7xl font-black mt-2 text-indigo-500">
                    {calculateCGPA()}
                  </h1>

                  <div
                    className={`mt-4 px-5 py-2 rounded-full text-sm font-semibold ${classification.color} bg-white/5`}
                  >
                    {
                      classification.emoji
                    }{" "}
                    {
                      classification.text
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">

          {[
            {
              label:
                "Semesters",
              value:
                semesters.length,
              icon: BookOpen,
            },

            {
              label:
                "Total Units",
              value:
                getTotals()
                  .totalUnits,
              icon: Award,
            },

            {
              label:
                "Classification",
              value:
                classification.text,
              icon: Flame,
            },

            {
              label:
                "Performance",
              value:
                calculateCGPA(),
              icon:
                TrendingUp,
            },
          ].map(
            (
              item,
              index
            ) => (
              <div
                key={index}
                className={`${card} rounded-[1.7rem] p-5`}
              >
                <div className="flex justify-between items-start">

                  <div>
                    <p className="text-sm opacity-60">
                      {
                        item.label
                      }
                    </p>

                    <h2 className="text-2xl font-black mt-3">
                      {
                        item.value
                      }
                    </h2>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <item.icon
                      size={22}
                    />
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* MAIN */}

        <div className="grid xl:grid-cols-3 gap-6 mt-6">

          {/* LEFT */}

          <div className="xl:col-span-2 space-y-6">

            {/* SEMESTERS */}

            <div
              className={`${card} rounded-4xl p-5 md:p-7`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">

                <div>
                  <h2 className="text-2xl font-black">
                    Semester Records
                  </h2>

                  <p className="opacity-60 mt-1">
                    Add all semester
                    GPA records
                  </p>
                </div>

                <button
                  onClick={
                    addSemester
                  }
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-semibold"
                >
                  <Plus
                    size={18}
                  />
                  Add Semester
                </button>
              </div>

              <div className="space-y-4">

                {semesters.map(
                  (
                    s,
                    i
                  ) => (
                    <div
                      key={i}
                      className={`${softCard} rounded-[1.7rem] p-5 border ${
                        dark
                          ? "border-white/5"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="grid md:grid-cols-12 gap-4">

                        <div className="md:col-span-5">
                          <p className="text-xs opacity-60 mb-2">
                            Semester
                          </p>

                          <input
                            value={
                              s.name
                            }
                            onChange={(
                              e
                            ) =>
                              updateSemester(
                                i,
                                "name",
                                e
                                  .target
                                  .value
                              )
                            }
                            placeholder="First Semester"
                            className={
                              inputClass
                            }
                          />
                        </div>

                        <div className="md:col-span-3">
                          <p className="text-xs opacity-60 mb-2">
                            Units
                          </p>

                          <input
                            type="number"
                            value={
                              s.units
                            }
                            onChange={(
                              e
                            ) =>
                              updateSemester(
                                i,
                                "units",
                                e
                                  .target
                                  .value
                              )
                            }
                            placeholder="24"
                            className={
                              inputClass
                            }
                          />
                        </div>

                        <div className="md:col-span-3">
                          <p className="text-xs opacity-60 mb-2">
                            GPA
                          </p>

                          <input
                            type="number"
                            value={
                              s.gpa
                            }
                            onChange={(
                              e
                            ) =>
                              updateSemester(
                                i,
                                "gpa",
                                e
                                  .target
                                  .value
                              )
                            }
                            placeholder="4.50"
                            className={
                              inputClass
                            }
                          />
                        </div>

                        <div className="md:col-span-1 flex items-end">
                          <button
                            onClick={() =>
                              removeSemester(
                                i
                              )
                            }
                            className="w-full h-13 rounded-2xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                          >
                            <Trash2
                              size={
                                18
                              }
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {warning && (
                <div className="mt-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 flex items-center gap-2">
                  <AlertTriangle
                    size={18}
                  />
                  {warning}
                </div>
              )}
            </div>

            {/* CHART */}

            <div
              className={`${card} rounded-4xl p-6`}
            >
              <div className="flex items-center justify-between mb-6">

                <div>
                  <h2 className="text-2xl font-black">
                    Performance Trend
                  </h2>

                  <p className="opacity-60 text-sm mt-1">
                    Your academic
                    progress over
                    time
                  </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <LineChartIcon
                    size={22}
                  />
                </div>
              </div>

              {chartData.length ===
              0 ? (
                <div className="h-72 flex items-center justify-center opacity-50">
                  No chart data
                </div>
              ) : (
                <div className="w-full h-80">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <AreaChart
                      data={
                        chartData
                      }
                    >
                      <defs>
                        <linearLinear
                          id="color"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#6366f1"
                            stopOpacity={
                              0.5
                            }
                          />

                          <stop
                            offset="95%"
                            stopColor="#6366f1"
                            stopOpacity={
                              0
                            }
                          />
                        </linearLinear>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={
                          dark
                            ? "#374151"
                            : "#e5e7eb"
                        }
                      />

                      <XAxis dataKey="name" />

                      <YAxis
                        domain={[
                          0,
                          5,
                        ]}
                      />

                      <Tooltip />

                      <Area
                        type="monotone"
                        dataKey="cgpa"
                        stroke="#6366f1"
                        fillOpacity={
                          1
                        }
                        fill="url(#color)"
                        strokeWidth={
                          4
                        }
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}

          <div className="space-y-6">

            {/* PREDICTOR */}

            <div
              className={`${card} rounded-4xl p-6`}
            >
              <div className="flex items-center gap-3 mb-6">

                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Brain
                    size={22}
                  />
                </div>

                <div>
                  <h2 className="font-black text-xl">
                    Predictor
                  </h2>

                  <p className="text-sm opacity-60">
                    Predict future
                    CGPA
                  </p>
                </div>
              </div>

              <div className="space-y-4">

                <input
                  type="number"
                  value={
                    predictedGPA
                  }
                  onChange={(e) =>
                    setPredictedGPA(
                      e.target
                        .value
                    )
                  }
                  placeholder="Expected GPA"
                  className={
                    inputClass
                  }
                />

                <input
                  type="number"
                  value={
                    predictedUnits
                  }
                  onChange={(e) =>
                    setPredictedUnits(
                      e.target
                        .value
                    )
                  }
                  placeholder="Expected Units"
                  className={
                    inputClass
                  }
                />

                <button
                  onClick={
                    predictNextCGPA
                  }
                  className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2"
                >
                  <Sparkles
                    size={18}
                  />
                  Predict Now
                </button>
              </div>

              {predictedResult && (
                <div className="mt-6 rounded-3xl bg-linear-to-br from-indigo-500 to-purple-600 p-6 text-center text-white">

                  <p className="opacity-80 text-sm">
                    Predicted CGPA
                  </p>

                  <h1 className="text-5xl font-black mt-2">
                    {
                      predictedResult
                    }
                  </h1>
                </div>
              )}
            </div>

            {/* TARGET */}

            <div
              className={`${card} rounded-4xl p-6`}
            >
              <div className="flex items-center gap-3 mb-6">

                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Target
                    size={22}
                  />
                </div>

                <div>
                  <h2 className="font-black text-xl">
                    Target Planner
                  </h2>

                  <p className="text-sm opacity-60">
                    Plan your grades
                  </p>
                </div>
              </div>

              <input
                type="number"
                value={
                  targetCGPA
                }
                onChange={(e) =>
                  setTargetCGPA(
                    e.target
                      .value
                  )
                }
                placeholder="Target CGPA"
                className={`${inputClass} mb-4`}
              />

              <div className="space-y-3">

                {targetCourses.map(
                  (
                    c,
                    i
                  ) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-2"
                    >
                      <input
                        value={
                          c.title
                        }
                        onChange={(
                          e
                        ) =>
                          updateTargetCourse(
                            i,
                            "title",
                            e
                              .target
                              .value
                          )
                        }
                        placeholder="Course"
                        className={`${inputClass} col-span-7`}
                      />

                      <input
                        type="number"
                        value={
                          c.unit
                        }
                        onChange={(
                          e
                        ) =>
                          updateTargetCourse(
                            i,
                            "unit",
                            e
                              .target
                              .value
                          )
                        }
                        placeholder="Unit"
                        className={`${inputClass} col-span-4`}
                      />

                      <button
                        onClick={() =>
                          removeTargetCourse(
                            i
                          )
                        }
                        className="col-span-1 text-red-500"
                      >
                        <X
                          size={
                            18
                          }
                        />
                      </button>
                    </div>
                  )
                )}
              </div>

              <button
                onClick={
                  addTargetCourse
                }
                className="mt-4 text-sm font-semibold flex items-center gap-2 text-indigo-500"
              >
                <Plus size={16} />
                Add Course
              </button>

              <button
                onClick={
                  calculateRequiredGrades
                }
                className="w-full mt-5 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <BarChart3
                  size={18}
                />
                Calculate Advice
              </button>

              {gradeAdvice.length >
                0 && (
                <div className="mt-6 space-y-3">

                  {gradeAdvice.map(
                    (
                      c,
                      i
                    ) => (
                      <div
                        key={i}
                        className={`${softCard} rounded-2xl p-4 flex items-center justify-between`}
                      >
                        <div>
                          <p className="font-semibold">
                            {
                              c.title
                            }
                          </p>

                          <p className="text-xs opacity-60 mt-1">
                            {
                              c.unit
                            }{" "}
                            Units
                          </p>
                        </div>

                        <div className="text-green-500 font-black text-2xl">
                          {
                            c.required
                          }
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HISTORY */}

        <div className="mt-8">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-3xl font-black">
                Saved Records
              </h2>

              <p className="opacity-60 mt-1">
                Previously saved
                CGPA history
              </p>
            </div>

            <History className="text-indigo-500" />
          </div>

          {records.length ===
          0 ? (
            <div
              className={`${card} rounded-4xl p-12 text-center`}
            >
              <History className="mx-auto opacity-40 mb-4" />

              <h3 className="font-bold text-xl">
                No Records Yet
              </h3>

              <p className="opacity-60 mt-2">
                Save your first
                CGPA record.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

              {records.map(
                (r) => (
                  <div
                    key={r.id}
                    className={`${card} rounded-4xl p-5`}
                  >
                    <div className="flex justify-between items-start">

                      <div>
                        <p className="text-sm opacity-60">
                          CGPA
                        </p>

                        <h2 className="text-5xl font-black text-indigo-500 mt-2">
                          {
                            r.cgpa
                          }
                        </h2>
                      </div>

                      <button
                        onClick={() =>
                          handleDelete(
                            r.id
                          )
                        }
                        className="w-11 h-11 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center"
                      >
                        <Trash2
                          size={18}
                        />
                      </button>
                    </div>

                    <div className="space-y-3 mt-6 max-h-72 overflow-y-auto pr-1">

                      {r.semesters.map(
                        (
                          s,
                          i
                        ) => (
                          <div
                            key={i}
                            className={`${softCard} rounded-2xl p-4`}
                          >
                            <div className="flex justify-between">

                              <div>
                                <p className="font-semibold">
                                  {
                                    s.name
                                  }
                                </p>

                                <p className="text-xs opacity-60 mt-1">
                                  {
                                    s.units
                                  }{" "}
                                  Units
                                </p>
                              </div>

                              <div className="text-indigo-500 font-black text-xl">
                                {
                                  s.gpa
                                }
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* SAVE MODAL */}

      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">

          <div
            className={`w-full max-w-md rounded-[2.5rem] p-8 relative ${
              dark
                ? "bg-[#0b1120] border border-white/10"
                : "bg-white"
            }`}
          >
            <button
              onClick={() =>
                setShowSaveModal(
                  false
                )
              }
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X size={18} />
            </button>

            <div className="text-center">

              <div className="w-48 h-48 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 p-3 mx-auto">

                <div
                  className={`w-full h-full rounded-full flex flex-col items-center justify-center ${
                    dark
                      ? "bg-[#050816]"
                      : "bg-white"
                  }`}
                >
                  <p className="text-sm opacity-60">
                    CGPA
                  </p>

                  <h1 className="text-6xl font-black text-indigo-500 mt-2">
                    {calculateCGPA()}
                  </h1>
                </div>
              </div>

              <h2 className="text-3xl font-black mt-8">
                Save Record
              </h2>

              <p className="opacity-60 mt-2">
                Store your current
                academic progress
              </p>

              <button
                onClick={
                  handleSave
                }
                className="w-full mt-8 py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center gap-2"
              >
                <Save size={18} />

                {saving
                  ? "Saving..."
                  : "Save Now"}
              </button>

              {msg && (
                <p className="mt-4 text-sm opacity-70">
                  {msg}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CGPATracker;