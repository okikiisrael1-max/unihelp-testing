import { useEffect, useState } from "react";

import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";

import { db, auth } from "../../firebase/config";

import {
  Clock3,
  CheckCircle2,
  BookOpen,
  Download,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import { Link } from "react-router-dom";

export default function StudentPurchases({
  dark,
}) {
  const [purchases, setPurchases] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  // ============================
  // FETCH PURCHASES
  // ============================
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "purchases"),
      where(
        "userId",
        "==",
        auth.currentUser.uid
      ),
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

  const approvedCount =
    purchases.filter(
      (item) => item.status === "approved"
    ).length;

  return (
    <div
      className={`min-h-screen md:pt-20 transition-all duration-300 ${
        dark
          ? "bg-[#020617] text-white"
          : "bg-[#f8fafc] text-black"
      }`}
    >
      {/* ======================= */}
      {/* BACKGROUND GLOW */}
      {/* ======================= */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-500/20 blur-3xl rounded-full" />

        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-purple-500/20 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ======================= */}
        {/* HERO */}
        {/* ======================= */}
        <div
          className={`relative overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10 mb-8 border backdrop-blur-xl ${
            dark
              ? "bg-white/5 border-white/10"
              : "bg-white border-gray-200"
          }`}
        >
          {/* Glow */}
          <div className="absolute top-0 right-0 w-52 h-52 bg-blue-500/20 blur-3xl rounded-full" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* LEFT */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 text-sm font-semibold mb-5">
                <Sparkles size={16} />
                Student Learning Center
              </div>

              <h1 className="text-4xl sm:text-5xl font-black leading-tight">
                My Purchases
              </h1>

              <p className="mt-4 max-w-2xl text-base sm:text-lg opacity-70 leading-relaxed">
                Access your purchased tutorials,
                payment proofs, and approved
                learning materials instantly.
              </p>

              <div className="flex flex-wrap gap-4 mt-7">
                <Link
                  to="/tutorialmarketplace"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-[1.02]"
                >
                  Browse Tutorials
                  <ArrowRight size={18} />
                </Link>

                <div
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl border ${
                    dark
                      ? "border-white/10 bg-white/5"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <ShieldCheck
                    size={18}
                    className="text-green-500"
                  />
                  Secure Purchases
                </div>
              </div>
            </div>

            {/* RIGHT STATS */}
            <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
              <div
                className={`rounded-3xl p-5 min-w-[170px] border backdrop-blur-xl ${
                  dark
                    ? "bg-white/5 border-white/10"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="text-sm opacity-70 mb-2">
                  Total Purchases
                </div>

                <div className="text-4xl font-black">
                  {purchases.length}
                </div>
              </div>

              <div
                className={`rounded-3xl p-5 min-w-[170px] border backdrop-blur-xl ${
                  dark
                    ? "bg-white/5 border-white/10"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="text-sm opacity-70 mb-2">
                  Approved
                </div>

                <div className="text-4xl font-black text-green-500">
                  {approvedCount}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================= */}
        {/* LOADING */}
        {/* ======================= */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-28">
            <div
              className={`p-5 rounded-full mb-5 ${
                dark
                  ? "bg-white/5"
                  : "bg-white"
              }`}
            >
              <Loader2
                size={40}
                className="animate-spin text-blue-500"
              />
            </div>

            <h2 className="text-2xl font-bold mb-2">
              Loading Purchases
            </h2>

            <p className="opacity-60">
              Please wait while we fetch your
              tutorials...
            </p>
          </div>
        )}

        {/* ======================= */}
        {/* EMPTY */}
        {/* ======================= */}
        {!loading &&
          purchases.length === 0 && (
            <div
              className={`relative overflow-hidden rounded-[2rem] p-10 sm:p-16 text-center border ${
                dark
                  ? "bg-white/5 border-white/10"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="absolute top-0 right-0 w-56 h-56 bg-blue-500/10 blur-3xl rounded-full" />

              <div className="relative z-10">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-blue-500/10 flex items-center justify-center mb-6">
                  <ShoppingBag
                    size={45}
                    className="text-blue-500"
                  />
                </div>

                <h2 className="text-3xl font-black mb-4">
                  No Purchases Yet
                </h2>

                <p className="opacity-70 max-w-lg mx-auto mb-8 text-lg">
                  Start learning by exploring
                  premium tutorials from top
                  creators and students.
                </p>

                <Link
                  to="/tutorial-marketplace"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-7 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-[1.03]"
                >
                  Explore Tutorials
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          )}

        {/* ======================= */}
        {/* PURCHASE GRID */}
        {/* ======================= */}
        {!loading &&
          purchases.length > 0 && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {purchases.map((purchase) => {
                const approved =
                  purchase.status ===
                  "approved";

                return (
                  <div
                    key={purchase.id}
                    className={`group relative overflow-hidden rounded-[2rem] border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
                      dark
                        ? "bg-white/5 border-white/10 hover:bg-white/[0.07]"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {/* TOP BAR */}
                    <div
                      className={`h-2 w-full ${
                        approved
                          ? "bg-gradient-to-r from-green-500 to-emerald-400"
                          : "bg-gradient-to-r from-yellow-500 to-orange-400"
                      }`}
                    />

                    {/* CONTENT */}
                    <div className="p-6">
                      {/* STATUS + PRICE */}
                      <div className="flex items-start justify-between gap-4 mb-5">
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
                          <p className="text-xs opacity-60 mb-1">
                            Amount
                          </p>

                          <h3 className="text-2xl font-black text-blue-500">
                            ₦
                            {purchase.amount?.toLocaleString?.() ||
                              purchase.amount}
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
                      <p className="mt-3 opacity-60 text-sm break-all">
                        {purchase.userEmail}
                      </p>

                      {/* INFO BOX */}
                      <div
                        className={`mt-5 rounded-2xl p-4 border ${
                          dark
                            ? "bg-[#0f172a]/70 border-white/10"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-3 rounded-xl ${
                              approved
                                ? "bg-green-500/10 text-green-500"
                                : "bg-yellow-500/10 text-yellow-500"
                            }`}
                          >
                            {approved ? (
                              <BookOpen
                                size={20}
                              />
                            ) : (
                              <Clock3
                                size={20}
                              />
                            )}
                          </div>

                          <div>
                            <h4 className="font-semibold">
                              {approved
                                ? "Tutorial Unlocked"
                                : "Awaiting Approval"}
                            </h4>

                            <p className="text-sm opacity-60">
                              {approved
                                ? "You now have full access."
                                : "Admin verification in progress."}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="mt-6 flex flex-col gap-3">
                        {/* OPEN */}
                        {approved && (
                          <Link
                            to={`/tutorial/${purchase.tutorialId}`}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-[1.02]"
                          >
                            <BookOpen
                              size={18}
                            />
                            Open Tutorial
                          </Link>
                        )}

                        {/* PENDING */}
                        {!approved && (
                          <div className="w-full text-center bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 py-4 rounded-2xl font-medium">
                            Payment under review
                          </div>
                        )}

                        {/* RECEIPT */}
                        <a
                          href={
                            purchase.proofUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                            dark
                              ? "bg-[#0f172a] hover:bg-[#162033]"
                              : "bg-gray-100 hover:bg-gray-200"
                          }`}
                        >
                          <Download
                            size={18}
                          />
                          View Payment Proof
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}