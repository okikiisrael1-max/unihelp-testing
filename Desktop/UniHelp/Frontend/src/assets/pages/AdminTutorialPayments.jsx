import { useEffect, useMemo, useState } from "react";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "../../firebase/config";

import {
  ShieldCheck,
  Loader2,
  Clock3,
  CheckCircle2,
  XCircle,
  Search,
  Sparkles,
  Eye,
  Trash2,
  Wallet,
  BookOpen,
  User2,
  CreditCard,
  Download,
  Filter,
} from "lucide-react";

export default function AdminTutorialPayments({
  dark,
}) {
  const [purchases, setPurchases] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  /* =========================
     FETCH PURCHASES
  ========================= */
  useEffect(() => {
    const q = query(
      collection(db, "purchases"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPurchases(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* =========================
     APPROVE
  ========================= */
  const handleApprove = async (id) => {
    try {
      await updateDoc(
        doc(db, "purchases", id),
        {
          status: "approved",
        }
      );
    } catch (err) {
      console.error(err);
      alert("Approval failed");
    }
  };

  /* =========================
     REJECT
  ========================= */
  const handleReject = async (id) => {
    try {
      const confirmDelete =
        window.confirm(
          "Reject and delete this payment request?"
        );

      if (!confirmDelete) return;

      await deleteDoc(
        doc(db, "purchases", id)
      );
    } catch (err) {
      console.error(err);
      alert("Failed");
    }
  };

  /* =========================
     FILTERED DATA
  ========================= */
  const filteredPurchases =
    useMemo(() => {
      return purchases.filter((item) => {
        const matchesSearch =
          item.tutorialTitle
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||
          item.userEmail
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            );

        const matchesFilter =
          filter === "all"
            ? true
            : item.status === filter;

        return (
          matchesSearch &&
          matchesFilter
        );
      });
    }, [purchases, search, filter]);

  /* =========================
     STATS
  ========================= */
  const stats = useMemo(() => {
    const approved = purchases.filter(
      (item) =>
        item.status === "approved"
    );

    const pending = purchases.filter(
      (item) =>
        item.status === "pending"
    );

    const revenue = approved.reduce(
      (acc, item) =>
        acc + (item.amount || 0),
      0
    );

    return {
      total: purchases.length,
      approved: approved.length,
      pending: pending.length,
      revenue,
    };
  }, [purchases]);

  const bg = dark
    ? "bg-[#020617] text-white"
    : "bg-[#f8fafc] text-black";

  const card = dark
    ? "bg-white/5 border-white/10 backdrop-blur-xl"
    : "bg-white border-gray-200";

  return (
    <div
      className={`min-h-screen overflow-hidden ${bg}`}
    >
      {/* BACKGROUND */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[450px] h-[450px] bg-blue-500/20 blur-3xl rounded-full" />

        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-purple-500/20 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ========================= */}
        {/* HERO */}
        {/* ========================= */}
        <div
          className={`rounded-[2rem] border p-6 sm:p-8 lg:p-10 mb-8 overflow-hidden relative ${card}`}
        >
          <div className="absolute top-0 right-0 w-60 h-60 bg-blue-500/20 blur-3xl rounded-full" />

          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
            {/* LEFT */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-5">
                <Sparkles size={16} />
                Admin Control Center
              </div>

              <h1 className="text-4xl sm:text-5xl font-black leading-tight">
                Tutorial Payments
              </h1>

              <p className="mt-4 text-base sm:text-lg opacity-70 max-w-2xl">
                Manage payment proofs, approve
                student purchases, and monitor
                tutorial revenue across the
                platform.
              </p>
            </div>

            {/* RIGHT */}
            <div
              className={`rounded-[2rem] border p-6 min-w-[300px] ${card}`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
                  <ShieldCheck className="text-green-500" />
                </div>

                <div>
                  <h3 className="text-xl font-bold">
                    Admin Access
                  </h3>

                  <p className="opacity-60 text-sm">
                    Secure moderation panel
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="opacity-70">
                    Total Requests
                  </span>

                  <span className="font-bold text-xl">
                    {stats.total}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="opacity-70">
                    Approved
                  </span>

                  <span className="font-bold text-xl text-green-500">
                    {stats.approved}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="opacity-70">
                    Pending
                  </span>

                  <span className="font-bold text-xl text-yellow-500">
                    {stats.pending}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================= */}
        {/* STATS */}
        {/* ========================= */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard
            dark={dark}
            title="Total Payments"
            value={stats.total}
            icon={CreditCard}
            color="text-blue-500"
            bg="bg-blue-500/10"
          />

          <StatCard
            dark={dark}
            title="Approved"
            value={stats.approved}
            icon={CheckCircle2}
            color="text-green-500"
            bg="bg-green-500/10"
          />

          <StatCard
            dark={dark}
            title="Pending"
            value={stats.pending}
            icon={Clock3}
            color="text-yellow-500"
            bg="bg-yellow-500/10"
          />

          <StatCard
            dark={dark}
            title="Revenue"
            value={`₦${stats.revenue.toLocaleString()}`}
            icon={Wallet}
            color="text-purple-500"
            bg="bg-purple-500/10"
          />
        </div>

        {/* ========================= */}
        {/* FILTERS */}
        {/* ========================= */}
        <div
          className={`rounded-[2rem] border p-5 mb-8 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between ${card}`}
        >
          {/* SEARCH */}
          <div
            className={`flex items-center gap-3 rounded-2xl px-5 h-14 flex-1 max-w-2xl ${
              dark
                ? "bg-[#0f172a]"
                : "bg-gray-100"
            }`}
          >
            <Search
              size={20}
              className="opacity-60"
            />

            <input
              type="text"
              placeholder="Search tutorial or student email..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="bg-transparent outline-none w-full"
            />
          </div>

          {/* FILTER */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 opacity-70">
              <Filter size={18} />
              Filter
            </div>

            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value)
              }
              className={`h-14 px-5 rounded-2xl outline-none ${
                dark
                  ? "bg-[#0f172a]"
                  : "bg-gray-100"
              }`}
            >
              <option value="all">
                All
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="pending">
                Pending
              </option>
            </select>
          </div>
        </div>

        {/* ========================= */}
        {/* LOADING */}
        {/* ========================= */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-28">
            <Loader2
              size={45}
              className="animate-spin text-blue-500"
            />

            <p className="opacity-60 mt-5">
              Loading payments...
            </p>
          </div>
        )}

        {/* ========================= */}
        {/* EMPTY */}
        {/* ========================= */}
        {!loading &&
          filteredPurchases.length ===
            0 && (
            <div
              className={`rounded-[2rem] border p-16 text-center ${card}`}
            >
              <div className="w-24 h-24 rounded-3xl bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
                <BookOpen
                  size={45}
                  className="text-blue-500"
                />
              </div>

              <h2 className="text-3xl font-black">
                No Payments Found
              </h2>

              <p className="opacity-70 mt-3">
                No purchase requests available
                right now.
              </p>
            </div>
          )}

        {/* ========================= */}
        {/* PAYMENT GRID */}
        {/* ========================= */}
        {!loading &&
          filteredPurchases.length >
            0 && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPurchases.map(
                (purchase) => {
                  const approved =
                    purchase.status ===
                    "approved";

                  return (
                    <div
                      key={purchase.id}
                      className={`rounded-[2rem] border overflow-hidden transition-all duration-300 hover:-translate-y-2 ${card}`}
                    >
                      {/* TOP BAR */}
                      <div
                        className={`h-2 w-full ${
                          approved
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }`}
                      />

                      <div className="p-6">
                        {/* STATUS */}
                        <div className="flex items-center justify-between mb-5">
                          <div
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                              approved
                                ? "bg-green-500/10 text-green-500"
                                : "bg-yellow-500/10 text-yellow-500"
                            }`}
                          >
                            {approved ? (
                              <>
                                <CheckCircle2
                                  size={16}
                                />
                                Approved
                              </>
                            ) : (
                              <>
                                <Clock3
                                  size={16}
                                />
                                Pending
                              </>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="text-xs opacity-50">
                              Amount
                            </p>

                            <h3 className="text-2xl font-black text-blue-500">
                              ₦
                              {purchase.amount?.toLocaleString?.() ||
                                "0"}
                            </h3>
                          </div>
                        </div>

                        {/* TITLE */}
                        <h2 className="text-2xl font-black leading-tight line-clamp-2">
                          {
                            purchase.tutorialTitle
                          }
                        </h2>

                        {/* EMAIL */}
                        <div className="flex items-center gap-3 mt-5">
                          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                            <User2
                              size={20}
                              className="text-blue-500"
                            />
                          </div>

                          <div>
                            <p className="text-sm opacity-60">
                              Student Email
                            </p>

                            <p className="font-semibold break-all">
                              {
                                purchase.userEmail
                              }
                            </p>
                          </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="mt-6 space-y-3">
                          {/* VIEW PROOF */}
                          <a
                            href={
                              purchase.proofUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-semibold transition-all duration-300 ${
                              dark
                                ? "bg-[#0f172a] hover:bg-[#162033]"
                                : "bg-gray-100 hover:bg-gray-200"
                            }`}
                          >
                            <Eye size={18} />
                            View Proof
                          </a>

                          {/* DOWNLOAD */}
                          <a
                            href={
                              purchase.proofUrl
                            }
                            download
                            className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-semibold transition-all duration-300 ${
                              dark
                                ? "bg-[#0f172a] hover:bg-[#162033]"
                                : "bg-gray-100 hover:bg-gray-200"
                            }`}
                          >
                            <Download
                              size={18}
                            />
                            Download Proof
                          </a>

                          {/* APPROVE */}
                          {!approved && (
                            <button
                              onClick={() =>
                                handleApprove(
                                  purchase.id
                                )
                              }
                              className="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center gap-3 transition-all duration-300"
                            >
                              <CheckCircle2
                                size={20}
                              />
                              Approve Payment
                            </button>
                          )}

                          {/* REJECT */}
                          <button
                            onClick={() =>
                              handleReject(
                                purchase.id
                              )
                            }
                            className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center gap-3 transition-all duration-300"
                          >
                            <Trash2 size={18} />
                            {approved
                              ? "Delete Record"
                              : "Reject Payment"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
      </div>
    </div>
  );
}

/* =========================
   STAT CARD
========================= */
function StatCard({
  dark,
  title,
  value,
  icon: Icon,
  color,
  bg,
}) {
  return (
    <div
      className={`rounded-[2rem] border p-6 transition-all duration-300 hover:-translate-y-1 ${
        dark
          ? "bg-white/5 border-white/10"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-70">
            {title}
          </p>

          <h2 className="text-4xl font-black mt-3">
            {value}
          </h2>
        </div>

        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center ${bg}`}
        >
          <Icon className={color} />
        </div>
      </div>
    </div>
  );
}