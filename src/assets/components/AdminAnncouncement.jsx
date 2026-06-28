import { useEffect, useMemo, useState } from "react";

import {
  Plus,
  Trash2,
  Megaphone,
  CalendarDays,
  Clock3,
  Search,
  Loader2,
  Pin,
  Eye,
  BellRing,
  Sparkles,
  ShieldCheck,
  Send,
  X,
  Pencil,
} from "lucide-react";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "../../firebase/config";

export default function AdminAnnouncements({
  dark,
}) {
  /* ======================================================
     STATES
  ====================================================== */

  const [loading, setLoading] =
    useState(true);

  const [posting, setPosting] =
    useState(false);

  const [announcements, setAnnouncements] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] = useState({
    title: "",
    message: "",
    category: "General",
    expiresIn: "24",
    pinned: false,
  });

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  /* ======================================================
     THEME
  ====================================================== */

  const bg = dark
    ? "bg-[#070b14] text-white"
    : "bg-[#f4f7fb] text-[#0f172a]";

  const card = dark
    ? "bg-[#111827]/90 border border-white/10"
    : "bg-white border border-gray-200";

  const input = dark
    ? "bg-[#1a2333] border-white/10 text-white placeholder:text-gray-400"
    : "bg-gray-50 border-gray-200 text-black placeholder:text-gray-500";

  const fetchAnnouncements =
    async () => {
      setLoading(true);

      try {
        const q = query(
          collection(
            db,
            "announcements"
          ),
          orderBy(
            "createdAt",
            "desc"
          )
        );

        const snap =
          await getDocs(q);

        const now =
          Date.now();

        const data = [];

        for (const d of snap.docs) {
          const item = {
            id: d.id,
            ...d.data(),
          };

          if (
            item.expiresAt?.seconds *
              1000 <
            now
          ) {
            await deleteDoc(
              doc(
                db,
                "announcements",
                item.id
              )
            );

            continue;
          }

          data.push(item);
        }

        setAnnouncements(data);
      } catch (err) {
        console.log(err);
      }

      setLoading(false);
    };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  /* ======================================================
     FILTER
  ====================================================== */

  const filtered =
    useMemo(() => {
      return announcements.filter(
        (a) =>
          a.title
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||
          a.message
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||
          a.category
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );
    }, [
      announcements,
      search,
    ]);

  /* ======================================================
     POST
  ====================================================== */

  const handlePost =
    async () => {
      if (
        !form.title ||
        !form.message
      ) {
        return alert(
          "Fill all required fields"
        );
      }

      setPosting(true);

      try {
        const hours =
          Number(
            form.expiresIn
          ) || 24;

        const expires =
          Timestamp.fromDate(
            new Date(
              Date.now() +
                hours *
                  60 *
                  60 *
                  1000
            )
          );

        // EDIT
        if (editingId) {
          await updateDoc(
            doc(
              db,
              "announcements",
              editingId
            ),
            {
              ...form,
              expiresAt:
                expires,
              updatedAt:
                serverTimestamp(),
            }
          );
        }

        // CREATE
        else {
          const announcementRef =
            await addDoc(
            collection(
              db,
              "announcements"
            ),
            {
              ...form,
              views: 0,
              createdAt:
                serverTimestamp(),
              expiresAt:
                expires,
            }
          );

          try {
            await fetch(
              `${API_URL}/api/notifications/broadcast`,
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  title: form.title,
                  body: form.message,
                  category: form.category,
                  announcementId:
                    announcementRef.id,
                  url: "/announcements",
                }),
              }
            );
          } catch (notificationError) {
            console.log(
              "Notification broadcast failed:",
              notificationError
            );
          }
        }

        setForm({
          title: "",
          message: "",
          category:
            "General",
          expiresIn: "24",
          pinned: false,
        });

        setEditingId(
          null
        );

        setShowModal(
          false
        );

        fetchAnnouncements();
      } catch (err) {
        console.log(err);
      }

      setPosting(false);
    };

  /* ======================================================
     DELETE
  ====================================================== */

  const handleDelete =
    async (id) => {
      const ok =
        window.confirm(
          "Delete this announcement?"
        );

      if (!ok) return;

      try {
        await deleteDoc(
          doc(
            db,
            "announcements",
            id
          )
        );

        setAnnouncements(
          (
            prev
          ) =>
            prev.filter(
              (
                item
              ) =>
                item.id !==
                id
            )
        );
      } catch (err) {
        console.log(err);
      }
    };

  /* ======================================================
     EDIT
  ====================================================== */

  const handleEdit =
    (item) => {
      setEditingId(
        item.id
      );

      setForm({
        title:
          item.title,
        message:
          item.message,
        category:
          item.category,
        expiresIn:
          item.expiresIn ||
          "24",
        pinned:
          item.pinned ||
          false,
      });

      setShowModal(
        true
      );
    };

  /* ======================================================
     DATE
  ====================================================== */

  const formatDate = (
    timestamp
  ) => {
    if (
      !timestamp
        ?.seconds
    )
      return "Now";

    return new Date(
      timestamp.seconds *
        1000
    ).toLocaleString();
  };

  return (
    <div
      className={`min-h-screen ${bg}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ======================================================
            HERO
        ====================================================== */}

        <div
          className={`relative overflow-hidden rounded-4xl p-6 sm:p-8 mb-8 ${card}`}>
          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">

            {/* LEFT */}

            <div className="flex items-start gap-4">

              <div className="h-16 w-16 rounded-3xl bg-indigo-600 flex items-center shrink-0 justify-center shadow-xl">
                <Megaphone className="text-white" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-3xl sm:text-4xl font-black">
                    Announcement
                    Admin
                  </h1>

                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-semibold">
                    ADMIN
                  </span>
                </div>

                <p className="opacity-70 mt-2 max-w-2xl">
                  Post campus updates,
                  notices, schedules,
                  emergency alerts and
                  announcements.
                </p>
              </div>
            </div>

            {/* RIGHT */}

            <button
              onClick={() =>
                setShowModal(
                  true
                )
              }
              className="h-14 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg"
            >
              <Plus size={18} />
              New Announcement
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

          {[
            {
              label:
                "Total Posts",
              value:
                announcements.length,
              icon: BellRing,
              color:
                "from-indigo-500 to-blue-500",
            },
            {
              label:
                "Pinned",
              value:
                announcements.filter(
                  (
                    a
                  ) =>
                    a.pinned
                ).length,
              icon: Pin,
              color:
                "from-yellow-500 to-orange-500",
            },
            {
              label:
                "Categories",
              value:
                new Set(
                  announcements.map(
                    (
                      a
                    ) =>
                      a.category
                  )
                ).size,
              icon: Sparkles,
              color:
                "from-pink-500 to-purple-500",
            },
            {
              label:
                "Active",
              value:
                announcements.length,
              icon: ShieldCheck,
              color:
                "from-green-500 to-emerald-500",
            },
          ].map(
            (
              item,
              i
            ) => (
              <div
                key={i}
                className={`${card} rounded-3xl p-5`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-60">
                      {
                        item.label
                      }
                    </p>

                    <h2 className="text-3xl font-black mt-2">
                      {
                        item.value
                      }
                    </h2>
                  </div>

                  <div
                    className={`h-14 w-14 rounded-2xl bg-linear-to-br ${item.color} flex items-center justify-center text-white`}
                  >
                    <item.icon />
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* ======================================================
            SEARCH
        ====================================================== */}

        <div
          className={`${card} rounded-3xl p-4 mb-8`}
        >
          <div
            className={`flex items-center gap-3 h-14 px-4 rounded-2xl border ${input}`}
          >
            <Search
              size={20}
              className="opacity-60"
            />

            <input
              placeholder="Search announcements..."
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
        </div>

        {/* ======================================================
            LIST
        ====================================================== */}

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin" />
          </div>
        ) : filtered.length ===
          0 ? (
          <div
            className={`${card} rounded-4xl p-8 text-center sm:p-10`}
          >
            <Megaphone
              size={60}
              className="mx-auto opacity-30 mb-5"
            />

            <h2 className="text-2xl font-bold">
              No Announcements
            </h2>

            <p className="opacity-60 mt-2">
              Start posting campus
              updates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filtered.map(
              (
                item
              ) => (
                <div
                  key={
                    item.id
                  }
                  className={`${card} rounded-[30px] p-6 relative overflow-hidden`}
                >
                  {/* GLOW */}

                  <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />

                  {/* TOP */}

                  <div className="relative z-10 flex items-start justify-between gap-4">

                    <div className="flex-1">

                      <div className="flex items-center gap-2 flex-wrap">

                        {item.pinned && (
                          <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-semibold flex items-center gap-1">
                            <Pin size={12} />
                            Pinned
                          </span>
                        )}

                        <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-semibold">
                          {
                            item.category
                          }
                        </span>
                      </div>

                      <h2 className="text-2xl font-bold mt-4 leading-tight">
                        {
                          item.title
                        }
                      </h2>

                      <p className="opacity-70 mt-3 leading-relaxed whitespace-pre-line">
                        {
                          item.message
                        }
                      </p>
                    </div>

                    {/* ACTIONS */}

                    <div className="flex items-center gap-2">

                      <button
                        onClick={() =>
                          handleEdit(
                            item
                          )
                        }
                        className="h-11 w-11 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 flex items-center justify-center"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(
                            item.id
                          )
                        }
                        className="h-11 w-11 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* FOOTER */}

                  <div className="relative z-10 mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">

                    <div
                      className={`rounded-2xl p-4 ${
                        dark
                          ? "bg-white/5"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm opacity-60">
                        <CalendarDays size={15} />
                        Posted
                      </div>

                      <p className="mt-2 text-sm font-medium">
                        {formatDate(
                          item.createdAt
                        )}
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl p-4 ${
                        dark
                          ? "bg-white/5"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm opacity-60">
                        <Clock3 size={15} />
                        Expires
                      </div>

                      <p className="mt-2 text-sm font-medium">
                        {formatDate(
                          item.expiresAt
                        )}
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl p-4 ${
                        dark
                          ? "bg-white/5"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm opacity-60">
                        <Eye size={15} />
                        Views
                      </div>

                      <p className="mt-2 text-sm font-medium">
                        {item.views ||
                          0}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* ======================================================
          MODAL
      ====================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-[501] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div
            className={`w-full max-w-2xl overflow-hidden rounded-4xl shadow-2xl ${card}`}>
            {/* HEADER */}

            <div className="flex items-center justify-between p-6 border-b border-white/10">

              <div>
                <h2 className="text-2xl font-bold">
                  {editingId
                    ? "Edit Announcement"
                    : "Create Announcement"}
                </h2>

                <p className="text-sm opacity-60 mt-1">
                  Post important campus
                  updates
                </p>
              </div>

              <button
                onClick={() => {
                  setShowModal(
                    false
                  );

                  setEditingId(
                    null
                  );
                }}
                className="h-11 w-11 rounded-2xl hover:bg-white/10 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            {/* BODY */}

            <div className="p-6 space-y-5">

              {/* TITLE */}

              <div>
                <label className="text-sm font-medium opacity-70">
                  Announcement Title
                </label>

                <input
                  placeholder="Examination Timetable Released"
                  value={form.title}
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      title:
                        e.target
                          .value,
                    })
                  }
                  className={`mt-2 w-full h-14 rounded-2xl border px-4 outline-none ${input}`}
                />
              </div>

              {/* MESSAGE */}

              <div>
                <label className="text-sm font-medium opacity-70">
                  Message
                </label>

                <textarea
                  placeholder="Write announcement..."
                  value={form.message}
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      message:
                        e.target
                          .value,
                    })
                  }
                  className={`mt-2 w-full min-h-40 rounded-2xl border p-4 outline-none resize-none ${input}`}
                />
              </div>

              {/* GRID */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* CATEGORY */}

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
                      setForm({
                        ...form,
                        category:
                          e.target
                            .value,
                      })
                    }
                    className={`mt-2 w-full h-14 rounded-2xl border px-4 outline-none ${input}`}
                  >
                    <option>
                      General
                    </option>

                    <option>
                      Exams
                    </option>

                    <option>
                      Events
                    </option>

                    <option>
                      Emergency
                    </option>

                    <option>
                      Academic
                    </option>

                    <option>
                      Hostel
                    </option>
                  </select>
                </div>

                {/* EXPIRY */}

                <div>
                  <label className="text-sm font-medium opacity-70">
                    Auto Delete
                    (Hours)
                  </label>

                  <select
                    value={
                      form.expiresIn
                    }
                    onChange={(
                      e
                    ) =>
                      setForm({
                        ...form,
                        expiresIn:
                          e.target
                            .value,
                      })
                    }
                    className={`mt-2 w-full h-14 rounded-2xl border px-4 outline-none ${input}`}
                  >
                    <option value="6">
                      6 Hours
                    </option>

                    <option value="12">
                      12 Hours
                    </option>

                    <option value="24">
                      24 Hours
                    </option>

                    <option value="48">
                      48 Hours
                    </option>

                    <option value="72">
                      72 Hours
                    </option>

                    <option value="168">
                      7 Days
                    </option>
                  </select>
                </div>
              </div>

              {/* PIN */}

              <div
                className={`rounded-2xl p-4 flex items-center justify-between ${
                  dark
                    ? "bg-white/5"
                    : "bg-gray-50"
                }`}
              >
                <div>
                  <h3 className="font-semibold">
                    Pin Announcement
                  </h3>

                  <p className="text-sm opacity-60 mt-1">
                    Keep this announcement
                    at the top
                  </p>
                </div>

                <button
                  onClick={() =>
                    setForm({
                      ...form,
                      pinned:
                        !form.pinned,
                    })
                  }
                  className={`w-16 h-9 rounded-full transition relative ${
                    form.pinned
                      ? "bg-indigo-600"
                      : "bg-gray-400"
                  }`}
                >
                  <div
                    className={`absolute top-1 h-7 w-7 rounded-full bg-white transition ${
                      form.pinned
                        ? "translate-x-8"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* BUTTON */}

              <button
                onClick={
                  handlePost
                }
                disabled={
                  posting
                }
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2"
              >
                {posting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    {editingId
                      ? "Update Announcement"
                      : "Publish Announcement"}
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
