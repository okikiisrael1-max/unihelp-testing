import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  Circle,
  CalendarDays,
  Sparkles,
  Target,
  AlarmClock,
  X,
  Loader2,
  Pencil,
  Filter,
  Flame,
  BellRing,
  Clock3,
  TimerReset,
  Bell,
  ClipboardList,
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
  where,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import { auth, db } from "../../firebase/config";

export default function Tasks({ dark = true }) {
  /* ======================================================
     STATES
  ====================================================== */

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  const [currentUser, setCurrentUser] =
    useState(null);

  const [
    reminderPermission,
    setReminderPermission,
  ] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Study",
    priority: "Medium",
    dueDate: "",
    reminderTime: "",
    completed: false,
  });

  /* ======================================================
     THEME
  ====================================================== */

  const theme = {
    bg: dark
      ? "bg-[#070B14] text-white"
      : "bg-[#F5F7FB] text-[#0f172a]",

    card: dark
      ? "bg-[#111827]/90 border border-white/10"
      : "bg-white border border-gray-200 shadow-sm",

    input: dark
      ? "bg-[#1A2333] border-white/10 text-white placeholder:text-gray-400"
      : "bg-gray-50 border-gray-200 text-[#0f172a] placeholder:text-gray-500",

    muted: dark
      ? "text-gray-400"
      : "text-gray-500",

    soft: dark
      ? "bg-white/5"
      : "bg-gray-50",

    modalBg: dark
      ? "bg-[#0B1220]"
      : "bg-white",
  };

  /* ======================================================
     NOTIFICATIONS
  ====================================================== */

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission ===
        "granted"
    ) {
      setReminderPermission(true);
    }
  }, []);

  const requestNotificationPermission =
    async () => {
      if (
        typeof window ===
          "undefined" ||
        !(
          "Notification" in window
        )
      ) {
        toast.error(
          "Notifications are not supported on this browser."
        );

        return;
      }

      try {
        const permission =
          await Notification.requestPermission();

        if (
          permission ===
          "granted"
        ) {
          setReminderPermission(
            true
          );

          new Notification(
            "UniHelp Notifications Enabled 🎉",
            {
              body: "Task reminders are now active.",
            }
          );
        }
      } catch (error) {
        console.log(error);
      }
    };

  /* ======================================================
     AUTH + REALTIME
  ====================================================== */

  useEffect(() => {
    let unsubscribeTasks = null;

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (user) => {
          setCurrentUser(user);

          if (!user) {
            setTasks([]);

            setLoading(false);

            if (
              unsubscribeTasks
            ) {
              unsubscribeTasks();
            }

            return;
          }

          setLoading(true);

          const tasksQuery =
            query(
              collection(
                db,
                "tasks"
              ),

              where(
                "userId",
                "==",
                user.uid
              ),

              orderBy(
                "createdAt",
                "desc"
              )
            );

          unsubscribeTasks =
            onSnapshot(
              tasksQuery,
              (
                snapshot
              ) => {
                const taskData =
                  snapshot.docs.map(
                    (
                      item
                    ) => ({
                      id: item.id,
                      ...item.data(),
                    })
                  );

                setTasks(
                  taskData
                );

                setLoading(
                  false
                );
              },

              (
                error
              ) => {
                console.log(
                  error
                );

                setLoading(
                  false
                );
              }
            );
        }
      );

    return () => {
      unsubscribeAuth();

      if (
        unsubscribeTasks
      ) {
        unsubscribeTasks();
      }
    };
  }, []);

  /* ======================================================
     REMINDERS
  ====================================================== */

  useEffect(() => {
    if (
      !reminderPermission ||
      tasks.length === 0
    )
      return;

    const interval =
      setInterval(() => {
        const now =
          new Date();

        tasks.forEach(
          async (
            task
          ) => {
            try {
              if (
                task.completed ||
                !task.dueDate ||
                task.notified
              ) {
                return;
              }

              const reminderDate =
                new Date(
                  `${task.dueDate}T${
                    task.reminderTime ||
                    "09:00"
                  }`
                );

              const diff =
                reminderDate -
                now;

              if (
                diff <=
                  5 *
                    60 *
                    1000 &&
                diff > 0
              ) {
                new Notification(
                  `⏰ ${task.title}`,
                  {
                    body:
                      task.description ||
                      "Task reminder",
                  }
                );

                await updateDoc(
                  doc(
                    db,
                    "tasks",
                    task.id
                  ),
                  {
                    notified: true,
                  }
                );
              }
            } catch (
              error
            ) {
              console.log(
                error
              );
            }
          }
        );
      }, 60000);

    return () =>
      clearInterval(
        interval
      );
  }, [
    tasks,
    reminderPermission,
  ]);

  /* ======================================================
     SAVE TASK
  ====================================================== */

  const handleSave =
    async () => {
      if (
        !form.title.trim()
      ) {
        toast.error(
          "Task title is required"
        );

        return;
      }

      if (
        !currentUser
      ) {
        toast.error(
          "Please login first"
        );

        return;
      }

      try {
        setSaving(true);

        const payload = {
          ...form,

          title:
            form.title.trim(),

          description:
            form.description.trim(),

          notified: false,

          updatedAt:
            serverTimestamp(),
        };

        if (
          editingTask
        ) {
          await updateDoc(
            doc(
              db,
              "tasks",
              editingTask.id
            ),

            payload
          );
        } else {
          await addDoc(
            collection(
              db,
              "tasks"
            ),

            {
              ...payload,

              userId:
                currentUser.uid,

              createdAt:
                serverTimestamp(),
            }
          );
        }

        resetModal();
      } catch (error) {
        console.log(error);

        toast.error(
          "Something went wrong"
        );
      } finally {
        setSaving(false);
      }
    };

  /* ======================================================
     DELETE
  ====================================================== */

  const handleDelete =
    async (id) => {
      const confirmDelete =
        window.confirm(
          "Delete this task?"
        );

      if (
        !confirmDelete
      )
        return;

      try {
        await deleteDoc(
          doc(
            db,
            "tasks",
            id
          )
        );
      } catch (error) {
        console.log(error);
      }
    };

  /* ======================================================
     COMPLETE
  ====================================================== */

  const toggleComplete =
    async (task) => {
      try {
        await updateDoc(
          doc(
            db,
            "tasks",
            task.id
          ),

          {
            completed:
              !task.completed,

            updatedAt:
              serverTimestamp(),
          }
        );
      } catch (error) {
        console.log(error);
      }
    };

  /* ======================================================
     EDIT
  ====================================================== */

  const handleEdit = (
    task
  ) => {
    setEditingTask(task);

    setForm({
      title:
        task.title || "",

      description:
        task.description ||
        "",

      category:
        task.category ||
        "Study",

      priority:
        task.priority ||
        "Medium",

      dueDate:
        task.dueDate || "",

      reminderTime:
        task.reminderTime ||
        "",

      completed:
        task.completed ||
        false,
    });

    setShowModal(true);
  };

  /* ======================================================
     RESET MODAL
  ====================================================== */

  const resetModal = () => {
    setEditingTask(null);

    setShowModal(false);

    setForm({
      title: "",
      description: "",
      category: "Study",
      priority: "Medium",
      dueDate: "",
      reminderTime: "",
      completed: false,
    });
  };

  /* ======================================================
     FILTER
  ====================================================== */

  const filteredTasks =
    useMemo(() => {
      return tasks.filter(
        (task) => {
          const matchesSearch =
            task.title
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||
            task.description
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              );

          const matchesFilter =
            filter === "all"
              ? true
              : filter ===
                "completed"
              ? task.completed
              : filter ===
                "pending"
              ? !task.completed
              : task.priority ===
                filter;

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      tasks,
      search,
      filter,
    ]);

  /* ======================================================
     STATS
  ====================================================== */

  const completedCount =
    tasks.filter(
      (task) =>
        task.completed
    ).length;

  const pendingCount =
    tasks.filter(
      (task) =>
        !task.completed
    ).length;

  const highPriority =
    tasks.filter(
      (task) =>
        task.priority ===
        "High"
    ).length;

  /* ======================================================
     HELPERS
  ====================================================== */

  const getPriorityStyle =
    (priority) => {
      switch (
        priority
      ) {
        case "High":
          return "bg-red-500/15 text-red-500 border border-red-500/20";

        case "Medium":
          return "bg-yellow-500/15 text-yellow-500 border border-yellow-500/20";

        default:
          return "bg-green-500/15 text-green-500 border border-green-500/20";
      }
    };

  const formatDate = (
    date
  ) => {
    if (!date) return "";

    return new Date(
      date
    ).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  /* ======================================================
     UI
  ====================================================== */

  return (
    <div
      className={`min-h-screen overflow-x-hidden md:pt-20 ${theme.bg}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        {/* HERO */}

        <div
          className={`relative overflow-hidden rounded-[30px] md:rounded-[36px] p-5 md:p-8 mb-8 ${theme.card}`}
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 md:h-16 md:w-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shrink-0">
                <ClipboardList />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                    My Tasks
                  </h1>

                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-semibold">
                    PRODUCTIVE
                  </span>
                </div>

                <p
                  className={`mt-3 max-w-2xl leading-relaxed text-sm md:text-base ${theme.muted}`}
                >
                  Organize assignments,
                  deadlines, exams and stay
                  productive daily.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              {!reminderPermission && (
                <button
                  onClick={
                    requestNotificationPermission
                  }
                  className="h-14 px-5 rounded-2xl bg-yellow-500 hover:bg-yellow-600 text-black font-semibold flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
                >
                  <Bell size={18} />

                  Enable Reminders
                </button>
              )}

              <button
                onClick={() =>
                  setShowModal(
                    true
                  )
                }
                className="h-14 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg transition-all w-full sm:w-auto"
              >
                <Plus size={18} />

                Add Task
              </button>
            </div>
          </div>
        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {[
            {
              label:
                "Total Tasks",

              value:
                tasks.length,

              icon: Target,

              color:
                "from-indigo-500 to-blue-500",
            },

            {
              label:
                "Completed",

              value:
                completedCount,

              icon:
                CheckCircle2,

              color:
                "from-green-500 to-emerald-500",
            },

            {
              label:
                "Pending",

              value:
                pendingCount,

              icon:
                AlarmClock,

              color:
                "from-yellow-500 to-orange-500",
            },

            {
              label:
                "High Priority",

              value:
                highPriority,

              icon: Flame,

              color:
                "from-red-500 to-pink-500",
            },
          ].map(
            (
              item,
              index
            ) => (
              <div
                key={
                  index
                }
                className={`${theme.card} rounded-[24px] md:rounded-[30px] p-4 md:p-5`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs md:text-sm opacity-60">
                      {
                        item.label
                      }
                    </p>

                    <h2 className="text-2xl md:text-3xl font-black mt-2">
                      {
                        item.value
                      }
                    </h2>
                  </div>

                  <div
                    className={`h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shrink-0`}
                  >
                    <item.icon />
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* SEARCH */}

        <div
          className={`${theme.card} rounded-[28px] p-4 mb-8`}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div
              className={`flex-1 h-14 rounded-2xl border px-4 flex items-center gap-3 ${theme.input}`}
            >
              <Search
                size={20}
                className="opacity-60 shrink-0"
              />

              <input
                placeholder="Search tasks..."
                className="bg-transparent outline-none w-full"
                value={search}
                onChange={(
                  e
                ) =>
                  setSearch(
                    e.target
                      .value
                  )
                }
              />
            </div>

            <div
              className={`h-14 rounded-2xl border px-4 flex items-center gap-3 ${theme.input} w-full lg:w-[240px]`}
            >
              <Filter
                size={18}
                className="opacity-60 shrink-0"
              />

              <select
                value={
                  filter
                }
                onChange={(
                  e
                ) =>
                  setFilter(
                    e.target
                      .value
                  )
                }
                className="bg-transparent outline-none w-full"
              >
                <option value="all">
                  All
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="High">
                  High Priority
                </option>

                <option value="Medium">
                  Medium Priority
                </option>

                <option value="Low">
                  Low Priority
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* TASKS */}

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin" />
          </div>
        ) : filteredTasks.length ===
          0 ? (
          <div
            className={`${theme.card} rounded-[36px] p-10 md:p-16 text-center`}
          >
            <Sparkles
              size={60}
              className="mx-auto opacity-30 mb-5"
            />

            <h2 className="text-2xl font-bold">
              No Tasks Found
            </h2>

            <p className="opacity-60 mt-2">
              Create your first task to
              stay productive.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTasks.map(
              (task) => (
                <div
                  key={
                    task.id
                  }
                  className={`${theme.card} rounded-[28px] p-5 relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />

                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <button
                      onClick={() =>
                        toggleComplete(
                          task
                        )
                      }
                      className="mt-1 shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="text-green-500" />
                      ) : (
                        <Circle className="opacity-50" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityStyle(
                            task.priority
                          )}`}
                        >
                          {
                            task.priority
                          }
                        </span>

                        <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-semibold border border-indigo-500/20">
                          {
                            task.category
                          }
                        </span>
                      </div>

                      <h2
                        className={`text-lg md:text-xl font-bold mt-4 leading-tight break-words ${
                          task.completed
                            ? "line-through opacity-50"
                            : ""
                        }`}
                      >
                        {
                          task.title
                        }
                      </h2>

                      <p className="opacity-70 mt-3 text-sm leading-relaxed break-words">
                        {
                          task.description
                        }
                      </p>
                    </div>
                  </div>

                  {task.dueDate && (
                    <div
                      className={`relative z-10 mt-6 rounded-2xl p-4 space-y-3 ${theme.soft}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm opacity-70">
                          <CalendarDays size={16} />

                          Due Date
                        </div>

                        <p className="text-sm font-semibold text-right">
                          {formatDate(
                            task.dueDate
                          )}
                        </p>
                      </div>

                      {task.reminderTime && (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2 text-sm opacity-70">
                            <TimerReset size={16} />

                            Reminder
                          </div>

                          <p className="text-sm font-semibold">
                            {
                              task.reminderTime
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="relative z-10 flex items-center justify-between mt-5 gap-4">
                    <div className="flex items-center gap-2 text-xs opacity-60">
                      <Clock3 size={14} />

                      Task Manager
                    </div>

                    {task.completed && (
                      <span className="text-xs text-green-500 font-semibold text-right">
                        Completed
                      </span>
                    )}
                  </div>

                  <div className="relative z-10 flex items-center gap-3 mt-6">
                    <button
                      onClick={() =>
                        handleEdit(
                          task
                        )
                      }
                      className="flex-1 h-12 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-medium flex items-center justify-center gap-2 transition-all"
                    >
                      <Pencil size={17} />

                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(
                          task.id
                        )
                      }
                      className="h-12 w-12 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* MODAL */}

      {showModal && (
        <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div
            className={`
              relative
              w-full
              max-w-2xl
              my-auto
              rounded-[30px]
              md:rounded-[36px]
              overflow-hidden
              shadow-2xl
              border
              flex
              flex-col
              max-h-[95vh]
              ${theme.modalBg}
              ${theme.card}
            `}
          >
            {/* HEADER */}

            <div className="flex items-center justify-between p-5 md:p-6 border-b border-white/10 shrink-0">
              <div className="min-w-0">
                <h2 className="text-2xl md:text-3xl font-black truncate">
                  {editingTask
                    ? "Edit Task"
                    : "Create Task"}
                </h2>

                <p className="text-sm opacity-60 mt-1">
                  Organize your daily
                  workflow
                </p>
              </div>

              <button
                onClick={resetModal}
                className="h-11 w-11 rounded-2xl hover:bg-white/10 flex items-center justify-center transition-all shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* SCROLLABLE CONTENT */}

            <div className="overflow-y-auto flex-1">
              <div className="p-5 md:p-6 space-y-5">
                {/* TITLE */}

                <div>
                  <label className="text-sm font-medium opacity-70">
                    Task Title
                  </label>

                  <input
                    placeholder="Complete assignment"
                    value={
                      form.title
                    }
                    onChange={(
                      e
                    ) =>
                      setForm(
                        {
                          ...form,
                          title:
                            e
                              .target
                              .value,
                        }
                      )
                    }
                    className={`mt-2 w-full h-14 rounded-2xl border px-4 outline-none ${theme.input}`}
                  />
                </div>

                {/* DESCRIPTION */}

                <div>
                  <label className="text-sm font-medium opacity-70">
                    Description
                  </label>

                  <textarea
                    placeholder="Write task details..."
                    value={
                      form.description
                    }
                    onChange={(
                      e
                    ) =>
                      setForm(
                        {
                          ...form,
                          description:
                            e
                              .target
                              .value,
                        }
                      )
                    }
                    className={`mt-2 w-full min-h-32 rounded-2xl border p-4 outline-none resize-none ${theme.input}`}
                  />
                </div>

                {/* GRID */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium opacity-70">
                      Category
                    </label>

                    <select
                      value={
                        form.category
                      }
                      onChange={(
                        e
                      ) =>
                        setForm(
                          {
                            ...form,
                            category:
                              e
                                .target
                                .value,
                          }
                        )
                      }
                      className={`mt-2 w-full h-14 rounded-2xl border px-4 outline-none ${theme.input}`}
                    >
                      <option>
                        Study
                      </option>

                      <option>
                        Assignment
                      </option>

                      <option>
                        Exam
                      </option>

                      <option>
                        Personal
                      </option>

                      <option>
                        Project
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium opacity-70">
                      Priority
                    </label>

                    <select
                      value={
                        form.priority
                      }
                      onChange={(
                        e
                      ) =>
                        setForm(
                          {
                            ...form,
                            priority:
                              e
                                .target
                                .value,
                          }
                        )
                      }
                      className={`mt-2 w-full h-14 rounded-2xl border px-4 outline-none ${theme.input}`}
                    >
                      <option>
                        High
                      </option>

                      <option>
                        Medium
                      </option>

                      <option>
                        Low
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium opacity-70">
                      Due Date
                    </label>

                    <input
                      type="date"
                      value={
                        form.dueDate
                      }
                      onChange={(
                        e
                      ) =>
                        setForm(
                          {
                            ...form,
                            dueDate:
                              e
                                .target
                                .value,
                          }
                        )
                      }
                      className={`mt-2 w-full h-14 rounded-2xl border px-4 outline-none ${theme.input}`}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium opacity-70">
                      Reminder Time
                    </label>

                    <input
                      type="time"
                      value={
                        form.reminderTime
                      }
                      onChange={(
                        e
                      ) =>
                        setForm(
                          {
                            ...form,
                            reminderTime:
                              e
                                .target
                                .value,
                          }
                        )
                      }
                      className={`mt-2 w-full h-14 rounded-2xl border px-4 outline-none ${theme.input}`}
                    />
                  </div>
                </div>

                {/* SMART REMINDER */}

                <div
                  className={`rounded-2xl p-4 flex items-start gap-3 ${
                    dark
                      ? "bg-indigo-500/10"
                      : "bg-indigo-50"
                  }`}
                >
                  <BellRing className="text-indigo-500 shrink-0 mt-1" />

                  <div>
                    <h3 className="font-semibold">
                      Smart Reminder
                    </h3>

                    <p className="text-sm opacity-70 mt-1 leading-relaxed">
                      Your browser will
                      send reminders before
                      your task is due.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="p-5 md:p-6 border-t border-white/10 shrink-0">
              <button
                onClick={
                  handleSave
                }
                disabled={saving}
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" />

                    Saving...
                  </>
                ) : (
                  <>
                    <Plus size={18} />

                    {editingTask
                      ? "Update Task"
                      : "Create Task"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}